/* ============================================================================
   LifeScope — Tim Warkab
   Seluruh inferensi berjalan di peramban: evaluasi pohon keputusan, nilai
   harapan pada skala ordinal E[y] = Σ pₖ·k, lalu pemotongan dengan tiga
   ambang batas. Tidak ada permintaan jaringan setelah muat awal.
   ========================================================================== */
'use strict';

const NS = 'http://www.w3.org/2000/svg';
const NAMA = ['Sangat puas', 'Puas', 'Tidak puas', 'Sangat tidak puas'];
const FLAT = ['#277a66', '#7dab97', '#dda257', '#b33a22'];          /* untuk isian rata */
const GRAD = ['url(#PFXg1)', 'url(#PFXg2)', 'url(#PFXg3)', 'url(#PFXg4)'];
const RAMP = [                                                       /* berhenti gradien */
  ['oklch(0.595 0.098 172)', 'oklch(0.482 0.084 176)'],
  ['oklch(0.762 0.070 162)', 'oklch(0.662 0.064 164)'],
  ['oklch(0.812 0.128 72)',  'oklch(0.726 0.132 68)'],
  ['oklch(0.598 0.166 32)',  'oklch(0.498 0.168 29)']
];
const CSSG = ['var(--g1)', 'var(--g2)', 'var(--g3)', 'var(--g4)'];

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const fmt = (v, d = 3) => Number(v).toFixed(d).replace('.', ',');
const pct = (v, d = 1) => (v * 100).toFixed(d).replace('.', ',') + '%';
const idn = v => Number(v).toLocaleString('id-ID');
const store = {
  get(k, f) { try { const v = localStorage.getItem('lifescope.' + k); return v === null ? f : JSON.parse(v); } catch { return f; } },
  set(k, v) { try { localStorage.setItem('lifescope.' + k, JSON.stringify(v)); } catch { /* mode privat */ } }
};
function svg(tag, attrs, parent) {
  const el = document.createElementNS(NS, tag);
  for (const k in attrs) el.setAttribute(k, attrs[k]);
  if (parent) parent.append(el);
  return el;
}
/* defs gradien, satu set per SVG agar id tidak bertabrakan */
function defs(root, pfx) {
  const d = svg('defs', {}, root);
  RAMP.forEach((stops, i) => {
    const g = svg('linearGradient', { id: pfx + 'g' + (i + 1), x1: 0, y1: 0, x2: 0, y2: 1 }, d);
    svg('stop', { offset: '0%', 'stop-color': stops[0] }, g);
    svg('stop', { offset: '100%', 'stop-color': stops[1] }, g);
  });
  const ink = svg('linearGradient', { id: pfx + 'gi', x1: 0, y1: 0, x2: 0, y2: 1 }, d);
  svg('stop', { offset: '0%', 'stop-color': 'oklch(0.320 0.018 205)' }, ink);
  svg('stop', { offset: '100%', 'stop-color': 'oklch(0.222 0.016 205)' }, ink);
  return i => 'url(#' + pfx + 'g' + (i + 1) + ')';
}

/* ------------------------------------------------------------------ ikon -- */
const ICON = {
  ikhtisar: 'M4 13h7V4H4v9Zm0 7h7v-5H4v5Zm9 0h7v-9h-7v9Zm0-16v5h7V4h-7Z',
  skrining: 'M12 3a9 9 0 1 0 9 9M12 12l6-6M12 12a1.6 1.6 0 1 0 0-3.2A1.6 1.6 0 0 0 12 12Z',
  kohort:   'M4 20v-2a4 4 0 0 1 4-4h2a4 4 0 0 1 4 4v2M9 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm7.5 10v-1.6a4 4 0 0 0-2.4-3.6M15 4.3a3 3 0 0 1 0 5.4',
  prioritas:'M4 6h2M4 12h2M4 18h2M9 6h11M9 12h8M9 18h5',
  ambang:   'M4 7h10M18 7h2M4 17h4M12 17h8M15 4v6M8 14v6',
  metode:   'M6 3v10a3 3 0 0 0 3 3h6M18 13a3 3 0 1 0 0 6 3 3 0 0 0 0-6ZM6 3a1.6 1.6 0 1 0 0 .01',
  model:    'M12 3 3 7.5v9L12 21l9-4.5v-9L12 3Zm0 0v18M3 7.5l9 4.5 9-4.5'
};
const NAV = [
  { v: 'ikhtisar',  l: 'Ikhtisar' },
  { g: 'Penapisan' },
  { v: 'skrining',  l: 'Skrining' },
  { v: 'kohort',    l: 'Kohort' },
  { v: 'prioritas', l: 'Prioritas' },
  { g: 'Kalibrasi' },
  { v: 'ambang',    l: 'Ambang' },
  { g: 'Tentang' },
  { v: 'metode',    l: 'Cara kerja' },
  { v: 'model',     l: 'Model' }
];
const VIEWS = NAV.filter(n => n.v).map(n => n.v);
function icon(name, cls) {
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" ' +
    'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"' + (cls ? ' class="' + cls + '"' : '') +
    '><path d="' + ICON[name] + '"/></svg>';
}

/* -------------------------------------------------------------- variabel -- */
const YN = [[1, 'Ya'], [2, 'Tidak']];
const FREQ = [[1, 'Setiap hari'], [2, 'Setiap minggu'], [3, 'Setiap bulan'],
              [4, 'Beberapa kali setahun'], [5, 'Tidak pernah']];
/* difficulty_* berisi empat tingkat pada data, bukan Ya/Tidak seperti di kamus
   panitia — rata-rata target naik monoton di keempatnya. */
const SULIT = [[1, 'Tidak ada kesulitan'], [2, 'Sedikit kesulitan'],
               [3, 'Banyak kesulitan'], [4, 'Sama sekali tidak bisa']];
const DIDIK = Array.from({ length: 10 }, (_, i) =>
  [i + 1, 'Tingkat ' + (i + 1) + (i === 0 ? ' (terendah)' : i === 9 ? ' (tertinggi)' : '')]);

