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

## Apa yang bisa dilakukan

**Skrining individu.** Tujuh belas pertanyaan yang muat dalam wawancara singkat. Keluarannya bukan
label, melainkan posisi pada skala: E[y] ditampilkan sebagai jarum pada sumbu yang sama dengan
ketiga ambang batas produksi dan sebaran populasi latih. Ketika seorang responden jatuh 0,02 dari
sebuah ambang, panel mengatakannya — informasi yang hilang begitu keluaran disederhanakan menjadi
satu angka. Panel *faktor pendorong* menghitung seberapa jauh E[y] bergerak bila tiap variabel
dikembalikan ke median populasi, sehingga pembacaan dapat dijelaskan per responden.

**Analisis kohort.** Muat kohort contoh atau unggah CSV sendiri; penilaian berjalan dalam irisan
waktu sehingga antarmuka tidak membeku. Ambang penapisan t₃ dapat **diseret langsung pada
histogram** (juga dapat digerakkan dengan panah papan tik), dan histogram berubah warna seketika
mengikuti ambang baru — jumlah orang yang tertangkap ikut terhitung ulang. Tabel peringkat
prioritas dapat diurutkan, dan mengklik satu baris membuka responden itu di panel skrining.
Seluruh hasil dapat diekspor sebagai CSV.

**Model card.** Spesifikasi, perbandingan terbuka terhadap pipeline kompetisi, batas pemakaian,
dan jalur reproduksi.

### Detail yang mungkin tidak langsung terlihat

- Non-respons diteruskan apa adanya ke model — tidak diimputasi — persis seperti pipeline kompetisi.
- Ambang penapisan pilihan Anda tersimpan antar kunjungan.
- Pintasan papan tik `1` `2` `3` untuk berpindah panel; setiap panel punya tautan `#`-nya sendiri.
- Tautan demo: `?kohort=contoh` langsung memuat kohort, `?responden=acak` langsung mengisi formulir.
- Tidak ada skrip pihak ketiga, tidak ada permintaan jaringan setelah muat, tidak ada data yang keluar dari peramban.

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
