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

## Tujuh panel, masing-masing satu pekerjaan

**Ikhtisar** menjelaskan untuk apa alat ini dibuat: masalahnya, tiga temuan yang membentuknya,
dan empat titik masuk.

**Skrining** menilai satu responden dari 17 pertanyaan yang muat dalam wawancara singkat.
Keluarannya bukan label melainkan posisi: E[y] tampil sebagai jarum pada sumbu yang sama dengan
ketiga ambang batas produksi dan sebaran populasi latih. Ketika seorang responden jatuh 0,02 dari
sebuah ambang, panel mengatakannya. Panel *faktor pendorong* menghitung seberapa jauh E[y]
bergerak bila tiap variabel dikembalikan ke median, sehingga pembacaan dapat dijelaskan.

**Kohort** menilai sekumpulan orang sekaligus — muat contoh atau unggah CSV sendiri. Penilaian
berjalan dalam irisan waktu sehingga antarmuka tidak membeku, lalu menampilkan komposisi kelas,
sebaran E[y], dan pembacaan kuartilnya.

**Prioritas** adalah keluaran yang benar-benar dipakai perencana program: tabel terurut yang bisa
disortir, diklik untuk membuka satu responden di panel skrining, dan diekspor sebagai CSV.

**Ambang** adalah laboratorium kalibrasi. Garis t₃ diseret langsung pada histogram (atau digerakkan
dengan panah papan tik); histogram, komposisi kelas, tabel prioritas, dan panel skrining ikut
berubah seketika. Pilihan Anda tersimpan antar kunjungan.

**Cara kerja** menjelaskan pipeline dalam empat langkah, lalu membiarkan Anda menelusuri kohort
satu per satu untuk melihat di mana `argmax` dan aturan ordinal memilih kelas yang berbeda —
pada kohort contoh, keduanya berbeda pada 126 dari 800 responden.

**Model** memuat spesifikasi, perbandingan terbuka terhadap pipeline kompetisi, batas pemakaian,
dan jalur reproduksi.

### Detail yang mungkin tidak langsung terlihat

- Non-respons diteruskan apa adanya ke model — tidak diimputasi — persis seperti pipeline kompetisi.
- Pintasan papan tik `1`–`7` untuk berpindah panel; setiap panel punya tautan `#`-nya sendiri.
- Tautan demo: `?kohort=contoh` langsung memuat kohort, `?responden=acak` langsung mengisi formulir.
- Tidak ada skrip pihak ketiga, tidak ada permintaan jaringan setelah muat, tidak ada data yang
  keluar dari peramban.
- Mendukung `prefers-reduced-motion` dan `prefers-reduced-transparency`; seluruh warna teks
  diverifikasi minimal 4,5:1 terhadap setiap permukaan.

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

## Menyebarkan (deploy)

Aplikasi ini statis sepenuhnya — tidak ada langkah build, tidak ada server.

**GitHub Pages** menyajikannya langsung dari cabang `main` tanpa konfigurasi tambahan.

**Vercel** memerlukan `vercel.json` dan `.vercelignore` yang sudah disertakan di repositori ini.
Tanpa keduanya, Vercel memindai repo, menemukan `docs/requirements.txt` dan
`model/train_surrogate.py`, menyimpulkan ini proyek Python, lalu gagal dengan
*"No python entrypoint found"*. `.vercelignore` mengeluarkan kedua berkas itu dari unggahan
(keduanya tetap ada di GitHub), dan `vercel.json` menyatakan proyek ini statis sekaligus
memasang header cache dan keamanan. Bila Anda lebih suka mengatur lewat dasbor: setel
*Framework Preset* ke **Other**, kosongkan *Build Command*, dan biarkan *Output Directory* kosong.

Jangan menyetel `outputDirectory` di `vercel.json` untuk proyek ini. Situs ini tidak punya langkah
build, jadi tidak ada direktori keluaran yang diproduksi — menyetelnya membuat Vercel menyajikan
direktori kosong dan seluruh path membalas 404. Tanpa kunci itu, Vercel menyajikan akar
repositori apa adanya.

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