const FIELDS = [
  { g: 'Kesehatan dan kondisi mental', k: 'general_health_status', l: 'Penilaian kesehatan diri',
    o: [[1, 'Sangat baik'], [2, 'Baik'], [3, 'Cukup'], [4, 'Kurang'], [5, 'Buruk']] },
  { g: 'Kesehatan dan kondisi mental', k: 'depression_frequency', l: 'Frekuensi merasa depresi atau sedih', o: FREQ },
  { g: 'Kesehatan dan kondisi mental', k: 'anxiety_frequency', l: 'Frekuensi merasa cemas atau khawatir', o: FREQ },
  { g: 'Kesehatan dan kondisi mental', k: 'hospitalized_overnight', l: 'Rawat inap dalam 12 bulan terakhir', o: YN },

  { g: 'Ekonomi dan ketahanan pangan', k: 'income_to_poverty_ratio', l: 'Rasio pendapatan terhadap garis kemiskinan',
    n: { min: 0, max: 11, step: 0.1 } },
  { g: 'Ekonomi dan ketahanan pangan', k: 'food_security_4cat', l: 'Status ketahanan pangan',
    o: [[1, 'Aman pangan'], [2, 'Marginal'], [3, 'Kurang'], [4, 'Sangat kurang']] },
  { g: 'Ekonomi dan ketahanan pangan', k: 'worry_about_medical_costs', l: 'Kekhawatiran atas biaya kesehatan',
    o: [[1, 'Sangat khawatir'], [2, 'Agak khawatir'], [3, 'Tidak khawatir']] },
  { g: 'Ekonomi dan ketahanan pangan', k: 'skipped_prescription_due_to_cost', l: 'Tidak menebus resep karena biaya', o: YN },

  { g: 'Fungsi sehari-hari', k: 'difficulty_social_activities', l: 'Kesulitan mengikuti kegiatan sosial', o: SULIT },
  { g: 'Fungsi sehari-hari', k: 'difficulty_remembering', l: 'Kesulitan mengingat atau berkonsentrasi', o: SULIT },
  { g: 'Fungsi sehari-hari', k: 'difficulty_walking_steps', l: 'Kesulitan berjalan atau menaiki tangga', o: SULIT },
  { g: 'Fungsi sehari-hari', k: 'difficulty_self_care', l: 'Kesulitan merawat diri sendiri', o: SULIT },

  { g: 'Demografi', k: 'age', l: 'Usia', n: { min: 18, max: 99, step: 1 } },
  { g: 'Demografi', k: 'education_level', l: 'Pendidikan tertinggi', o: DIDIK },
  { g: 'Demografi', k: 'ever_married', l: 'Pernah menikah', o: YN },
  { g: 'Demografi', k: 'sex', l: 'Jenis kelamin', o: [[1, 'Laki-laki'], [2, 'Perempuan']] },
  { g: 'Demografi', k: 'worked_last_week', l: 'Bekerja dengan bayaran minggu lalu', o: YN }
];
const byKey = Object.fromEntries(FIELDS.map(f => [f.k, f]));

/* ----------------------------------------------------------------- state -- */
let M = null, CTX = null, MEDIAN = [], IDX = {};
let COHORT = null, T3 = null, T3_OPT = null, SORT = { key: 'E', dir: -1 };
let cohortRaw = null, gaugeRefs = null;
const H = {};                                   /* status kedua histogram */

/* ------------------------------------------------------------- inferensi -- */
function leaf(node, x) {
  while (node.v === undefined) {
    const v = x[node.f];
    node = (v === null || v === undefined || Number.isNaN(v)) ? (node.m ? node.l : node.r)
                                                             : (v <= node.t ? node.l : node.r);
  }
  return node.v;
}
function proba(x) {
  const raw = [0, 0, 0, 0];
  for (const t of M.trees) raw[t.c] += leaf(t.n, x);
  const mx = Math.max(raw[0], raw[1], raw[2], raw[3]);
  const e = [Math.exp(raw[0] - mx), Math.exp(raw[1] - mx), Math.exp(raw[2] - mx), Math.exp(raw[3] - mx)];
  const s = e[0] + e[1] + e[2] + e[3];
  return [e[0] / s, e[1] / s, e[2] / s, e[3] / s];
}
const expected = p => p[0] + 2 * p[1] + 3 * p[2] + 4 * p[3];
const klas = (E, t) => 1 + (E > t[0] ? 1 : 0) + (E > t[1] ? 1 : 0) + (E > t[2] ? 1 : 0);
const argmaxK = p => p.indexOf(Math.max(...p)) + 1;
/* ambang efektif: t1 dan t2 tetap, t3 mengikuti pilihan pengguna */
const TH = () => [M.thresholds[0], M.thresholds[1], T3];

/* -------------------------------------------------------------- formulir -- */
function buildForm() {
  const form = $('#form');
  for (const g of [...new Set(FIELDS.map(f => f.g))]) {
    const fs = document.createElement('fieldset');
    fs.className = 'fieldset';
    const lg = document.createElement('legend'); lg.textContent = g; fs.append(lg);
    for (const f of FIELDS.filter(x => x.g === g)) {
      const row = document.createElement('div');
      row.className = 'row'; row.dataset.k = f.k;
      const lab = document.createElement('label');
      lab.htmlFor = 'i_' + f.k; lab.textContent = f.l;
      let inp;
      if (f.o) {
        inp = document.createElement('select');
        for (const [v, t] of f.o) inp.append(new Option(t, v));
        inp.append(new Option('Tidak menjawab', ''));
      } else {
        inp = document.createElement('input');
        inp.type = 'number'; inp.min = f.n.min; inp.max = f.n.max; inp.step = f.n.step;
        inp.inputMode = 'decimal';
      }
      inp.id = 'i_' + f.k;
      inp.addEventListener('input', render);
      inp.addEventListener('change', render);
      row.append(lab, inp); fs.append(row);
    }
    form.append(fs);
  }
}
function readX() {
  return M.features.map((k, i) => {
    const e = document.getElementById('i_' + k);
    if (!e) return MEDIAN[i];
    if (e.value === '') return NaN;                 /* non-respons diteruskan apa adanya */
    const v = parseFloat(e.value);
    return Number.isNaN(v) ? MEDIAN[i] : v;
  });
}
function writeX(x) {
  M.features.forEach((k, i) => {
    const e = document.getElementById('i_' + k);
    if (!e) return;
    const v = x[i];
    if (v === null || v === undefined || Number.isNaN(v)) { e.value = ''; return; }
    if (e.tagName === 'SELECT') {
      const r = String(Math.round(v));
      e.value = [...e.options].some(o => o.value === r) ? r : '';
    } else e.value = k === 'age' ? Math.round(v) : Math.round(v * 10) / 10;
  });
}

/* ------------------------------------------------------------- instrumen -- */
const GL = 64, GR = 598;
const gx = v => GL + (Math.min(4, Math.max(1, v)) - 1) / 3 * (GR - GL);

function buildGauge() {
  const root = $('#gauge');
  root.innerHTML = '';
  const g = defs(root, 'G');
  const BASE = 120, TOP = 34, DEN0 = 130, DEN1 = 160, RY = 168, RH = 28;

  if (CTX && CTX.hist && CTX.hist.length) {
    const mx = Math.max(...CTX.hist);
    const pts = CTX.hist.map((c, i) => {
      const v = (CTX.edges[i] + CTX.edges[i + 1]) / 2;
      return gx(v).toFixed(1) + ',' + (DEN1 - c / mx * (DEN1 - DEN0)).toFixed(1);
    });
    svg('polygon', {
      points: gx(CTX.edges[0]) + ',' + DEN1 + ' ' + pts.join(' ') + ' ' + gx(CTX.edges[CTX.edges.length - 1]) + ',' + DEN1,
      fill: 'var(--surface-3)'
    }, root);
    svg('text', { x: GR, y: DEN1 - 6, 'text-anchor': 'end', 'font-size': 10, fill: 'var(--ink-3)' }, root)
      .textContent = 'sebaran populasi latih';
  }

  const t = M.thresholds;
  const zones = [[1, t[0]], [t[0], t[1]], [t[1], t[2]], [t[2], 4]];
  zones.forEach((z, i) => {
    svg('rect', { x: gx(z[0]), y: RY, width: gx(z[1]) - gx(z[0]), height: RH,
      fill: g(i), rx: i === 0 || i === 3 ? 7 : 0 }, root);
  });
  svg('rect', { x: gx(1), y: RY, width: gx(4) - gx(1), height: RH, rx: 7, fill: 'none',
    stroke: 'oklch(1 0 0 / 0.4)', 'stroke-width': 1 }, root);
  svg('line', { x1: GL, y1: BASE, x2: GR, y2: BASE, stroke: 'var(--line-2)', 'stroke-width': 1 }, root);

  const bars = [], labels = [];
  for (let k = 0; k < 4; k++) {
    const w = 42, x = gx(k + 1) - w / 2;
    bars.push(svg('rect', { x, y: TOP, width: w, height: BASE - TOP, fill: g(k), rx: 5, class: 'pbar' }, root));
    const lg = svg('g', { class: 'plabel' }, root);
    const tx = svg('text', { x: gx(k + 1), y: TOP - 9, 'text-anchor': 'middle', 'font-size': 11.5,
      'font-family': 'var(--mono)', 'font-weight': 640, fill: 'var(--ink)' }, lg);
    labels.push({ g: lg, tx, span: BASE - TOP });
  }

  t.forEach((v, i) => {
    svg('line', { x1: gx(v), y1: RY - 7, x2: gx(v), y2: RY + RH + 7, stroke: 'var(--ink)', 'stroke-width': 1.2 }, root);
    svg('text', { x: gx(v), y: RY + RH + 23, 'text-anchor': 'middle', 'font-size': 10.5,
      'font-family': 'var(--mono)', fill: 'var(--ink-3)' }, root).textContent = 't' + (i + 1) + ' ' + fmt(v);
  });
  svg('text', { x: GL, y: RY + RH + 23, 'text-anchor': 'start', 'font-size': 10.5, 'font-family': 'var(--mono)', fill: 'var(--ink-3)' }, root).textContent = '1,0';
  svg('text', { x: GR, y: RY + RH + 23, 'text-anchor': 'end', 'font-size': 10.5, 'font-family': 'var(--mono)', fill: 'var(--ink-3)' }, root).textContent = '4,0';

  const needle = svg('g', { class: 'needle' }, root);
  svg('polygon', { points: '-7,12 7,12 0,24', fill: 'url(#Ggi)' }, needle);
  svg('line', { x1: 0, y1: 22, x2: 0, y2: RY + RH + 4, stroke: 'var(--ink)', 'stroke-width': 1.8 }, needle);
  gaugeRefs = { bars, labels, needle };
}

