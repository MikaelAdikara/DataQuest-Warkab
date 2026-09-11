/* ============================================================================
   LifeScope — Tim Warkab
   Seluruh inferensi berjalan di peramban: evaluasi pohon keputusan, nilai
   harapan pada skala ordinal E[y] = Σ pₖ·k, lalu pemotongan dengan tiga
   ambang batas. Tidak ada permintaan jaringan setelah muat awal.
   ========================================================================== */
'use strict';

const ORD = ['var(--s1)', 'var(--s2)', 'var(--s3)', 'var(--s4)'];
const NAMA = ['Sangat puas', 'Puas', 'Tidak puas', 'Sangat tidak puas'];
const NS = 'http://www.w3.org/2000/svg';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const fmt = (v, d = 3) => Number(v).toFixed(d).replace('.', ',');
const pct = (v, d = 1) => (v * 100).toFixed(d).replace('.', ',') + '%';
const store = {
  get(k, f) { try { const v = localStorage.getItem('lifescope.' + k); return v === null ? f : JSON.parse(v); } catch { return f; } },
  set(k, v) { try { localStorage.setItem('lifescope.' + k, JSON.stringify(v)); } catch { /* mode privat */ } }
};

/* ------------------------------------------------------------- variabel -- */
const YN = [[1, 'Ya'], [2, 'Tidak']];
const FREQ = [[1, 'Setiap hari'], [2, 'Setiap minggu'], [3, 'Setiap bulan'],
              [4, 'Beberapa kali setahun'], [5, 'Tidak pernah']];
/* difficulty_* berisi empat tingkat pada data, bukan Ya/Tidak seperti di kamus
   panitia — rata-rata target naik monoton di keempatnya. */
const SULIT = [[1, 'Tidak ada kesulitan'], [2, 'Sedikit kesulitan'],
               [3, 'Banyak kesulitan'], [4, 'Sama sekali tidak bisa']];
const DIDIK = Array.from({ length: 10 }, (_, i) =>
  [i + 1, 'Tingkat ' + (i + 1) + (i === 0 ? ' — terendah' : i === 9 ? ' — tertinggi' : '')]);

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

/* --------------------------------------------------------------- state --- */
let M = null, CTX = null, MEDIAN = [], IDX = {};
let COHORT = null, T3 = null, T3_OPT = null, SORT = { key: 'E', dir: -1 };
let cohortRaw = null, gaugeRefs = null, histBins = null, histRefs = null;

