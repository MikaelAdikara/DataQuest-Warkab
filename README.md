# LifeScope — Tim Warkab

Prototipe skrining kepuasan hidup tingkat populasi, dibangun di atas pipeline kompetisi
**Objective Quest DataQuest 5.0** (prediksi `life_satisfaction`, metrik Quadratic Weighted Kappa).

> **Tesis proyek ini:** tuas terbesar dalam kompetisi ini bukan model, melainkan aturan keputusan.
> Mengganti `argmax` dengan nilai harapan ordinal + tiga ambang batas menyumbang **+0,06269 QWK**
> pada model yang sama persis. Seluruh sisa pekerjaan — lima model dasar tambahan, stacking, dan
> studi estimasi ambang — hanya menyumbang **+0,00708**.

Demo langsung: **https://mikaeladikara.github.io/DataQuest-Warkab/**

---

## Apa isi repositori ini

| Jalur | Isi |
|---|---|
| `index.html`, `assets/` | Aplikasi LifeScope — berjalan sepenuhnya di peramban, tanpa server |
| `data/model_lifescope.json` | Model ringkas 17 variabel (pohon keputusan + ambang batas), diekspor dari LightGBM |
| `data/kohort_contoh.json` | 800 responden dari `test_final.csv` **tanpa label**, untuk demo kohort |
| `model/train_surrogate.py` | Skrip yang memproduksi ulang model ringkas tersebut secara identik |
| `docs/` | Notebook kompetisi lengkap, `requirements.txt`, dan pitch deck |

## Tiga hal yang ditunjukkan prototipe ini

**1 · Aturan keputusan, bukan label.** Panel *Skrining individu* menampilkan E[y] = Σ pₖ·k sebagai
posisi pada skala kontinu, lengkap dengan ketiga ambang batas produksi. Ketika seorang responden
jatuh 0,02 dari sebuah ambang, panel mengatakannya — sesuatu yang hilang begitu keluarannya
disederhanakan menjadi satu label.

**2 · Ambang penapisan dapat digeser, dan konsekuensinya terukur.** Panel *Analisis kohort* berisi
slider t₃. Ambang yang optimal untuk QWK menyeimbangkan seluruh kelas; penapisan kesehatan biasanya
lebih menoleransi positif palsu daripada melewatkan kasus. Slider itu menunjukkan berapa orang
tambahan yang tertangkap untuk setiap penurunan ambang.

**3 · Keluaran yang berguna adalah peringkat, bukan kelas.** Tabel dua puluh responden dengan E[y]
tertinggi adalah bentuk keluaran yang benar-benar dipakai perencana program.

## Hubungan dengan pipeline kompetisi

Model di halaman ini adalah **versi ringkas**, bukan pipeline yang dikumpulkan ke panitia.

|  | Pipeline kompetisi | Model ringkas LifeScope |
|---|---|---|
| Fitur | 176 | 17, semuanya dapat ditanyakan dalam wawancara singkat |
| Model dasar | 6 keluarga + meta-learner | 1 LightGBM ringkas |
| Berkas model | 84 MB (`joblib`) | ±1 MB (JSON, berjalan di peramban) |
| Aturan keputusan | E[y] + 3 ambang batas | **identik** |

Selisih kinerja dilaporkan terbuka di panel *Model card* aplikasi. Yang dipertahankan persis adalah
bagian yang paling menentukan skor, yaitu aturan keputusannya.

## Kepatuhan dan batasan

- Dilatih **hanya** pada `train_final.csv` resmi panitia. Tidak ada data eksternal.
- `random_state = 42` di setiap tahap; `model/train_surrogate.py` memproduksi ulang berkas model secara identik.
- Kohort contoh diambil dari `test_final.csv` **tanpa kolom label**, murni sebagai masukan demonstrasi.
- **Alat penapisan populasi, bukan diagnosis individual.** Sebaran E[y] untuk kelas 1 dan 2 bertumpang
  tindih sangat lebar; untuk satu orang ketidakpastiannya besar.
- Kelas 4 hanya memiliki 893 baris latih, sehingga ambang t₃ adalah parameter paling rapuh
  (simpangan baku bootstrap 3,6× lebih besar daripada t₁).
- Sekitar separuh variasi kepuasan hidup tidak terekam dalam survei kesehatan mana pun — ini batas
  informasi, bukan batas algoritma.

## Menjalankan secara lokal

Aplikasi memuat berkas JSON lewat `fetch`, sehingga perlu server statis — membuka `index.html`
langsung dari disk tidak akan bekerja.

```bash
python -m http.server 8000
```

Lalu buka `http://localhost:8000`.

Untuk membangun ulang model ringkas dari data resmi:

```bash
python model/train_surrogate.py
```


---

## Catatan tentang berkas kohort contoh

`data/kohort_contoh.json` berisi **800 baris fitur** dari `test_final.csv` — tanpa kolom label —
semata sebagai masukan demonstrasi. Bila ketentuan panitia melarang penyebarluasan ulang berkas
data mereka, hapus saja berkas itu: aplikasi tetap berjalan penuh dan panel kohort beralih ke
mode unggah CSV milik pengguna sendiri.

---

Tim Warkab · Objective Quest DataQuest 5.0