function buildHeroGauge() {
  const root = $('#hero-gauge');
  if (!root) return;
  root.innerHTML = '';
  const g = defs(root, 'H');

  /* Grid 200 kotak pada proporsi kelas sebenarnya di data latih:
     44,94 / 50,40 / 3,72 / 0,93 persen. Sembilan kotak hangat di ujung adalah
     4,7% yang jadi alasan alat ini dibuat. */
  const N = 200, COLS = 20, CELL = 17, GAP = 3.4, X0 = 24, Y0 = 10;
  const share = [0.4494, 0.5040, 0.0372, 0.0093];
  const cnt = share.map(v => Math.round(v * N));
  while (cnt.reduce((a, b) => a + b, 0) < N) cnt[1]++;
  while (cnt.reduce((a, b) => a + b, 0) > N) cnt[1]--;

  const cls = [];
  cnt.forEach((c, i) => { for (let k = 0; k < c; k++) cls.push(i); });

  let warmX0 = null, warmY0 = null;
  cls.forEach((c, i) => {
    const col = i % COLS, row = Math.floor(i / COLS);
    const x = X0 + col * (CELL + GAP), y = Y0 + row * (CELL + GAP);
    if (c >= 2 && warmX0 === null) { warmX0 = x; warmY0 = y; }
    svg('rect', { x, y, width: CELL, height: CELL, rx: 3.5, fill: g(c) }, root);
  });

  /* penanda tipis di sekeliling kelompok kotak hangat */
  if (warmX0 !== null) {
    const lastRow = Math.floor((N - 1) / COLS);
    svg('rect', {
      x: warmX0 - 4, y: warmY0 - 4,
      width: X0 + COLS * (CELL + GAP) - GAP - warmX0 + 8,
      height: Y0 + lastRow * (CELL + GAP) + CELL - warmY0 + 8,
      rx: 7, fill: 'none', stroke: 'var(--ink)', 'stroke-width': 1.4
    }, root);
  }
}

/* ---------------------------------------------------------------- render -- */
function render() {
  if (!M || !gaugeRefs) return;
  const x = readX(), p = proba(x), E = expected(p), k = klas(E, TH());

  $('#ey').textContent = fmt(E);
  const pill = $('#kelas');
  pill.textContent = k + ' · ' + NAMA[k - 1];
  pill.style.background = CSSG[k - 1];
  pill.style.color = (k === 2 || k === 3) ? 'var(--ink)' : '#fff';

  const d = Math.min(...TH().map(t => Math.abs(E - t)));
  const mg = $('#margin');
  mg.textContent = d > 0.12 ? fmt(d) + ' dari ambang terdekat' : 'hanya ' + fmt(d) + ' dari ambang, tidak tegas';
  mg.style.color = d > 0.12 ? '' : 'var(--s4)';

  $('#gauge').setAttribute('aria-label',
    'Nilai harapan ' + fmt(E) + ' pada skala 1 sampai 4, masuk kelas ' + k + ', ' + NAMA[k - 1] + '.');
  $('#say').textContent = 'E[y] ' + fmt(E) + ', kelas ' + k + ' ' + NAMA[k - 1] + '.';

  gaugeRefs.needle.setAttribute('transform', 'translate(' + gx(E).toFixed(2) + ',0)');
  p.forEach((v, i) => {
    gaugeRefs.bars[i].style.transform = 'scaleY(' + Math.max(0.003, v).toFixed(4) + ')';
    const L = gaugeRefs.labels[i];
    L.g.setAttribute('transform', 'translate(0,' + Math.min(L.span - 14, L.span * (1 - v)).toFixed(1) + ')');
    L.tx.textContent = pct(v, v < 0.01 ? 2 : 1);
    L.g.style.opacity = v < 0.004 ? 0.4 : 1;
  });
  renderDrivers(x, E);
}

function renderDrivers(x, E) {
  const host = $('#drivers');
  const rows = M.features.map((k, i) => {
    if (x[i] === MEDIAN[i]) return null;
    const y = x.slice(); y[i] = MEDIAN[i];
    return { k, d: E - expected(proba(y)) };
  }).filter(r => r && Math.abs(r.d) > 0.0005)
    .sort((a, b) => Math.abs(b.d) - Math.abs(a.d)).slice(0, 7);

  host.innerHTML = '';
  $$('.row.hi').forEach(r => r.classList.remove('hi'));
  if (!rows.length) {
    host.innerHTML = '<p class="status" style="margin:2px 0">Semua variabel ada di median populasi. ' +
      'Ubah satu jawaban untuk melihat apa yang menggerakkan E[y].</p>';
    return;
  }
  const mx = Math.abs(rows[0].d);
  for (const r of rows) {
    const el = document.createElement('div');
    el.className = 'drv';
    const w = Math.abs(r.d) / mx * 50;
    el.innerHTML =
      '<span class="nm">' + ((byKey[r.k] && byKey[r.k].l) || r.k) + '</span>' +
      '<span class="drv-track"><i class="drv-mid"></i><i class="drv-fill" style="left:' +
        (r.d >= 0 ? 50 : 50 - w) + '%;width:' + w + '%;background:' + (r.d >= 0 ? 'var(--g4)' : 'var(--g1)') + '"></i></span>' +
      '<span class="dv">' + (r.d >= 0 ? '+' : '−') + fmt(Math.abs(r.d)) + '</span>';
    el.addEventListener('pointerenter', () => { const q = $('.row[data-k="' + r.k + '"]'); if (q) q.classList.add('hi'); });
    el.addEventListener('pointerleave', () => { const q = $('.row[data-k="' + r.k + '"]'); if (q) q.classList.remove('hi'); });
    host.append(el);
  }
}