/* ----------------------------------------------------------- inferensi --- */
function leaf(node, x) {
  while (node.v === undefined) {
    const v = x[node.f];
    node = (v === null || v === undefined || Number.isNaN(v))
      ? (node.m ? node.l : node.r)
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

function svg(tag, attrs, parent) {
  const el = document.createElementNS(NS, tag);
  for (const k in attrs) el.setAttribute(k, attrs[k]);
  if (parent) parent.append(el);
  return el;
}

/* ------------------------------------------------------------ formulir --- */
function buildForm() {
  const form = $('#form');
  const groups = [...new Set(FIELDS.map(f => f.g))];
  for (const g of groups) {
    const fs = document.createElement('fieldset');
    fs.className = 'fieldset';
    const lg = document.createElement('legend');
    lg.textContent = g;
    fs.append(lg);
    for (const f of FIELDS.filter(x => x.g === g)) {
      const row = document.createElement('div');
      row.className = 'row';
      row.dataset.k = f.k;
      const lab = document.createElement('label');
      lab.htmlFor = 'i_' + f.k;
      lab.textContent = f.l;
      let inp;
      if (f.o) {
        inp = document.createElement('select');
        for (const [v, t] of f.o) inp.append(new Option(t, v));
        inp.append(new Option('Tidak menjawab', ''));
      } else {
        inp = document.createElement('input');
        inp.type = 'number';
        inp.min = f.n.min; inp.max = f.n.max; inp.step = f.n.step;
        inp.inputMode = 'decimal';
      }
      inp.id = 'i_' + f.k;
      inp.addEventListener('input', render);
      inp.addEventListener('change', render);
      row.append(lab, inp);
      fs.append(row);
    }
    form.append(fs);
  }
}
function readX() {
  return M.features.map((k, i) => {
    const e = document.getElementById('i_' + k);
    if (!e) return MEDIAN[i];
    if (e.value === '') return NaN;          // non-respons diteruskan apa adanya
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
    } else {
      e.value = k === 'age' ? Math.round(v) : Math.round(v * 10) / 10;
    }
  });
}

/* ---------------------------------------------------------- instrumen ---- */
const GL = 64, GR = 598;
const gx = v => GL + (Math.min(4, Math.max(1, v)) - 1) / 3 * (GR - GL);

function buildGauge() {
  const root = $('#gauge');
  root.innerHTML = '';
  const BASE = 118, TOP = 34, DEN0 = 128, DEN1 = 158, RY = 166, RH = 26;

  /* sebaran populasi latih — konteks diam di belakang pembacaan individu */
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

  /* zona ambang batas */
  const t = M.thresholds;
  [[1, t[0]], [t[0], t[1]], [t[1], t[2]], [t[2], 4]].forEach((z, i) => {
    svg('rect', { x: gx(z[0]), y: RY, width: gx(z[1]) - gx(z[0]), height: RH, fill: ORD[i] }, root);
  });
  svg('line', { x1: GL, y1: BASE, x2: GR, y2: BASE, stroke: 'var(--line-2)', 'stroke-width': 1 }, root);

  /* batang probabilitas, ditempatkan pada posisi kelasnya di sumbu yang sama */
  const bars = [], labels = [];
  for (let k = 0; k < 4; k++) {
    const w = 40, x = gx(k + 1) - w / 2;
    bars.push(svg('rect', { x, y: TOP, width: w, height: BASE - TOP, fill: ORD[k], rx: 2, class: 'pbar' }, root));
    const g = svg('g', { class: 'plabel' }, root);
    const tx = svg('text', {
      x: gx(k + 1), y: TOP - 8, 'text-anchor': 'middle', 'font-size': 11.5,
      'font-family': 'var(--mono)', 'font-weight': 600, fill: 'var(--ink)'
    }, g);
    labels.push({ g, tx, span: BASE - TOP });
  }

  /* penanda ambang dan ujung sumbu */
  t.forEach((v, i) => {
    svg('line', { x1: gx(v), y1: RY - 6, x2: gx(v), y2: RY + RH + 6, stroke: 'var(--ink)', 'stroke-width': 1 }, root);
    svg('text', {
      x: gx(v), y: RY + RH + 22, 'text-anchor': 'middle', 'font-size': 10.5,
      'font-family': 'var(--mono)', fill: 'var(--ink-3)'
    }, root).textContent = 't' + (i + 1) + ' ' + fmt(v);
  });
  svg('text', { x: GL, y: RY + RH + 22, 'text-anchor': 'start', 'font-size': 10.5, 'font-family': 'var(--mono)', fill: 'var(--ink-3)' }, root).textContent = '1,0';
  svg('text', { x: GR, y: RY + RH + 22, 'text-anchor': 'end', 'font-size': 10.5, 'font-family': 'var(--mono)', fill: 'var(--ink-3)' }, root).textContent = '4,0';

  /* jarum — satu-satunya elemen yang bergerak */
  const needle = svg('g', { class: 'needle' }, root);
  svg('polygon', { points: '-6,14 6,14 0,24', fill: 'var(--ink)' }, needle);
  svg('line', { x1: 0, y1: 22, x2: 0, y2: RY + RH + 4, stroke: 'var(--ink)', 'stroke-width': 1.75 }, needle);

  gaugeRefs = { bars, labels, needle };
}

/* -------------------------------------------------------------- render --- */
function render() {
  if (!M) return;
  const x = readX(), p = proba(x), E = expected(p), k = klas(E, M.thresholds);

  $('#ey').textContent = fmt(E);
  const ke = $('#kelas');
  ke.textContent = k + ' · ' + NAMA[k - 1];
  ke.style.color = ORD[k - 1];

  const d = Math.min.apply(null, M.thresholds.map(t => Math.abs(E - t)));
  const mg = $('#margin');
  mg.textContent = d > 0.12 ? fmt(d) + ' dari ambang terdekat' : 'hanya ' + fmt(d) + ' dari ambang — tidak tegas';
  mg.style.color = d > 0.12 ? '' : 'var(--s4)';

  $('#gauge').setAttribute('aria-label',
    'Nilai harapan ' + fmt(E) + ' pada skala 1 sampai 4, masuk kelas ' + k + ', ' + NAMA[k - 1] + '.');
  $('#say').textContent = 'E[y] ' + fmt(E) + ', kelas ' + k + ' ' + NAMA[k - 1] + '.';

  gaugeRefs.needle.setAttribute('transform', 'translate(' + gx(E).toFixed(2) + ',0)');
  p.forEach((v, i) => {
    gaugeRefs.bars[i].style.transform = 'scaleY(' + Math.max(0.0025, v).toFixed(4) + ')';
    const L = gaugeRefs.labels[i];
    /* label tidak boleh turun sampai menyentuh garis dasar ketika probabilitasnya kecil */
    L.g.setAttribute('transform', 'translate(0,' + Math.min(L.span - 12, L.span * (1 - v)).toFixed(1) + ')');
    L.tx.textContent = pct(v, v < 0.01 ? 2 : 1);
    L.g.style.opacity = v < 0.004 ? 0.35 : 1;
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
    .sort((a, b) => Math.abs(b.d) - Math.abs(a.d))
    .slice(0, 7);

  host.innerHTML = '';
  $$('.row.hi').forEach(r => r.classList.remove('hi'));
  if (!rows.length) {
    host.innerHTML = '<p class="status" style="margin:2px 0">Seluruh variabel berada pada median populasi. Ubah salah satu jawaban, atau muat responden acak, untuk melihat apa yang menggerakkan E[y].</p>';
    return;
  }
  const mx = Math.abs(rows[0].d);
  for (const r of rows) {
    const el = document.createElement('div');
    el.className = 'drv';
    const w = Math.abs(r.d) / mx * 50;
    el.innerHTML =
      '<span class="nm">' + ((byKey[r.k] && byKey[r.k].l) || r.k) + '</span>' +
      '<span class="drv-track"><i class="drv-mid"></i><i class="drv-fill" style="' +
        'left:' + (r.d >= 0 ? 50 : 50 - w) + '%;width:' + w + '%;background:' +
        (r.d >= 0 ? 'var(--s4)' : 'var(--s1)') + '"></i></span>' +
      '<span class="dv">' + (r.d >= 0 ? '+' : '−') + fmt(Math.abs(r.d)) + '</span>';
    el.addEventListener('pointerenter', () => { const q = $('.row[data-k="' + r.k + '"]'); if (q) q.classList.add('hi'); });
    el.addEventListener('pointerleave', () => { const q = $('.row[data-k="' + r.k + '"]'); if (q) q.classList.remove('hi'); });
    host.append(el);
  }
}

/* -------------------------------------------------------------- kohort --- */
function scoreCohort(rows, onProgress) {
  /* Irisan waktu 12 ms, dijadwalkan dengan setTimeout — bukan requestAnimationFrame,
     yang berhenti total ketika tab disembunyikan dan membuat penilaian menggantung. */
  return new Promise(resolve => {
    const out = [];
    let i = 0;
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
  const st = $('#k-status');
  st.textContent = ''; st.classList.remove('err');
  COHORT = await scoreCohort(rows, f => { bar.style.width = (f * 100).toFixed(0) + '%'; });
  prog.hidden = true;
  $('#k-empty').hidden = true;
  $('#k-body').hidden = false;
  $('#a-export').disabled = false;
  $('#k-hint').textContent = label;
  renderCohort();
}

function renderCohort() {
  const t = M.thresholds, n = COHORT.length;
  const cnt = [0, 0, 0, 0];
  let sum = 0;
  for (const o of COHORT) { cnt[klas(o.E, t) - 1]++; sum += o.E; }

  const comp = $('#comp'), key = $('#comp-key');
  comp.innerHTML = ''; key.innerHTML = '';
  cnt.forEach((c, i) => {
    const seg = document.createElement('i');
    seg.style.background = ORD[i];
    seg.style.width = (c / n * 100) + '%';
    comp.append(seg);
    const s = document.createElement('span');
    s.innerHTML = '<i style="width:8px;height:8px;border-radius:2px;display:inline-block;background:' + ORD[i] + '"></i> ' +
                  (i + 1) + ' · ' + NAMA[i] + ' <b>' + c + '</b>';
    key.append(s);
  });
  $('#k-n').textContent = n.toLocaleString('id-ID');
  $('#k-mean').textContent = fmt(sum / n);
  $('#k-risk').textContent = pct((cnt[2] + cnt[3]) / n);

  buildHist();
  renderLab();
  renderTable();
}

/* ------------------------------------------------------------ histogram -- */
const HW = 960, HH = 300, HL = 46, HR = 22, HT = 16, HB = 44, HX0 = 1, HX1 = 3;
const hx = v => HL + (Math.min(HX1, Math.max(HX0, v)) - HX0) / (HX1 - HX0) * (HW - HL - HR);
const hxInv = px => HX0 + (px - HL) / (HW - HL - HR) * (HX1 - HX0);

function buildHist() {
  const root = $('#hist');
  root.innerHTML = '';
  const NB = 56, w = (HW - HL - HR) / NB, y0 = HH - HB;
  histBins = new Array(NB).fill(0);
  for (const o of COHORT) {
    const b = Math.min(NB - 1, Math.max(0, Math.floor((o.E - HX0) / (HX1 - HX0) * NB)));
    histBins[b]++;
  }
  const mx = Math.max.apply(null, histBins) || 1;
  const hy = c => y0 - c / mx * (y0 - HT);

  for (let g = 0; g <= 3; g++) {
    const y = HT + g / 3 * (y0 - HT);
    svg('line', { x1: HL, y1: y, x2: HW - HR, y2: y, stroke: 'var(--line)', 'stroke-width': 1 }, root);
    svg('text', { x: HL - 9, y: y + 4, 'text-anchor': 'end', 'font-size': 10.5, 'font-family': 'var(--mono)', fill: 'var(--ink-3)' }, root)
      .textContent = Math.round(mx * (1 - g / 3));
  }

  const barEls = [];
  histBins.forEach((c, i) => {
    barEls.push(svg('rect', {
      x: HL + i * w, y: hy(c), width: Math.max(1, w - 1.5), height: y0 - hy(c), rx: 1.5, fill: 'var(--s1)'
    }, root));
  });

  svg('line', { x1: HL, y1: y0, x2: HW - HR, y2: y0, stroke: 'var(--line-2)', 'stroke-width': 1 }, root);
  for (let v = 1; v <= 3.0001; v += 0.25) {
    svg('text', { x: hx(v), y: y0 + 18, 'text-anchor': 'middle', 'font-size': 10.5, 'font-family': 'var(--mono)', fill: 'var(--ink-3)' }, root)
      .textContent = fmt(v, 2);
  }
  svg('text', { x: (HL + HW - HR) / 2, y: HH - 8, 'text-anchor': 'middle', 'font-size': 11, fill: 'var(--ink-3)' }, root)
    .textContent = 'E[y] — nilai harapan pada skala kepuasan';

  M.thresholds.slice(0, 2).forEach((v, i) => {
    svg('line', { x1: hx(v), y1: HT, x2: hx(v), y2: y0, stroke: 'var(--ink-3)', 'stroke-width': 1, 'stroke-dasharray': '3 3' }, root);
    svg('text', { x: hx(v) + 5, y: HT + 11, 'font-size': 10.5, 'font-family': 'var(--mono)', fill: 'var(--ink-3)' }, root)
      .textContent = 't' + (i + 1);
  });

  /* t₃ — diseret langsung di grafik */
  const handle = svg('g', {
    class: 'handle', tabindex: 0, role: 'slider', 'aria-label': 'Ambang penapisan t3',
    'aria-valuemin': HX0, 'aria-valuemax': HX1
  }, root);
  svg('rect', { class: 'hit', x: -15, y: HT - 10, width: 30, height: y0 - HT + 20 }, handle);
  svg('line', { x1: 0, y1: HT, x2: 0, y2: y0, stroke: 'var(--s4)', 'stroke-width': 2 }, handle);
  svg('rect', { class: 'cap', x: -14, y: HT - 7, width: 28, height: 16, rx: 4, fill: 'var(--s4)' }, handle);
  svg('text', { x: 0, y: HT + 5, 'text-anchor': 'middle', 'font-size': 10, 'font-weight': 700,
    'font-family': 'var(--mono)', fill: '#fff' }, handle).textContent = 't3';

  histRefs = { barEls, handle, y0, w, mx };
  attachHistEvents(root);
  paintHist();
}

function paintHist() {
  const t = M.thresholds;
  histRefs.barEls.forEach((r, i) => {
    const v = HX0 + (i + 0.5) / histBins.length * (HX1 - HX0);
    const c = v > T3 ? 3 : v > t[1] ? 2 : v > t[0] ? 1 : 0;
    r.setAttribute('fill', ORD[c]);
  });
  histRefs.handle.setAttribute('transform', 'translate(' + hx(T3).toFixed(2) + ',0)');
  histRefs.handle.setAttribute('aria-valuenow', T3.toFixed(2));
  histRefs.handle.setAttribute('aria-valuetext', fmt(T3, 2));
}

function attachHistEvents(root) {
  const tip = $('#tip'), wrap = $('.chart-wrap'), h = histRefs.handle;
  const toSvg = ev => {
    const b = root.getBoundingClientRect();
    return (ev.clientX - b.left) / b.width * HW;
  };
  const setT3 = v => {
    T3 = Math.min(HX1, Math.max(HX0, v));
    store.set('t3', T3);
    paintHist(); renderLab();
  };

  h.addEventListener('pointerdown', ev => {
    ev.preventDefault();
    h.setPointerCapture(ev.pointerId);
    h.dataset.drag = '1';
    tip.classList.remove('on');
  });
  h.addEventListener('pointermove', ev => { if (h.dataset.drag) setT3(hxInv(toSvg(ev))); });
  const stop = ev => { delete h.dataset.drag; try { h.releasePointerCapture(ev.pointerId); } catch (e) {} };
  h.addEventListener('pointerup', stop);
  h.addEventListener('pointercancel', stop);
  h.addEventListener('keydown', ev => {
    const s = ev.shiftKey ? 0.1 : 0.01;
    if (ev.key === 'ArrowLeft' || ev.key === 'ArrowDown') { setT3(T3 - s); ev.preventDefault(); }
    else if (ev.key === 'ArrowRight' || ev.key === 'ArrowUp') { setT3(T3 + s); ev.preventDefault(); }
    else if (ev.key === 'Home') { setT3(HX0); ev.preventDefault(); }
    else if (ev.key === 'End') { setT3(HX1); ev.preventDefault(); }
  });

  root.addEventListener('pointermove', ev => {
    if (h.dataset.drag) return;
    const px = toSvg(ev), i = Math.floor((px - HL) / histRefs.w);
    if (i < 0 || i >= histBins.length || !histBins[i]) { tip.classList.remove('on'); return; }
    const a = HX0 + i / histBins.length * (HX1 - HX0);
    const b = HX0 + (i + 1) / histBins.length * (HX1 - HX0);
    tip.innerHTML = '<span class="num">' + histBins[i] + '</span> responden &middot; E[y] ' + fmt(a, 2) + '–' + fmt(b, 2);
    const rect = root.getBoundingClientRect(), wr = wrap.getBoundingClientRect();
    tip.style.left = (rect.left - wr.left + (HL + (i + 0.5) * histRefs.w) / HW * rect.width) + 'px';
    tip.style.top = (rect.top - wr.top + (histRefs.y0 - histBins[i] / histRefs.mx * (histRefs.y0 - HT)) / HH * rect.height) + 'px';
    tip.classList.add('on');
  });
  root.addEventListener('pointerleave', () => tip.classList.remove('on'));
}

function renderLab() {
  const opt = COHORT.filter(o => o.E > T3_OPT).length;
  const now = COHORT.filter(o => o.E > T3).length;
  const d = T3 - T3_OPT;
  $('#l-t3').textContent = fmt(T3, 2);
  $('#l-delta').textContent = Math.abs(d) < 0.005 ? 'pada optimal QWK'
    : (d < 0 ? 'diturunkan ' : 'dinaikkan ') + fmt(Math.abs(d), 2);
  $('#l-flag').textContent = now.toLocaleString('id-ID');
  const diff = $('#l-diff');
  diff.textContent = (now - opt >= 0 ? '+' : '−') + Math.abs(now - opt);
  diff.style.color = now === opt ? '' : 'var(--s4)';
  $('#a-reset-t3').disabled = Math.abs(d) < 0.005;
}

/* --------------------------------------------------------------- tabel --- */
const COLS = [
  { k: 'rank', l: '#', get: (o, i) => i + 1, num: true, sort: false },
  { k: 'E', l: 'E[y]', get: o => fmt(o.E), num: true },
  { k: 'kelas', l: 'Kelas', get: o => {
      const k = klas(o.E, M.thresholds);
      return '<span class="pip" style="background:' + ORD[k - 1] + ';color:' +
        (k === 2 || k === 3 ? 'var(--ink)' : '#fff') + '">' + k + '</span>';
    } },
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
  if (f && f.o) {
    const m = f.o.find(c => c[0] === Math.round(v));
    return m ? m[1] : String(v);
  }
  return k === 'age' ? String(Math.round(v)) : fmt(v, 2);
}
function sortVal(o, k) {
  if (k === 'E' || k === 'kelas') return o.E;
  const v = o.x[IDX[k]];
  return (v === null || v === undefined || Number.isNaN(v)) ? -Infinity : v;
}
function renderTable() {
  const thead = $('#tbl thead'), tbody = $('#tbl tbody');
  thead.innerHTML = '<tr>' + COLS.map(c => {
    if (c.sort === false) return '<th>' + c.l + '</th>';
    const on = SORT.key === c.k;
    return '<th' + (on ? ' aria-sort="' + (SORT.dir < 0 ? 'descending' : 'ascending') + '"' : '') + '>' +
      '<button type="button" data-k="' + c.k + '">' + c.l +
      '<span class="ar">' + (on && SORT.dir > 0 ? '↑' : '↓') + '</span></button></th>';
  }).join('') + '</tr>';
  $$('#tbl thead button').forEach(b => b.addEventListener('click', () => {
    const k = b.dataset.k;
    SORT = { key: k, dir: SORT.key === k ? -SORT.dir : -1 };
    renderTable();
  }));

  const rows = COHORT.slice().sort((a, b) => (sortVal(a, SORT.key) - sortVal(b, SORT.key)) * SORT.dir).slice(0, 30);
  tbody.innerHTML = rows.map((o, i) => '<tr tabindex="0">' + COLS.map(c =>
    '<td class="' + (c.num ? 'n' : '') + '">' + (c.get ? c.get(o, i) : cellText(o, c.k)) + '</td>'
  ).join('') + '</tr>').join('');
  Array.prototype.forEach.call(tbody.rows, (tr, i) => {
    const open = () => { writeX(rows[i].x); render(); go('skrining'); };
    tr.addEventListener('click', open);
    tr.addEventListener('keydown', ev => {
      if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); open(); }
    });
  });
}

/* ----------------------------------------------------------------- CSV --- */
function parseCSV(text) {
  const lines = text.replace(/\r/g, '').split('\n').filter(l => l.trim());
  if (lines.length < 2) throw new Error('Berkas kosong atau hanya berisi baris header.');
  const head = lines[0].split(',').map(s => s.trim().replace(/^"|"$/g, ''));
  const pos = M.features.map(k => head.indexOf(k));
  const miss = M.features.filter((k, i) => pos[i] < 0);
  if (miss.length) {
    throw new Error(miss.length + ' kolom tidak ditemukan: ' + miss.slice(0, 3).join(', ') + (miss.length > 3 ? ', …' : '') + '.');
  }
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
      await useCohort(rows, file.name + ' · ' + rows.length.toLocaleString('id-ID') + ' baris');
    } catch (e) { fail(e.message); }
  };
  rd.readAsText(file);
}
function fail(msg) {
  $('#k-prog').hidden = true;
  $('#k-empty').hidden = false;
  $('#k-body').hidden = true;
  const s = $('#k-status');
  s.textContent = msg;
  s.classList.add('err');
  go('kohort');
}
function exportCSV() {
  const head = ['peringkat', 'E_y', 'kelas_prediksi', 'p1', 'p2', 'p3', 'p4'].concat(M.features);
  const body = COHORT.map((o, i) => [
    i + 1, o.E.toFixed(5), klas(o.E, M.thresholds)
  ].concat(o.p.map(v => v.toFixed(5)))
   .concat(o.x.map(v => (v === null || v === undefined || Number.isNaN(v)) ? '' : v)).join(','));
  const blob = new Blob(['﻿' + [head.join(',')].concat(body).join('\n')], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'lifescope_kohort_dinilai.csv';
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

/* ---------------------------------------------------------------- rute --- */
const VIEWS = ['skrining', 'kohort', 'model'];
function go(v) {
  if (VIEWS.indexOf(v) < 0) v = 'skrining';
  $$('.view').forEach(s => s.classList.toggle('on', s.id === 'v-' + v));
  $$('.nav button').forEach(b => {
    if (b.dataset.view === v) b.setAttribute('aria-current', 'page');
    else b.removeAttribute('aria-current');
  });
  if (location.hash.slice(1) !== v) history.replaceState(null, '', '#' + v);
  store.set('view', v);
}

/* ---------------------------------------------------------------- muat --- */
(async function init() {
  try {
    const mr = await fetch('data/model_lifescope.json');
    if (!mr.ok) throw new Error('gagal memuat model');
    M = await mr.json();
    try {
      const cr = await fetch('data/konteks_lifescope.json');
      if (cr.ok) CTX = await cr.json();
    } catch (e) { CTX = null; }
  } catch (e) {
    document.body.insertAdjacentHTML('afterbegin',
      '<div style="padding:24px;color:#ab3724;font-size:14px;font-family:system-ui">Gagal memuat model. ' +
      'Halaman ini perlu dijalankan lewat server statis (misalnya <code>python -m http.server</code>), ' +
      'bukan dibuka langsung sebagai berkas.</div>');
    return;
  }

  M.features.forEach((k, i) => { IDX[k] = i; });
  MEDIAN = M.features.map(k => M.stats[k].median);
  T3_OPT = M.thresholds[2];
  T3 = store.get('t3', T3_OPT);
  if (!(typeof T3 === 'number' && T3 >= HX0 && T3 <= HX1)) T3 = T3_OPT;

  $('#m-trees').textContent = M.meta.n_pohon.toLocaleString('id-ID');
  $('#m-feats').textContent = M.meta.n_fitur;
  $('#m-qwk').textContent = fmt(M.meta.qwk_oof_ambang, 5);
  $('#m-seed').textContent = M.meta.seed;

  $('#spec').innerHTML = [
    ['Jenis', 'Ansambel pohon keputusan (LightGBM), diekspor ke JSON', 0],
    ['Pohon', M.meta.n_pohon.toLocaleString('id-ID'), 1],
    ['Variabel masukan', M.meta.n_fitur, 1],
    ['Baris data latih', M.meta.n_train.toLocaleString('id-ID'), 1],
    ['Aturan keputusan', 'E[y] = Σ pₖ·k, lalu tiga ambang batas', 0],
    ['Ambang batas', M.thresholds.map(t => fmt(t)).join('  ·  '), 1],
    ['Validasi', '5-fold stratified, out-of-fold', 0],
    ['random_state', M.meta.seed, 1]
  ].map(r => '<div><dt>' + r[0] + '</dt><dd' + (r[2] ? ' class="n"' : '') + '>' + r[1] + '</dd></div>').join('');

  $('#cmp').innerHTML = [
    ['QWK — model ringkas ini', fmt(M.meta.qwk_oof_ambang, 5)],
    ['QWK — pipeline kompetisi', fmt(M.meta.qwk_pipeline_penuh, 5)],
    ['Model ringkas dengan argmax', fmt(M.meta.qwk_oof_argmax, 5)],
    ['Sumbangan aturan keputusan', '+' + fmt(M.meta.qwk_oof_ambang - M.meta.qwk_oof_argmax, 5)]
  ].map(r => '<div><dt>' + r[0] + '</dt><dd class="n">' + r[1] + '</dd></div>').join('');

  buildForm();
  buildGauge();
  writeX(MEDIAN.slice());
  render();

  $('#a-median').addEventListener('click', () => { writeX(MEDIAN.slice()); render(); });
  $('#a-acak').addEventListener('click', async () => {
    try {
      const rows = await loadCohortRows();
      writeX(rows[Math.floor(Math.random() * rows.length)]);
      render();
    } catch (e) { /* berkas contoh tidak ada — panel ini tetap berfungsi */ }
  });
  $('#a-kohort').addEventListener('click', async () => {
    try {
      const rows = await loadCohortRows();
      await useCohort(rows, 'Kohort contoh · ' + rows.length.toLocaleString('id-ID') + ' responden');
    } catch (e) { fail(e.message + ' Unggah CSV Anda sendiri untuk melanjutkan.'); }
  });
  $('#file').addEventListener('change', e => handleFile(e.target.files[0]));
  $('#file2').addEventListener('change', e => handleFile(e.target.files[0]));
  $('#a-export').addEventListener('click', exportCSV);
  $('#a-reset-t3').addEventListener('click', () => {
    T3 = T3_OPT; store.set('t3', T3); paintHist(); renderLab();
  });
  $$('.nav button').forEach(b => b.addEventListener('click', () => go(b.dataset.view)));

  addEventListener('keydown', ev => {
    if (ev.metaKey || ev.ctrlKey || ev.altKey) return;
    const t = ev.target;
    if (t && t.tagName && /^(INPUT|SELECT|TEXTAREA)$/.test(t.tagName)) return;
    const i = ['1', '2', '3'].indexOf(ev.key);
    if (i >= 0) { go(VIEWS[i]); ev.preventDefault(); }
  });
  addEventListener('hashchange', () => go(location.hash.slice(1)));

  go(location.hash.slice(1) || store.get('view', 'skrining'));

  /* Tautan dalam untuk demo dan pitching:
     ?kohort=contoh  — langsung memuat kohort contoh
     ?responden=acak — langsung mengisi formulir dengan satu responden acak   */
  const q = new URLSearchParams(location.search);
  if (q.get('kohort') === 'contoh') { go('kohort'); $('#a-kohort').click(); }
  if (q.get('responden') === 'acak') { go('skrining'); $('#a-acak').click(); }
})();
