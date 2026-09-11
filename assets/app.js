/* LifeScope — prototipe skrining kepuasan hidup, Tim Warkab.
   Seluruh inferensi berjalan di peramban: evaluasi pohon keputusan, nilai
   harapan pada skala ordinal, lalu pemotongan dengan tiga ambang batas. */
'use strict';

var ORD = ['#2f6b5f', '#8fb0a4', '#d8a25e', '#a8442a'];
var NAMA = ['Sangat puas', 'Puas', 'Tidak puas', 'Sangat tidak puas'];
var INK = '#16191d', LINE = '#dcd8d1', MUTED = '#6e747c', TINT = '#f4f1ec';

var YN = [[1, 'Ya'], [2, 'Tidak']];
var FREQ = [[1, 'Setiap hari'], [2, 'Setiap minggu'], [3, 'Setiap bulan'],
            [4, 'Beberapa kali setahun'], [5, 'Tidak pernah']];
/* Kolom difficulty_* pada data berisi empat tingkat, bukan Ya/Tidak seperti
   tertulis di kamus data panitia. Label di bawah mengikuti data, bukan kamus. */
var SULIT = [[1, 'Tidak ada kesulitan'], [2, 'Sedikit kesulitan'],
             [3, 'Banyak kesulitan'], [4, 'Sama sekali tidak bisa']];
/* education_level berisi sepuluh tingkat berurutan pada data (kamus hanya menyebut empat). */
var DIDIK = [];
for (var _e = 1; _e <= 10; _e++) DIDIK.push([_e, 'Tingkat ' + _e + (_e === 1 ? ' (terendah)' : _e === 10 ? ' (tertinggi)' : '')]);