/* ------------------------------------------------------------------ skor -- */
function scoreCohort(rows, onProgress) {
  /* Irisan waktu berbasis setTimeout — requestAnimationFrame berhenti total
     ketika tab disembunyikan dan membuat penilaian menggantung. */
  return new Promise(resolve => {
    const out = []; let i = 0;
    const step = () => {
      const t0 = performance.now();
      while (i < rows.length && performance.now() - t0 < 12) {
        const p = proba(rows[i]);
        out.push({ x: rows[i], p, E: expected(p) });
        i++;
      }
      if (onProgress) onProgress(i / rows.length);
      if (i < rows.length) setTimeout(step, 0);
      else resolve(out.sort((a, b) => b.E - a.E));
    };
    step();
  });
}
async function loadCohortRows() {
  if (cohortRaw) return cohortRaw;
  const r = await fetch('data/kohort_contoh.json');
  if (!r.ok) throw new Error('Berkas kohort contoh tidak disertakan pada salinan ini.');
  const d = await r.json();
  const pos = M.features.map(k => d.features.indexOf(k));
  cohortRaw = d.rows.map(row => pos.map(p => row[p]));
  return cohortRaw;
}
async function useCohort(rows, label) {
  const prog = $('#k-prog'), bar = prog.firstElementChild;
  prog.hidden = false; bar.style.width = '0%';
  const st = $('#k-status'); st.textContent = ''; st.classList.remove('err');
  COHORT = await scoreCohort(rows, f => { bar.style.width = (f * 100).toFixed(0) + '%'; });
  prog.hidden = true;
  $('#k-hint').textContent = label;
  ['k', 'p', 't', 's'].forEach(id => {
    const e = $('#' + id + '-empty'), b = $('#' + id + '-body');
    if (e) e.hidden = true; if (b) b.hidden = false;
  });
  $('#a-export').disabled = false;
  renderCohort();
}
function fail(msg) {
  $('#k-prog').hidden = true;
  $('#k-empty').hidden = false; $('#k-body').hidden = true;
  const s = $('#k-status'); s.textContent = msg; s.classList.add('err');
  go('kohort');
}

function renderCohort() {
  const t = TH(), n = COHORT.length, cnt = [0, 0, 0, 0];
  let sum = 0;
  for (const o of COHORT) { cnt[klas(o.E, t) - 1]++; sum += o.E; }

  paintComposition('comp', cnt);
  paintComposition('comp2', cnt);
  $('#k-n').textContent = idn(n);
  $('#k-mean').textContent = fmt(sum / n);
  $('#k-risk').textContent = pct((cnt[2] + cnt[3]) / n);

  const srt = COHORT.map(o => o.E).sort((a, b) => a - b);
  const qq = f => srt[Math.min(srt.length - 1, Math.floor(f * (srt.length - 1)))];
  const q1 = qq(0.25), q2 = qq(0.5), q3 = qq(0.75);
  if ($('#q-1')) {
    $('#q-1').textContent = fmt(q1); $('#q-2').textContent = fmt(q2);
    $('#q-3').textContent = fmt(q3); $('#q-w').textContent = fmt(q3 - q1);
    $('#q-txt').textContent = 'Separuh kohort berada di antara ' + fmt(q1) + ' dan ' + fmt(q3) +
      '. Puncaknya menumpuk di t₁, batas antara Sangat puas dan Puas, tempat sebagian besar penalti metrik terjadi.';
  }
  buildHist('hist', 'tip', false);
  buildHist('hist2', 'tip2', true);
  renderDial();
  renderTable();
  buildScrub();
  renderKohortCounts();
}

/* ------------------------------------------------------------- histogram -- */
const HW = 960, HH = 300, HL = 46, HR = 22, HT = 18, HB = 44, X0 = 1, X1 = 3;
const hx = v => HL + (Math.min(X1, Math.max(X0, v)) - X0) / (X1 - X0) * (HW - HL - HR);
const hxInv = px => X0 + (px - HL) / (HW - HL - HR) * (X1 - X0);

function buildHist(rootId, tipId, drag) {
  const root = $('#' + rootId);
  if (!root) return;
  root.innerHTML = '';
  const pfx = rootId.toUpperCase();
  const g = defs(root, pfx);
  const NB = 56, w = (HW - HL - HR) / NB, y0 = HH - HB;
  const bins = new Array(NB).fill(0);
  for (const o of COHORT) {
    bins[Math.min(NB - 1, Math.max(0, Math.floor((o.E - X0) / (X1 - X0) * NB)))]++;
  }
  const mx = Math.max(...bins) || 1;
  const hy = c => y0 - c / mx * (y0 - HT);

  for (let i = 0; i <= 3; i++) {
    const y = HT + i / 3 * (y0 - HT);
    svg('line', { x1: HL, y1: y, x2: HW - HR, y2: y, stroke: 'var(--line)', 'stroke-width': 1 }, root);
    svg('text', { x: HL - 10, y: y + 4, 'text-anchor': 'end', 'font-size': 10.5,
      'font-family': 'var(--mono)', fill: 'var(--ink-3)' }, root).textContent = Math.round(mx * (1 - i / 3));
  }
  const barEls = bins.map((c, i) => svg('rect', {
    x: HL + i * w, y: hy(c), width: Math.max(1, w - 1.5), height: y0 - hy(c), rx: 2.5, fill: g(0)
  }, root));

  svg('line', { x1: HL, y1: y0, x2: HW - HR, y2: y0, stroke: 'var(--line-2)', 'stroke-width': 1 }, root);
  for (let v = 1; v <= 3.0001; v += 0.25) {
    svg('text', { x: hx(v), y: y0 + 19, 'text-anchor': 'middle', 'font-size': 10.5,
      'font-family': 'var(--mono)', fill: 'var(--ink-3)' }, root).textContent = fmt(v, 2);
  }
  svg('text', { x: (HL + HW - HR) / 2, y: HH - 8, 'text-anchor': 'middle', 'font-size': 11, fill: 'var(--ink-3)' }, root)
    .textContent = 'E[y], nilai harapan pada skala kepuasan';

  M.thresholds.slice(0, 2).forEach((v, i) => {
    svg('line', { x1: hx(v), y1: HT, x2: hx(v), y2: y0, stroke: 'var(--ink-3)', 'stroke-width': 1, 'stroke-dasharray': '3 4' }, root);
    svg('text', { x: hx(v) + 6, y: HT + 11, 'font-size': 10.5, 'font-family': 'var(--mono)', fill: 'var(--ink-3)' }, root)
      .textContent = 't' + (i + 1);
  });

  let handle = null;
  if (drag) {
    handle = svg('g', { class: 'handle', tabindex: 0, role: 'slider',
      'aria-label': 'Ambang penapisan t3', 'aria-valuemin': X0, 'aria-valuemax': X1 }, root);
    svg('rect', { class: 'hit', x: -16, y: HT - 12, width: 32, height: y0 - HT + 24 }, handle);
    svg('line', { x1: 0, y1: HT, x2: 0, y2: y0, stroke: 'var(--s4)', 'stroke-width': 2.2 }, handle);
    svg('rect', { class: 'cap', x: -15, y: HT - 9, width: 30, height: 18, rx: 6, fill: g(3) }, handle);
    svg('text', { x: 0, y: HT + 4, 'text-anchor': 'middle', 'font-size': 10.5, 'font-weight': 700,
      'font-family': 'var(--mono)', fill: '#fff' }, handle).textContent = 't3';
  } else {
    const gl = svg('g', {}, root);
    svg('line', { x1: 0, y1: HT, x2: 0, y2: y0, stroke: 'var(--s4)', 'stroke-width': 2 }, gl);
    svg('text', { x: 6, y: HT + 11, 'font-size': 10.5, 'font-weight': 700, 'font-family': 'var(--mono)',
      fill: 'var(--s4)' }, gl).textContent = 't3';
    handle = gl;
  }

  H[rootId] = { root, bins, barEls, handle, y0, w, mx, grad: g, tip: $('#' + tipId) };
  attachHist(rootId, drag);
  paintHist(rootId);
}
function paintHist(rootId) {
  const s = H[rootId];
  if (!s) return;
  const t = M.thresholds;
  s.barEls.forEach((r, i) => {
    const v = X0 + (i + 0.5) / s.bins.length * (X1 - X0);
    r.setAttribute('fill', s.grad(v > T3 ? 3 : v > t[1] ? 2 : v > t[0] ? 1 : 0));
  });
  s.handle.setAttribute('transform', 'translate(' + hx(T3).toFixed(2) + ',0)');
  if (s.handle.setAttribute && s.handle.tagName) {
    s.handle.setAttribute('aria-valuenow', T3.toFixed(2));
    s.handle.setAttribute('aria-valuetext', fmt(T3, 2));
  }
}
function setT3(v) {
  T3 = Math.min(X1, Math.max(X0, v));
  store.set('t3', T3);
  paintHist('hist'); paintHist('hist2');
  renderDial(); renderTable(); render(); renderKohortCounts();
  const tx = $('#t-txt'); void tx;
}
function counts() {
  const t = TH(), cnt = [0, 0, 0, 0];
  for (const o of COHORT) cnt[klas(o.E, t) - 1]++;
  return cnt;
}
function paintComposition(id, cnt) {
  const comp = $('#' + id), key = $('#' + id + '-key');
  if (!comp) return;
  const n = COHORT.length;
  if (comp.children.length !== 4) {
    comp.innerHTML = ''; key.innerHTML = '';
    cnt.forEach((c, i) => {
      const seg = document.createElement('i'); seg.style.background = CSSG[i]; comp.append(seg);
      const s = document.createElement('span');
      s.innerHTML = '<i style="background:' + CSSG[i] + '"></i> ' + (i + 1) + ' · ' + NAMA[i] + ' <b></b>';
      key.append(s);
    });
  }
  cnt.forEach((c, i) => {
    comp.children[i].style.width = (c / n * 100) + '%';
    key.children[i].querySelector('b').textContent = idn(c);
  });
}
function renderKohortCounts() {
  if (!COHORT) return;
  const cnt = counts(), n = COHORT.length;
  paintComposition('comp', cnt);
  paintComposition('comp2', cnt);
  const risk = $('#k-risk'); if (risk) risk.textContent = pct((cnt[2] + cnt[3]) / n);
  const tx = $('#t-txt');
  if (tx) {
    const d = T3 - T3_OPT;
    tx.textContent = 'Pada ambang ' + fmt(T3, 2) + ', kohort ini terbagi menjadi ' +
      cnt.map((c, i) => idn(c) + ' di kelas ' + (i + 1)).join(', ') + '. ' +
      (Math.abs(d) < 0.005 ? 'Ini ambang yang optimal untuk QWK.'
        : 'Menggeser t₃ memindahkan orang antara kelas 3 dan 4. Jumlah yang perlu ditindaklanjuti tetap, yang berubah tingkat urgensinya.');
  }
}
function attachHist(rootId, drag) {
  const s = H[rootId], root = s.root, tip = s.tip;
  const wrap = root.closest('.chart-wrap');
  const toSvg = ev => { const b = root.getBoundingClientRect(); return (ev.clientX - b.left) / b.width * HW; };

  if (drag && s.handle.addEventListener) {
    const h = s.handle;
    h.addEventListener('pointerdown', ev => {
      ev.preventDefault(); h.setPointerCapture(ev.pointerId); h.dataset.drag = '1';
      if (tip) tip.classList.remove('on');
    });
    h.addEventListener('pointermove', ev => { if (h.dataset.drag) setT3(hxInv(toSvg(ev))); });
    const stop = ev => { delete h.dataset.drag; try { h.releasePointerCapture(ev.pointerId); } catch (e) {} };
    h.addEventListener('pointerup', stop); h.addEventListener('pointercancel', stop);
    h.addEventListener('keydown', ev => {
      const st = ev.shiftKey ? 0.1 : 0.01;
      if (ev.key === 'ArrowLeft' || ev.key === 'ArrowDown') { setT3(T3 - st); ev.preventDefault(); }
      else if (ev.key === 'ArrowRight' || ev.key === 'ArrowUp') { setT3(T3 + st); ev.preventDefault(); }
      else if (ev.key === 'Home') { setT3(X0); ev.preventDefault(); }
      else if (ev.key === 'End') { setT3(X1); ev.preventDefault(); }
    });
  }
  if (!tip || !wrap) return;
  root.addEventListener('pointermove', ev => {
    if (s.handle.dataset && s.handle.dataset.drag) return;
    const i = Math.floor((toSvg(ev) - HL) / s.w);
    if (i < 0 || i >= s.bins.length || !s.bins[i]) { tip.classList.remove('on'); return; }
    const a = X0 + i / s.bins.length * (X1 - X0), b = X0 + (i + 1) / s.bins.length * (X1 - X0);
    tip.innerHTML = '<span class="n">' + idn(s.bins[i]) + '</span> responden &middot; E[y] ' + fmt(a, 2) + '–' + fmt(b, 2);
    const rc = root.getBoundingClientRect(), wr = wrap.getBoundingClientRect();
    tip.style.left = (rc.left - wr.left + (HL + (i + 0.5) * s.w) / HW * rc.width) + 'px';
    tip.style.top = (rc.top - wr.top + (s.y0 - s.bins[i] / s.mx * (s.y0 - HT)) / HH * rc.height) + 'px';
    tip.classList.add('on');
  });
  root.addEventListener('pointerleave', () => tip.classList.remove('on'));
}

/* ---------------------------------------------------------------- ambang -- */
function renderDial() {
  if (!COHORT) return;
  const n = COHORT.length;
  const opt = COHORT.filter(o => o.E > T3_OPT).length;
  const now = COHORT.filter(o => o.E > T3).length;
  const d = T3 - T3_OPT;
  $('#l-t3').textContent = fmt(T3, 2);
  $('#l-meter').style.width = Math.min(100, now / n * 100 * 4).toFixed(1) + '%';
  $('#l-flag').textContent = idn(now) + ' dari ' + idn(n) + ' ditandai';
  $('#l-delta').textContent = Math.abs(d) < 0.005 ? 'pada optimal QWK'
    : (d < 0 ? 'diturunkan ' : 'dinaikkan ') + fmt(Math.abs(d), 2);
  $('#l-extra').textContent = (now - opt >= 0 ? '+' : '−') + idn(Math.abs(now - opt));
  $('#l-load').textContent = Math.round(now / n * 1000);
  $('#a-reset-t3').disabled = Math.abs(d) < 0.005;
}