var FIELDS = [
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

var M = null, COHORT = null, IDX = {}, MEDIAN = [], T3_OPT = 0;
var $ = function (s) { return document.querySelector(s); };
var el = function (t, c, h) { var e = document.createElement(t); if (c) e.className = c; if (h !== undefined) e.innerHTML = h; return e; };
var fmt = function (v, d) { return v.toFixed(d === undefined ? 3 : d).replace('.', ','); };

/* ---------------- inferensi ---------------- */
function leafValue(node, x) {
  while (node.v === undefined) {
    var v = x[node.f];
    if (v === null || v === undefined || v !== v) node = node.m ? node.l : node.r;
    else node = (v <= node.t) ? node.l : node.r;
  }
  return node.v;
}
function proba(x) {
  var raw = [0, 0, 0, 0], i;
  for (i = 0; i < M.trees.length; i++) raw[M.trees[i].c] += leafValue(M.trees[i].n, x);
  var mx = Math.max(raw[0], raw[1], raw[2], raw[3]), s = 0, p = [0, 0, 0, 0];
  for (i = 0; i < 4; i++) { p[i] = Math.exp(raw[i] - mx); s += p[i]; }
  for (i = 0; i < 4; i++) p[i] /= s;
  return p;
}
function expected(p) { return p[0] + 2 * p[1] + 3 * p[2] + 4 * p[3]; }
function klas(E, t) { return 1 + (E > t[0] ? 1 : 0) + (E > t[1] ? 1 : 0) + (E > t[2] ? 1 : 0); }

/* ---------------- formulir ---------------- */
function buildForm() {
  var host = $('#form'), groups = [], seen = {};
  FIELDS.forEach(function (f) { if (!seen[f.g]) { seen[f.g] = 1; groups.push(f.g); } });
  groups.forEach(function (g) {
    var box = el('div', 'fgroup');
    box.appendChild(el('div', 'fgroup-h', g));
    FIELDS.filter(function (f) { return f.g === g; }).forEach(function (f) {
      var row = el('div', 'f');
      var lab = el('label', null, f.l); lab.setAttribute('for', 'i_' + f.k);
      row.appendChild(lab);
      var inp;
      if (f.o) {
        inp = el('select');
        f.o.forEach(function (o) {
          var op = el('option', null, o[0] + ' — ' + o[1]); op.value = o[0]; inp.appendChild(op);
        });
        var na = el('option', null, '— tidak menjawab —'); na.value = ''; inp.appendChild(na);
      } else {
        inp = el('input'); inp.type = 'number';
        inp.min = f.n.min; inp.max = f.n.max; inp.step = f.n.step;
      }
      inp.id = 'i_' + f.k; inp.dataset.k = f.k;
      inp.addEventListener('change', render); inp.addEventListener('input', render);
      row.appendChild(inp); box.appendChild(row);
    });
    host.appendChild(box);
  });
}
function readX() {
  return M.features.map(function (k, i) {
    var e = document.getElementById('i_' + k);
    if (!e) return MEDIAN[i];
    if (e.value === '') return NaN;              // non-respons diteruskan apa adanya
    var v = parseFloat(e.value);
    return (v === v) ? v : MEDIAN[i];
  });
}
function writeX(x) {
  M.features.forEach(function (k, i) {
    var e = document.getElementById('i_' + k);
    if (!e) return;
    var v = x[i];
    if (v === null || v === undefined || v !== v) v = MEDIAN[i];
    if (e.tagName === 'SELECT') {
      var r = Math.round(v), ok = false;
      for (var j = 0; j < e.options.length; j++) if (+e.options[j].value === r) ok = true;
      e.value = ok ? r : e.options[0].value;
    } else {
      e.value = (k === 'age') ? Math.round(v) : Math.round(v * 10) / 10;
    }
  });
}

/* ---------------- skala ordinal ---------------- */
function drawScale(E) {
  var t = M.thresholds, W = 640, x0 = 30, x1 = 610, lo = 1, hi = 3;
  var px = function (v) { return x0 + (Math.min(hi, Math.max(lo, v)) - lo) / (hi - lo) * (x1 - x0); };
  var y = 34, h = 36, s = ['<svg viewBox="0 0 ' + W + ' 100" xmlns="http://www.w3.org/2000/svg">'];
  var z = [[lo, t[0]], [t[0], t[1]], [t[1], t[2]], [t[2], hi]];
  z.forEach(function (zz, i) {
    var a = px(zz[0]), b = px(zz[1]);
    s.push('<rect x="' + a + '" y="' + y + '" width="' + (b - a) + '" height="' + h + '" fill="' + ORD[i] + '" stroke="#fff" stroke-width="1.5"/>');
    if (b - a > 42) s.push('<text x="' + ((a + b) / 2) + '" y="' + (y + h / 2 + 4) + '" text-anchor="middle" font-size="11.5" font-weight="700" fill="' + (i === 1 ? INK : '#fff') + '" font-family="Calibri,sans-serif">kelas ' + (i + 1) + '</text>');
  });
  t.forEach(function (v, i) {
    var a = px(v);
    s.push('<line x1="' + a + '" y1="' + (y - 9) + '" x2="' + a + '" y2="' + (y + h + 8) + '" stroke="' + INK + '" stroke-width="1"/>');
    s.push('<text x="' + a + '" y="' + (y + h + 24) + '" text-anchor="middle" font-size="12" font-weight="700" fill="' + INK + '" font-family="Calibri,sans-serif">t' + (i + 1) + '</text>');
    s.push('<text x="' + a + '" y="' + (y + h + 38) + '" text-anchor="middle" font-size="11" fill="' + MUTED + '" font-family="Calibri,sans-serif">' + fmt(v, 3) + '</text>');
  });
  s.push('<text x="' + x0 + '" y="' + (y + h + 24) + '" text-anchor="start" font-size="11" fill="' + MUTED + '" font-family="Calibri,sans-serif">1,0</text>');
  s.push('<text x="' + x1 + '" y="' + (y + h + 24) + '" text-anchor="end" font-size="11" fill="' + MUTED + '" font-family="Calibri,sans-serif">3,0</text>');
  var m = px(E);
  s.push('<polygon points="' + (m - 7) + ',' + (y - 14) + ' ' + (m + 7) + ',' + (y - 14) + ' ' + m + ',' + (y - 3) + '" fill="' + INK + '"/>');
  s.push('<line x1="' + m + '" y1="' + (y - 3) + '" x2="' + m + '" y2="' + (y + h + 3) + '" stroke="' + INK + '" stroke-width="2.2"/>');
  s.push('<text x="' + m + '" y="' + (y - 20) + '" text-anchor="middle" font-size="11.5" font-weight="700" fill="' + INK + '" font-family="Calibri,sans-serif">E[y]</text>');
  s.push('</svg>');
  $('#scale').outerHTML = s.join('').replace('<svg ', '<svg id="scale" class="scale" ');
}

/* ---------------- render individu ---------------- */
function render() {
  if (!M) return;
  var x = readX(), p = proba(x), E = expected(p), k = klas(E, M.thresholds);
  $('#ey-val').textContent = fmt(E, 3);
  $('#ey-val').style.color = ORD[k - 1];
  drawScale(E);

  var jarak = [M.thresholds[0], M.thresholds[1], M.thresholds[2]].map(function (t) { return Math.abs(E - t); });
  var dekat = Math.min.apply(null, jarak);
  var tegas = dekat > 0.12 ? 'jelas berada di dalam zona ini' :
    'hanya ' + fmt(dekat, 3) + ' dari ambang terdekat — klasifikasinya tidak tegas';
  $('#verdict').innerHTML = 'Kelas prediksi: <b style="color:' + ORD[k - 1] + '">' + k + ' — ' + NAMA[k - 1] + '</b>. ' +
    'Posisinya ' + tegas + '.';

  var ph = $('#probs'); ph.innerHTML = '';
  p.forEach(function (v, i) {
    var r = el('div', 'pbar');
    r.appendChild(el('span', null, (i + 1) + ' — ' + NAMA[i]));
    var tr = el('div', 'ptrack'), fl = el('div', 'pfill');
    fl.style.width = (v * 100).toFixed(1) + '%'; fl.style.background = ORD[i];
    tr.appendChild(fl); r.appendChild(tr);
    r.appendChild(el('span', 'pval', (v * 100).toFixed(1).replace('.', ',') + '%'));
    ph.appendChild(r);
  });

  var d = M.features.map(function (key, i) {
    var y = x.slice(); y[i] = MEDIAN[i];
    return { k: key, d: E - expected(proba(y)) };
  }).filter(function (o) { return Math.abs(o.d) > 0.0005; });
  d.sort(function (a, b) { return Math.abs(b.d) - Math.abs(a.d); });
  d = d.slice(0, 7);
  var mx = d.length ? Math.abs(d[0].d) : 1;
  var dh = $('#drivers'); dh.innerHTML = '';
  if (!d.length) { dh.appendChild(el('p', 'note tight', 'Semua variabel berada pada median populasi.')); }
  d.forEach(function (o) {
    var f = FIELDS.filter(function (z) { return z.k === o.k; })[0];
    var r = el('div', 'drv');
    r.appendChild(el('span', null, f ? f.l : o.k));
    var tr = el('div', 'drv-track');
    tr.appendChild(el('div', 'drv-mid'));
    var fl = el('div', 'drv-fill');
    var w = Math.abs(o.d) / mx * 50;
    if (o.d >= 0) { fl.style.left = '50%'; fl.style.background = ORD[3]; }
    else { fl.style.left = (50 - w) + '%'; fl.style.background = ORD[0]; }
    fl.style.width = w + '%';
    tr.appendChild(fl); r.appendChild(tr);
    r.appendChild(el('span', 'drv-val', (o.d >= 0 ? '+' : '−') + fmt(Math.abs(o.d), 3)));
    dh.appendChild(r);
  });
}

/* ---------------- kohort ---------------- */
function scoreCohort(rows) {
  return rows.map(function (r, i) {
    var p = proba(r), E = expected(p);
    return { i: i, x: r, p: p, E: E };
  }).sort(function (a, b) { return b.E - a.E; });
}
function statBox(v, l, c) {
  var s = el('div', 'st');
  var vv = el('div', 'st-v', v); if (c) vv.style.color = c;
  s.appendChild(vv); s.appendChild(el('div', 'st-l', l));
  return s;
}
function drawHist(scored, t3) {
  var W = 900, H = 260, L = 44, R = 16, TP = 14, BT = 34;
  var lo = 1, hi = 3, nb = 48, bins = new Array(nb).fill(0);
  scored.forEach(function (o) {
    var b = Math.floor((Math.min(hi - 1e-9, Math.max(lo, o.E)) - lo) / (hi - lo) * nb);
    bins[b]++;
  });
  var mx = Math.max.apply(null, bins) || 1;
  var px = function (v) { return L + (v - lo) / (hi - lo) * (W - L - R); };
  var py = function (c) { return H - BT - c / mx * (H - TP - BT); };
  var t = M.thresholds, s = ['<svg viewBox="0 0 ' + W + ' ' + H + '" xmlns="http://www.w3.org/2000/svg">'];
  for (var g = 0; g <= 4; g++) {
    var yy = TP + g / 4 * (H - TP - BT);
    s.push('<line x1="' + L + '" y1="' + yy + '" x2="' + (W - R) + '" y2="' + yy + '" stroke="' + LINE + '" stroke-width="1"/>');
    s.push('<text x="' + (L - 8) + '" y="' + (yy + 4) + '" text-anchor="end" font-size="10" fill="' + MUTED + '" font-family="Calibri,sans-serif">' + Math.round(mx * (1 - g / 4)) + '</text>');
  }
  var bw = (W - L - R) / nb;
  bins.forEach(function (c, i) {
    if (!c) return;
    var v = lo + (i + 0.5) / nb * (hi - lo);
    var ci = (v > t[2]) ? 3 : (v > t[1]) ? 2 : (v > t[0]) ? 1 : 0;
    s.push('<rect x="' + (L + i * bw) + '" y="' + py(c) + '" width="' + (bw - 1) + '" height="' + (H - BT - py(c)) + '" fill="' + ORD[ci] + '"/>');
  });
  t.forEach(function (v, i) {
    s.push('<line x1="' + px(v) + '" y1="' + TP + '" x2="' + px(v) + '" y2="' + (H - BT) + '" stroke="' + INK + '" stroke-width="1.2" stroke-dasharray="4 3"/>');
    s.push('<text x="' + px(v) + '" y="' + (TP + 11) + '" text-anchor="middle" font-size="10.5" font-weight="700" fill="' + INK + '" font-family="Calibri,sans-serif">t' + (i + 1) + '</text>');
  });
  if (t3 !== undefined && Math.abs(t3 - t[2]) > 0.005) {
    s.push('<line x1="' + px(t3) + '" y1="' + TP + '" x2="' + px(t3) + '" y2="' + (H - BT) + '" stroke="#a8442a" stroke-width="2"/>');
    s.push('<text x="' + px(t3) + '" y="' + (H - BT - 6) + '" text-anchor="middle" font-size="10.5" font-weight="700" fill="#a8442a" font-family="Calibri,sans-serif">t3 penapisan</text>');
  }
  s.push('<line x1="' + L + '" y1="' + (H - BT) + '" x2="' + (W - R) + '" y2="' + (H - BT) + '" stroke="' + INK + '" stroke-width="1"/>');
  [1, 1.25, 1.5, 1.75, 2, 2.25, 2.5, 2.75, 3].forEach(function (v) {
    s.push('<text x="' + px(v) + '" y="' + (H - BT + 16) + '" text-anchor="middle" font-size="10" fill="' + MUTED + '" font-family="Calibri,sans-serif">' + fmt(v, 2) + '</text>');
  });
  s.push('<text x="' + ((L + W - R) / 2) + '" y="' + (H - 4) + '" text-anchor="middle" font-size="10.5" fill="' + MUTED + '" font-style="italic" font-family="Calibri,sans-serif">E[y] — nilai harapan pada skala kepuasan</text>');
  s.push('</svg>');
  $('#hist').outerHTML = s.join('').replace('<svg ', '<svg id="hist" class="hist" ');
}
function renderCohort() {
  var sc = COHORT, n = sc.length, t = M.thresholds;
  var cnt = [0, 0, 0, 0];
  sc.forEach(function (o) { cnt[klas(o.E, t) - 1]++; });
  var h = $('#kohort-stats'); h.innerHTML = '';
  h.appendChild(statBox(String(n), 'Responden dinilai'));
  h.appendChild(statBox(fmt(sc.reduce(function (a, o) { return a + o.E; }, 0) / n, 3), 'Rata-rata E[y] kohort'));
  h.appendChild(statBox(((cnt[2] + cnt[3]) / n * 100).toFixed(1).replace('.', ',') + '%', 'Diprediksi kelas 3 atau 4', ORD[3]));
  h.appendChild(statBox(cnt.map(function (c) { return Math.round(c / n * 100); }).join(' / '), 'Sebaran kelas 1/2/3/4 (%)'));
  drawHist(sc, +$('#t3').value);
  renderLab();
  var tb = $('#top-tbl');
  var head = '<tr><th>#</th><th>E[y]</th><th>Kelas</th><th>Kesehatan diri</th><th>Depresi</th><th>Pangan</th><th>Usia</th><th>Rasio pendapatan</th></tr>';
  var body = sc.slice(0, 20).map(function (o, i) {
    var k = klas(o.E, t);
    return '<tr><td>' + (i + 1) + '</td><td><b>' + fmt(o.E, 3) + '</b></td>' +
      '<td><span class="chip" style="background:' + ORD[k - 1] + '">' + k + '</span></td>' +
      '<td>' + val(o.x, 'general_health_status') + '</td><td>' + val(o.x, 'depression_frequency') + '</td>' +
      '<td>' + val(o.x, 'food_security_4cat') + '</td><td>' + val(o.x, 'age') + '</td>' +
      '<td>' + val(o.x, 'income_to_poverty_ratio') + '</td></tr>';
  }).join('');
  tb.innerHTML = head + body;
}
function val(x, k) {
  var v = x[IDX[k]];
  if (v === null || v === undefined || v !== v) return '—';
  var f = FIELDS.filter(function (z) { return z.k === k; })[0];
  if (f && f.o) { var m = f.o.filter(function (o) { return o[0] === Math.round(v); })[0]; return m ? m[1] : String(v); }
  return (k === 'age') ? String(Math.round(v)) : fmt(v, 2);
}
function renderLab() {
  if (!COHORT) return;
  var t3 = +$('#t3').value, t = M.thresholds, n = COHORT.length;
  var opt = COHORT.filter(function (o) { return o.E > t[2]; }).length;
  var now = COHORT.filter(function (o) { return o.E > t3; }).length;
  $('#t3-val').textContent = fmt(t3, 2);
  var d = t3 - t[2];
  $('#t3-delta').textContent = Math.abs(d) < 0.005 ? 'pada ambang optimal QWK'
    : (d < 0 ? 'diturunkan ' + fmt(-d, 2) + ' dari optimal QWK' : 'dinaikkan ' + fmt(d, 2) + ' dari optimal QWK');
  var h = $('#lab-stats'); h.innerHTML = '';
  h.appendChild(statBox(String(now), 'Responden ditandai untuk tindak lanjut', ORD[3]));
  h.appendChild(statBox((now / n * 100).toFixed(1).replace('.', ',') + '%', 'Porsi kohort yang ditandai'));
  h.appendChild(statBox((now >= opt ? '+' : '−') + Math.abs(now - opt), 'Selisih terhadap ambang optimal QWK (' + opt + ' orang)'));
  drawHist(COHORT, t3);
}

/* ---------------- CSV ---------------- */
function parseCSV(text) {
  var lines = text.replace(/\r/g, '').split('\n').filter(function (l) { return l.trim().length; });
  if (lines.length < 2) throw new Error('Berkas kosong atau hanya berisi header.');
  var head = lines[0].split(',').map(function (s) { return s.trim().replace(/^"|"$/g, ''); });
  var pos = M.features.map(function (k) { return head.indexOf(k); });
  var miss = M.features.filter(function (k, i) { return pos[i] < 0; });
  if (miss.length) throw new Error('Kolom tidak ditemukan: ' + miss.slice(0, 4).join(', ') + (miss.length > 4 ? ' (+' + (miss.length - 4) + ' lagi)' : ''));
  return lines.slice(1).map(function (l) {
    var c = l.split(',');
    return pos.map(function (p) { var v = parseFloat(c[p]); return (v === v) ? v : null; });
  });
}

/* ---------------- bootstrap ---------------- */
function showTab(id) {
  var b = document.querySelector('.tab[data-panel="' + id + '"]');
  if (!b) return;
  document.querySelectorAll('.tab').forEach(function (x) { x.classList.remove('is-on'); });
  document.querySelectorAll('.panel').forEach(function (x) { x.classList.remove('is-on'); });
  b.classList.add('is-on');
  document.getElementById(id).classList.add('is-on');
  if (history.replaceState) history.replaceState(null, '', '#' + id.replace('p-', ''));
}
function setTabs() {
  document.querySelectorAll('.tab').forEach(function (b) {
    b.addEventListener('click', function () { showTab(b.dataset.panel); });
  });
  var h = (location.hash || '').replace('#', '');
  if (h) showTab('p-' + h);
}
function fillModelCard() {
  var m = M.meta;
  $('#m-trees').textContent = m.n_pohon.toLocaleString('id-ID');
  var c = $('#cmp'); c.innerHTML = '';
  c.appendChild(statBox(fmt(m.qwk_oof_ambang, 5), 'QWK out-of-fold model ringkas ini — 17 variabel'));
  c.appendChild(statBox(fmt(m.qwk_pipeline_penuh, 5), 'QWK out-of-fold pipeline kompetisi — 176 fitur, 6 model'));
  c.appendChild(statBox(fmt(m.qwk_oof_argmax, 5), 'Model ringkas yang sama, tetapi memakai argmax', ORD[3]));
  c.appendChild(statBox('+' + fmt(m.qwk_oof_ambang - m.qwk_oof_argmax, 5), 'Sumbangan aturan keputusan ordinal di model ringkas ini', ORD[0]));
}

fetch('data/model_lifescope.json').then(function (r) { return r.json(); }).then(function (m) {
  M = m;
  M.features.forEach(function (k, i) { IDX[k] = i; });
  MEDIAN = M.features.map(function (k) { return M.stats[k].median; });
  T3_OPT = M.thresholds[2];
  buildForm(); setTabs(); fillModelCard();
  writeX(MEDIAN.slice()); render();

  if (/kohort/.test(location.hash)) {
    loadCohort().then(function (rows) {
      COHORT = scoreCohort(rows);
      $('#kohort-status').textContent = 'Kohort contoh: ' + rows.length + ' responden dari test_final.csv (tanpa label).';
      $('#kohort-body').classList.remove('hidden');
      renderCohort();
    });
  }
  if (/[?&]demo=1/.test(location.search)) {
    loadCohort().then(function (rows) {
      var sc = scoreCohort(rows);
      writeX(sc[Math.floor(sc.length * 0.06)].x);   // responden dengan E[y] tinggi, bukan ekstrem
      render();
    });
  }

  $('#t3').value = T3_OPT;
  $('#t3').addEventListener('input', renderLab);
  $('#btn-reset-t3').addEventListener('click', function () { $('#t3').value = T3_OPT; renderLab(); });
  $('#btn-median').addEventListener('click', function () { writeX(MEDIAN.slice()); render(); });

  $('#btn-acak').addEventListener('click', function () {
    loadCohort().then(function (rows) {
      var r = rows[Math.floor(Math.random() * rows.length)];
      writeX(r); render();
    }).catch(function () {});
  });
  $('#btn-kohort').addEventListener('click', function () {
    loadCohort().then(function (rows) {
      COHORT = scoreCohort(rows);
      $('#kohort-status').textContent = 'Kohort contoh: ' + rows.length + ' responden dari test_final.csv (tanpa label).';
      $('#kohort-body').classList.remove('hidden');
      renderCohort();
    }).catch(function () {});
  });
  $('#file').addEventListener('change', function (e) {
    var f = e.target.files[0]; if (!f) return;
    var rd = new FileReader();
    rd.onload = function () {
      try {
        var rows = parseCSV(rd.result);
        COHORT = scoreCohort(rows);
        $('#kohort-status').textContent = f.name + ' — ' + rows.length + ' baris dinilai.';
        $('#kohort-body').classList.remove('hidden');
        renderCohort();
      } catch (err) { $('#kohort-status').textContent = 'Gagal: ' + err.message; }
    };
    rd.readAsText(f);
  });
}).catch(function (e) {
  document.body.insertAdjacentHTML('afterbegin',
    '<div class="wrap" style="padding:24px;color:#a8442a">Gagal memuat model: ' + e.message +
    '. Halaman ini perlu dijalankan lewat server statis (mis. <code>python -m http.server</code>), bukan dibuka langsung sebagai berkas.</div>');
});

var _cohortCache = null;
function loadCohort() {
  if (_cohortCache) return Promise.resolve(_cohortCache);
  return fetch('data/kohort_contoh.json').then(function (r) {
    if (!r.ok) throw new Error('berkas kohort contoh tidak tersedia');
    return r.json();
  }).then(function (d) {
    var pos = M.features.map(function (k) { return d.features.indexOf(k); });
    _cohortCache = d.rows.map(function (r) { return pos.map(function (p) { return r[p]; }); });
    return _cohortCache;
  }).catch(function () {
    var el2 = $('#kohort-status');
    if (el2) el2.textContent = 'Kohort contoh tidak disertakan pada salinan ini — silakan unggah CSV sendiri dengan ke-17 kolom tersebut.';
    return Promise.reject(new Error('kohort contoh tidak tersedia'));
  });
}