/* ----------------------------------------------------------------- tabel -- */
const COLS = [
  { k: 'rank', l: '#', get: (o, i) => i + 1, num: true, sort: false },
  { k: 'E', l: 'E[y]', get: o => fmt(o.E), num: true },
  { k: 'kelas', l: 'Kelas', get: o => {
      const k = klas(o.E, TH());
      return '<span class="pip" style="background:' + CSSG[k - 1] + ';color:' +
        ((k === 2 || k === 3) ? 'var(--ink)' : '#fff') + '">' + k + '</span>'; } },
  { k: 'general_health_status', l: 'Kesehatan diri' },
  { k: 'depression_frequency', l: 'Depresi' },
  { k: 'food_security_4cat', l: 'Pangan' },
  { k: 'age', l: 'Usia', num: true },
  { k: 'income_to_poverty_ratio', l: 'Rasio pendapatan', num: true }
];
function cellText(o, k) {
  const v = o.x[IDX[k]];
  if (v === null || v === undefined || Number.isNaN(v)) return '—';
  const f = byKey[k];
  if (f && f.o) { const m = f.o.find(c => c[0] === Math.round(v)); return m ? m[1] : String(v); }
  return k === 'age' ? String(Math.round(v)) : fmt(v, 2);
}
const sortVal = (o, k) => (k === 'E' || k === 'kelas') ? o.E
  : (o.x[IDX[k]] === null || o.x[IDX[k]] === undefined || Number.isNaN(o.x[IDX[k]])) ? -Infinity : o.x[IDX[k]];

function renderTable() {
  if (!COHORT) return;
  const thead = $('#tbl thead'), tbody = $('#tbl tbody');
  thead.innerHTML = '<tr>' + COLS.map(c => {
    if (c.sort === false) return '<th>' + c.l + '</th>';
    const on = SORT.key === c.k;
    return '<th' + (on ? ' aria-sort="' + (SORT.dir < 0 ? 'descending' : 'ascending') + '"' : '') + '>' +
      '<button type="button" data-k="' + c.k + '">' + c.l + '<span class="ar">' + (on && SORT.dir > 0 ? '↑' : '↓') + '</span></button></th>';
  }).join('') + '</tr>';
  $$('#tbl thead button').forEach(b => b.addEventListener('click', () => {
    const k = b.dataset.k; SORT = { key: k, dir: SORT.key === k ? -SORT.dir : -1 }; renderTable();
  }));

  const rows = COHORT.slice().sort((a, b) => (sortVal(a, SORT.key) - sortVal(b, SORT.key)) * SORT.dir).slice(0, 30);
  tbody.innerHTML = rows.map((o, i) => '<tr tabindex="0">' + COLS.map(c =>
    '<td class="' + (c.num ? 'n' : '') + '">' + (c.get ? c.get(o, i) : cellText(o, c.k)) + '</td>').join('') + '</tr>').join('');
  Array.prototype.forEach.call(tbody.rows, (tr, i) => {
    const open = () => { writeX(rows[i].x); render(); go('skrining'); };
    tr.addEventListener('click', open);
    tr.addEventListener('keydown', ev => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); open(); } });
  });
}

/* ------------------------------------------------------- penelusur metode -- */
function buildScrub() {
  if (!COHORT) return;
  const r = $('#s-range');
  r.max = COHORT.length - 1;
  r.value = Math.round(COHORT.length * 0.12);
  r.oninput = paintScrub;
  paintScrub();
}
function paintScrub() {
  const i = +$('#s-range').value, o = COHORT[i];
  const t = TH(), kt = klas(o.E, t), ka = argmaxK(o.p);
  $('#s-idx').textContent = 'peringkat ' + idn(i + 1) + ' dari ' + idn(COHORT.length);
  $('#s-ey').textContent = 'E[y] ' + fmt(o.E);
  const set = (id, k) => {
    const e = $(id); e.textContent = k;
    e.style.background = CSSG[k - 1];
    e.style.color = (k === 2 || k === 3) ? 'var(--ink)' : '#fff';
  };
  set('#s-am', ka); set('#s-th', kt);
  $('#s-am-t').textContent = NAMA[ka - 1];
  $('#s-th-t').textContent = NAMA[kt - 1];

  const beda = COHORT.filter(c => argmaxK(c.p) !== klas(c.E, t)).length;
  const box = $('#s-agree');
  box.classList.toggle('diff', ka !== kt);
  box.innerHTML = (ka !== kt
    ? '<b>Berbeda</b> untuk responden ini: <code>argmax</code> pilih kelas ' + ka +
      ', aturan ordinal pilih kelas ' + kt + '. '
    : 'Keduanya sepakat di sini. ') +
    'Se-kohort, keduanya berbeda pada <b>' + idn(beda) + ' dari ' + idn(COHORT.length) +
    ' responden</b> (' + pct(beda / COHORT.length) + '), dan selisih itu menyumbang +' +
    fmt(M.meta.qwk_oof_ambang - M.meta.qwk_oof_argmax, 5) + ' QWK.';
}

/* ------------------------------------------------------------------- CSV -- */
function parseCSV(text) {
  const lines = text.replace(/\r/g, '').split('\n').filter(l => l.trim());
  if (lines.length < 2) throw new Error('Berkas kosong atau hanya berisi baris header.');
  const head = lines[0].split(',').map(s => s.trim().replace(/^"|"$/g, ''));
  const pos = M.features.map(k => head.indexOf(k));
  const miss = M.features.filter((k, i) => pos[i] < 0);
  if (miss.length) throw new Error(miss.length + ' kolom tidak ditemukan: ' + miss.slice(0, 3).join(', ') + (miss.length > 3 ? ', …' : '') + '.');
  const rows = lines.slice(1).map(l => {
    const c = l.split(',');
    return pos.map(p => { const v = parseFloat(c[p]); return Number.isNaN(v) ? null : v; });
  });
  if (!rows.length) throw new Error('Tidak ada baris data setelah header.');
  return rows;
}
function handleFile(file) {
  if (!file) return;
  const rd = new FileReader();
  rd.onerror = () => fail('Berkas tidak dapat dibaca.');
  rd.onload = async () => {
    try {
      const rows = parseCSV(String(rd.result));
      await useCohort(rows, file.name + ' · ' + idn(rows.length) + ' baris');
    } catch (e) { fail(e.message); }
  };
  rd.readAsText(file);
}
function exportCSV() {
  const head = ['peringkat', 'E_y', 'kelas_prediksi', 'ambang_t3_dipakai', 'p1', 'p2', 'p3', 'p4'].concat(M.features);
  const body = COHORT.map((o, i) => [i + 1, o.E.toFixed(5), klas(o.E, TH()), T3.toFixed(4)]
    .concat(o.p.map(v => v.toFixed(5)))
    .concat(o.x.map(v => (v === null || v === undefined || Number.isNaN(v)) ? '' : v)).join(','));
  const blob = new Blob(['﻿' + [head.join(',')].concat(body).join('\n')], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'lifescope_prioritas.csv';
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}


/* ------------------------------------------------------ tombol info (i) -- */
const INFO = {
  ey: { t: 'Nilai harapan E[y]', f: 'E[y] = \u03a3 p\u2096 \u00b7 k,   k = 1, 2, 3, 4',
    b: 'Rata-rata berbobot dari keempat probabilitas kelas, bukan kelas tertinggi. QWK menghukum jarak secara kuadratik, jadi penduga optimalnya rata-rata, bukan modus. Pada pipeline kompetisi langkah ini sendiri menyumbang +0,06269 QWK.' },
  ambang: { t: 'Tiga ambang batas', f: 'kelas = 1 + [E>t\u2081] + [E>t\u2082] + [E>t\u2083]',
    b: 'Nilainya 1,560 / 1,991 / 2,481, diestimasi dari out-of-fold data latih dengan rata-rata bootstrap. t\u2083 paling rapuh karena kelas 4 cuma punya 893 baris latih; simpangan bakunya 3,6\u00d7 t\u2081.' },
  qwk: { t: 'Quadratic Weighted Kappa', f: '\u03ba = 1 \u2212 \u03a3 w\u1d62\u2c7c O\u1d62\u2c7c / \u03a3 w\u1d62\u2c7c E\u1d62\u2c7c,   w\u1d62\u2c7c = (i\u2212j)\u00b2 / 9',
    b: 'Metrik kompetisi. Menebak kelas 4 sebagai 1 dihukum 9\u00d7 lebih berat daripada 2 sebagai 1. Menebak kelas mayoritas untuk semua orang memberi akurasi 50,4% dengan \u03ba tepat nol.' },
  oof: { t: 'Out-of-fold', b: 'Tiap baris dinilai oleh model yang tidak pernah melihatnya saat latihan, memakai 5-fold stratified. Semua angka di halaman ini berasal dari sana, tidak satu pun diambil dari data uji.' },
  driver: { t: 'Faktor pendorong', f: '\u0394\u1d62 = E[y] \u2212 E[y | x\u1d62 = median]',
    b: 'Satu variabel dikembalikan ke median populasi, sisanya dibiarkan, lalu selisih E[y] diukur. Positif berarti nilai responden mendorongnya ke arah kurang puas. Tujuh yang terbesar ditampilkan.' },
  kuartil: { t: 'Rentang antar-kuartil', f: 'IQR = Q\u2083 \u2212 Q\u2081',
    b: 'Lebar sebaran separuh kohort di tengah. Makin sempit, makin terpusat penilaiannya, dan makin banyak orang yang jatuh dekat ambang.' },
  beban: { t: 'Beban tindak lanjut', f: 'ditandai / total \u00d7 1.000',
    b: 'Berapa orang per seribu responden yang masuk antrean tindak lanjut pada ambang saat ini. Dipakai menakar kapasitas: menurunkan t\u2083 menaikkan angka ini, dan angka inilah yang harus muat di kapasitas petugas.' },
  argmax: { t: 'argmax', f: 'kelas = arg max\u2096 p\u2096',
    b: 'Ambil kelas dengan probabilitas tertinggi. Optimal untuk akurasi, tetapi membuang informasi jarak yang justru dihitung QWK. Pada kohort contoh, argmax dan aturan ordinal berbeda di 126 dari 800 responden.' },
  seed: { t: 'random_state', b: 'Satu seed, 42, dipakai di pembagian fold, pelatihan keenam model, resampel bootstrap, dan analisis kurva belajar. Menjalankan ulang train_surrogate.py menghasilkan berkas model yang identik.' }
};
let popEl = null, popBtn = null;
function closePop() {
  if (!popEl) return;
  popEl.classList.remove('on');
  if (popBtn) popBtn.setAttribute('aria-expanded', 'false');
  popBtn = null;
}
function placePop() {
  if (!popEl || !popBtn) return;
  const r = popBtn.getBoundingClientRect();
  if (!r.width && !r.height) return;            /* pemicu sedang tersembunyi */
  const pw = popEl.offsetWidth, ph = popEl.offsetHeight;
  let x = r.left, y = r.bottom + 9, ox = 'top left';
  if (x + pw > innerWidth - 12) { x = Math.max(12, r.right - pw); ox = 'top right'; }
  if (y + ph > innerHeight - 12) { y = Math.max(12, r.top - ph - 9); ox = ox.replace('top', 'bottom'); }
  popEl.style.transformOrigin = ox;
  popEl.style.left = x + 'px';
  popEl.style.top = y + 'px';
}
function openPop(btn) {
  const d = INFO[btn.dataset.info];
  if (!d) return;
  if (!popEl) {
    popEl = document.createElement('div');
    popEl.className = 'pop';
    popEl.setAttribute('role', 'dialog');
    document.body.append(popEl);
  }
  popEl.setAttribute('aria-label', d.t);
  popEl.innerHTML = '<h4>' + d.t + '</h4>' + (d.f ? '<p class="f">' + d.f + '</p>' : '') + '<p>' + d.b + '</p>';
  popEl.classList.add('on');
  btn.setAttribute('aria-expanded', 'true');
  popBtn = btn;
  placePop();
}
function setupInfo() {
  document.addEventListener('click', ev => {
    const b = ev.target.closest ? ev.target.closest('.ib') : null;
    if (b) { ev.preventDefault(); (popBtn === b) ? closePop() : openPop(b); return; }
    if (popEl && !ev.target.closest('.pop')) closePop();
  });
  addEventListener('keydown', ev => { if (ev.key === 'Escape') closePop(); });
  addEventListener('scroll', placePop, true);
  addEventListener('resize', placePop);
}

/* ------------------------------------------------------- pita manfaat --- */
function buildBenefit() {
  const host = $('#b-list');
  if (!host) return;
  /* tiga teratas kohort contoh, angka nyata dari model ini */
  const rows = [[2.932, 4, 'Responden #1'], [2.790, 4, 'Responden #2'], [2.738, 4, 'Responden #3']];
  host.innerHTML = rows.map(r =>
    '<div class="b-row"><span class="pip" style="background:' + CSSG[r[1] - 1] + ';color:#fff">' + r[1] +
    '</span><span class="e">' + fmt(r[0]) + '</span><span class="who">' + r[2] + '</span></div>').join('');
}

/* ------------------------------------------------------------------ rute -- */
function go(v) {
  if (VIEWS.indexOf(v) < 0) v = 'ikhtisar';
  $$('.view').forEach(s => s.classList.toggle('on', s.id === 'v-' + v));
  $$('.nav button').forEach(b => {
    if (b.dataset.view === v) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
  });
  if (location.hash.slice(1) !== v) history.replaceState(null, '', '#' + v);
  store.set('view', v);
  const m = document.querySelector('main');
  if (m) m.scrollTop = 0;
  window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
}
function buildNav() {
  const nav = $('#nav');
  for (const item of NAV) {
    if (item.g) { const d = document.createElement('div'); d.className = 'nav-grp'; d.textContent = item.g; nav.append(d); continue; }
    const b = document.createElement('button');
    b.type = 'button'; b.dataset.view = item.v;
    b.innerHTML = icon(item.v) + '<span class="lbl">' + item.l + '</span>' +
      '<span class="key">' + (VIEWS.indexOf(item.v) + 1) + '</span>';
    b.addEventListener('click', () => go(item.v));
    nav.append(b);
  }
}

/* ------------------------------------------------------------------ muat -- */
(async function init() {
  try {
    const mr = await fetch('data/model_lifescope.json');
    if (!mr.ok) throw new Error('gagal');
    M = await mr.json();
    try { const cr = await fetch('data/konteks_lifescope.json'); if (cr.ok) CTX = await cr.json(); } catch (e) { CTX = null; }
  } catch (e) {
    document.body.insertAdjacentHTML('afterbegin',
      '<div style="padding:24px;color:#b33a22;font-family:system-ui">Gagal memuat model. Halaman ini perlu ' +
      'dijalankan lewat server statis (misalnya <code>python -m http.server</code>), bukan dibuka sebagai berkas.</div>');
    return;
  }

  M.features.forEach((k, i) => { IDX[k] = i; });
  MEDIAN = M.features.map(k => M.stats[k].median);
  T3_OPT = M.thresholds[2];
  T3 = store.get('t3', T3_OPT);
  if (!(typeof T3 === 'number' && T3 >= X0 && T3 <= X1)) T3 = T3_OPT;

  buildNav();
  $('#m-trees').textContent = idn(M.meta.n_pohon);
  $('#m-feats').textContent = M.meta.n_fitur;
  $('#m-qwk').textContent = fmt(M.meta.qwk_oof_ambang, 5);
  $('#m-seed').textContent = M.meta.seed;

  $('#legend').innerHTML = NAMA.map((t, i) =>
    '<span><i style="background:' + CSSG[i] + '"></i> ' + (i + 1) + ' · ' + t + '</span>').join('');

  $('#thesis').innerHTML = [
    ['+' + fmt(M.meta.qwk_oof_ambang - M.meta.qwk_oof_argmax, 5), 'Dari aturan keputusan',
      'Bukan dari model. Nilai harapan ordinal menggantikan kelas berprobabilitas tertinggi, dengan model dan seed yang sama persis.'],
    ['50,4%', 'Akurasi yang bernilai nol',
      'Tebak kelas mayoritas untuk semua orang: akurasi 50,4%, QWK 0,00000. Metrik ini tidak mengganjar tebakan aman.'],
    ['4.452', 'Orang yang dicari',
      'Responden di dua kelas terbawah dari 95.609 baris latih. Cuma 4,7%, tapi di sanalah hampir seluruh penalti.']
  ].map(r => '<div class="th"><div class="k">' + r[0] + '</div><div class="t">' + r[1] + '</div><div class="d">' + r[2] + '</div></div>').join('');

  $('#paths').innerHTML = [
    ['skrining', 'Skrining satu orang', 'Isi 17 pertanyaan, lihat posisinya pada skala.', 0],
    ['kohort', 'Nilai satu kohort', 'Muat contoh, atau unggah CSV Anda sendiri.', 1],
    ['prioritas', 'Susun daftar prioritas', 'Urutkan berdasarkan E[y], lalu ekspor CSV.', 2],
    ['ambang', 'Kalibrasi ambang', 'Geser t₃, lihat berapa orang tambahan tertangkap.', 3]
  ].map(r => '<button type="button" class="path" data-go="' + r[0] + '">' +
      '<span class="ic" style="background:' + CSSG[r[3]] + '">' + icon(r[0]) + '</span>' +
      '<b>' + r[1] + '</b><span>' + r[2] + '</span><span class="go">Buka →</span></button>').join('');

  $('#steps').innerHTML = [
    ['Kuesioner', '17 variabel. Non-respons diteruskan apa adanya, tanpa imputasi.'],
    ['Ansambel pohon', idn(M.meta.n_pohon) + ' pohon menghasilkan empat probabilitas, p₁ sampai p₄.'],
    ['Nilai harapan', 'E[y] = Σ pₖ·k menggabungkannya jadi satu titik. Langkah inilah yang paling menentukan skor; argmax membuang informasi jaraknya.'],
    ['Tiga ambang batas', 'E[y] dipotong di t₁, t₂, t₃ dari out-of-fold data latih. Di lapangan t₃ boleh digeser.']
  ].map((r, i) => '<div class="step"><span class="i" style="background:' + CSSG[i] + ';color:' +
      ((i === 1 || i === 2) ? 'var(--ink)' : '#fff') + '">' + (i + 1) + '</span>' +
      '<span><b>' + r[0] + '</b><span>' + r[1] + '</span></span></div>').join('');

  $('#spec').innerHTML = [
    ['Jenis', 'Ansambel pohon keputusan (LightGBM), diekspor ke JSON', 0],
    ['Pohon', idn(M.meta.n_pohon), 1],
    ['Variabel masukan', M.meta.n_fitur, 1],
    ['Baris data latih', idn(M.meta.n_train), 1],
    ['Aturan keputusan', 'E[y] = Σ pₖ·k, lalu tiga ambang batas', 0],
    ['Ambang batas', M.thresholds.map(t => fmt(t)).join('  ·  '), 1],
    ['Validasi', '5-fold stratified, out-of-fold', 0],
    ['random_state', M.meta.seed, 1]
  ].map(r => '<div><dt>' + r[0] + '</dt><dd' + (r[2] ? ' class="n"' : '') + '>' + r[1] + '</dd></div>').join('');

  $('#cmp').innerHTML = [
    ['QWK model ringkas ini', fmt(M.meta.qwk_oof_ambang, 5)],
    ['QWK pipeline kompetisi', fmt(M.meta.qwk_pipeline_penuh, 5)],
    ['Model ringkas dengan argmax', fmt(M.meta.qwk_oof_argmax, 5)],
    ['Sumbangan aturan keputusan', '+' + fmt(M.meta.qwk_oof_ambang - M.meta.qwk_oof_argmax, 5)]
  ].map(r => '<div><dt>' + r[0] + '</dt><dd class="n">' + r[1] + '</dd></div>').join('');

  buildForm(); buildGauge(); buildHeroGauge(); buildBenefit(); setupInfo();
  writeX(MEDIAN.slice()); render();

  $('#a-median').addEventListener('click', () => { writeX(MEDIAN.slice()); render(); });
  $('#a-acak').addEventListener('click', async () => {
    try { const rows = await loadCohortRows(); writeX(rows[Math.floor(Math.random() * rows.length)]); render(); }
    catch (e) { /* berkas contoh tidak ada — panel ini tetap berfungsi */ }
  });
  $('#a-kohort').addEventListener('click', async () => {
    try { const rows = await loadCohortRows(); await useCohort(rows, 'Kohort contoh · ' + idn(rows.length) + ' responden'); }
    catch (e) { fail(e.message + ' Unggah CSV Anda sendiri untuk melanjutkan.'); }
  });
  $('#file').addEventListener('change', e => handleFile(e.target.files[0]));
  $('#file2').addEventListener('change', e => handleFile(e.target.files[0]));
  $('#a-export').addEventListener('click', exportCSV);
  $('#a-reset-t3').addEventListener('click', () => setT3(T3_OPT));
  $$('[data-go]').forEach(b => b.addEventListener('click', () => go(b.dataset.go)));

  addEventListener('keydown', ev => {
    if (ev.metaKey || ev.ctrlKey || ev.altKey) return;
    const t = ev.target;
    if (t && t.tagName && /^(INPUT|SELECT|TEXTAREA)$/.test(t.tagName)) return;
    const i = VIEWS.indexOf(VIEWS[+ev.key - 1]);
    if (+ev.key >= 1 && +ev.key <= VIEWS.length) { go(VIEWS[+ev.key - 1]); ev.preventDefault(); }
    void i;
  });
  addEventListener('hashchange', () => go(location.hash.slice(1)));
  go(location.hash.slice(1) || store.get('view', 'ikhtisar'));

  const q = new URLSearchParams(location.search);
  if (q.get('kohort') === 'contoh') { $('#a-kohort').click(); if (!location.hash) go('kohort'); }
  if (q.get('responden') === 'acak') { go('skrining'); $('#a-acak').click(); }
  const qi = q.get('info');
  if (qi && INFO[qi]) {
    const ib = $('.ib[data-info="' + qi + '"]');
    if (ib) setTimeout(() => openPop(ib), 60);
  }
})();
