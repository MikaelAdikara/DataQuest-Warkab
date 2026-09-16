# Context untuk GPT · Upgrade Pitch Deck Tim Warkab

Dokumen ini memberi semua yang dibutuhkan untuk menghasilkan atau memperbaiki slide pitch deck proyek ini tanpa mengarang. Baca seluruhnya sebelum menulis satu slide pun.

---

## 1. Peranmu dan hasil yang diharapkan

Kamu adalah desainer presentasi sekaligus data scientist senior. Tugasmu menghasilkan slide pitch deck berbahasa Indonesia untuk juri akademik (dosen) di kompetisi data science **Objective Quest DataQuest 5.0**.

Juri akan menilai: kedalaman teknis, justifikasi metodologi, penerapan di dunia nyata, dan kejelasan storytelling. Mereka ingin melihat proyek yang **benar-benar bisa diterapkan dan bermanfaat**, bukan laporan tugas lomba.

**Format keluaran yang diminta** (kecuali pengguna meminta lain): untuk setiap slide tuliskan
1. Nomor dan judul slide (satu kalimat klaim, maksimal ±65 karakter)
2. Subjudul (satu kalimat)
3. Tata letak (panel, grafik, tabel, posisi)
4. Isi lengkap per elemen, dengan angka persis dari Bagian 5
5. Badge keunggulan (jika ada)
6. Catatan pembicara (2 sampai 4 kalimat)

---

## 2. Aturan wajib

1. **Jangan mengarang angka, sumber, atau fitur aplikasi.** Semua angka harus berasal dari Bagian 5. Jika butuh angka yang tidak ada, tulis `[PERLU DATA: ...]`.
2. **Jangan menyebut tim lain secara spesifik.** Bandingkan dengan "pendekatan standar" (argmax, mengejar akurasi, memilih skor validasi tertinggi).
3. **Model ini alat penapisan populasi, bukan diagnosis.** Jangan pernah mengklaim mendiagnosis depresi atau risiko bunuh diri individu.
4. **Jangan klaim model langsung berlaku di Indonesia.** Data latih bukan data Indonesia; validasi eksternal adalah syarat.
5. **Data eksternal tidak dipakai untuk melatih model** (pasal B.1.a). Statistik WHO, Riskesdas, dan literatur hanya konteks.
6. Bahasa Indonesia baku tapi hidup. Desimal pakai koma (0,48425), ribuan pakai titik (95.609).
7. **Tanpa em dash (—).** Pakai koma, titik dua, atau kalimat baru. Hindari frasa klise AI ("di era digital", "revolusioner", "memanfaatkan kekuatan").
8. Maksimal sekitar 60 kata teks tampil per slide konten; detail pindah ke catatan pembicara.
9. Setiap klaim keunggulan harus disertai angka buktinya di slide yang sama.

---

## 3. Ringkasan proyek

**Nama:** *Membaca Skala, Bukan Menebak Kelas* · produk: **LifeScope**

**Masalah nyata:** Orang dengan kepuasan hidup rendah jarang terlihat sampai terlambat. Survei kesehatan rutin sudah menanyakan kepuasan hidup, tetapi hasilnya hanya menjadi satu persentase agregat (4,7% tidak puas) tanpa nama yang bisa ditindaklanjuti.

**Tujuan:** Mengubah jawaban survei yang sudah ada menjadi **daftar prioritas** orang yang paling mungkin tidak puas dengan hidupnya, supaya bantuan datang lebih awal.

**Tugas teknis:** Memprediksi `life_satisfaction` (4 kelas ordinal: 1 Sangat puas, 2 Puas, 3 Tidak puas, 4 Sangat tidak puas) dari 176 variabel survei kesehatan, dinilai dengan **Quadratic Weighted Kappa (QWK)**.

**Solusi inti:** Stacking lima model pohon, nilai harapan `E[y] = Σ pₖ·k`, lalu tiga ambang ordinal yang diestimasi dengan rata-rata bootstrap dan dipilih lewat uji split-half.

**Penerima manfaat:**
- Layanan kesehatan primer (puskesmas, dinas kesehatan): prioritas kunjungan dan rujukan konseling
- Program kesejahteraan karyawan dan penyedia asuransi: menjangkau peserta berisiko lebih awal
- Pembuat kebijakan dan peneliti: instrumen 17 pertanyaan yang murah untuk pemetaan per wilayah

---

## 4. Alur cerita (27 slide: 25 inti + 2 cadangan)

Navigasi bawah tiap slide: `I · Masalah & data` · `II · EDA` · `III · Pipeline` · `IV · Demo` · `V · Hasil & plafon` · `VI · Dampak`

| # | Babak | Judul slide | Fungsi dalam cerita | Badge keunggulan |
|---|---|---|---|---|
| 1 | Pembuka | Membaca Skala, Bukan Menebak Kelas | Identitas proyek dan tujuan satu kalimat | – |
| 2 | Pembuka | Orang yang tidak puas dengan hidupnya jarang terlihat, sampai terlambat | **Hook empati**: bahaya nyata, statistik WHO dan Riskesdas | – |
| 3 | I | Datanya sudah ada. Yang belum ada adalah siapa orangnya | Celah dunia nyata, tujuan, tiga penerima manfaat | – |
| 4 | I | "Semua baik-baik saja": akurasi 50,4%, tak menemukan siapa pun | Jembatan ke teknis: kenapa akurasi menyesatkan, kenapa QWK, spesifikasi data | – |
| 5 | I | Enam hal yang membedakan pipeline kami dari pendekatan standar | **Janji keunggulan kompetitif**, dibuktikan di slide berikutnya | – |
| 6 | I | QWK menghitung jarak, jadi targetnya skala, bukan empat kotak | Rumus QWK, matriks penalti, E[y] dan tiga ambang | aturan keputusan ordinal, bukan argmax |
| 7 | I | Kenapa masalah ini sulit: empat akar, empat jawaban | Peta masalah ke solusi | – |
| 8 | II | EDA 1 · Target timpang, kosong merata, kode 7/8/9 bermakna | Tiga temuan dan implikasinya | – |
| 9 | II | EDA 2 · Sinyalnya monoton, tersebar tipis, dan stabil empat tahun | Tiga temuan dan implikasinya | – |
| 10 | II | EDA 3 · Penentu terbesar tak terekam, dua kebocoran ditolak | Domain sinyal dan kebocoran | kebocoran diukur lalu ditolak |
| 11 | II | Tiap keputusan desain terlacak ke satu temuan EDA | Rantai 10 temuan ke 10 keputusan | – |
| 12 | III | Tujuh keputusan preprocessing, lalu 13 fitur komposit yang kami buang | Preprocessing dan ablasi | fitur dipakai hanya jika lolos ablasi |
| 13 | III | Satu pembagian fold untuk semua model, satu metrik yang terverifikasi | Implementasi QWK, validasi, probabilitas ke label | metrik terverifikasi, 47× lebih cepat |
| 14 | III | Enam keluarga algoritma, dipilih berbeda, mendarat di titik yang sama | Spesifikasi model dan landasan literatur | enam sudut pandang, termasuk ordinal eksplisit |
| 15 | III | Kombinasi ditetapkan di muka, ambang dicari dua tahap | Stacking dan optimasi ambang | kombinasi ditetapkan a priori |
| 16 | III | 89,9% perbaikan datang dari aturan keputusan, bukan dari model | Keunggulan terbesar | +0,06269 dari satu keputusan |
| 17 | III | Kriteria yang benar bukan skor tertinggi, melainkan yang paling stabil | Studi ambang, split-half, overfit yang ditangkap | dipilih paling stabil, bukan skor tertinggi |
| 18 | IV | Demo · LifeScope mengubah jawaban survei menjadi daftar prioritas | **Demo di tengah**, setelah metodologi, sebelum diagnostik | model berjalan di peramban, tanpa server |
| 19 | V | QWK out-of-fold 0,48425. Satu sel memikul 35,8% seluruh penalti | Hasil, konfusi, penalti, per kelas | kelas langka benar-benar tertangkap |
| 20 | V | Tak ada subkelompok tertinggal; 0,484 berarti kesepakatan sedang | Subkelompok, importance, Landis & Koch | – |
| 21 | V | Plafonnya milik data, dan enam peringkat teratas tak terbedakan | Kurva belajar, ekstrapolasi, derau papan skor | plafon dikuantifikasi |
| 22 | V | Satu eksekusi menghasilkan model, submission, dan semua angka ini | Reproduksibilitas, kepatuhan aturan, artefak | rentang antar seed 0,00029 |
| 23 | VI | Apa yang belum bisa dilakukan model ini, dan bagaimana memperbaikinya | **Keterbatasan + pengembangan lanjut** | – |
| 24 | VI | Kesimpulan, rekomendasi, dan jalan menuju implementasi nyata | **Kesimpulan + implementasi + rekomendasi + etika** | – |
| 25 | VI | Di balik 4,7% itu ada 4.452 orang | Penutup kembali ke hook | – |
| 26 | Cadangan | Lampiran · 21 pendekatan yang diuji lalu ditolak | Tanya jawab | – |
| 27 | Cadangan | Daftar pustaka | Sumber | – |

**Busur emosi:** empati (2) → frustrasi "datanya ada tapi tak dipakai" (3) → tantangan (4) → janji (5) → bukti bertahap (6–17) → melihat sendiri (18) → kejujuran soal batas (19–23) → harapan dan aksi (24–25).

---

## 5. Lembar fakta terverifikasi

### 5.1 Konteks dunia nyata (hanya konteks, bukan data latih)
| Fakta | Sumber |
|---|---|
| ± 280 juta orang di dunia hidup dengan depresi, sekitar 5% orang dewasa | WHO (2023), fact sheet Depressive disorder |
| ± 703.000 kematian akibat bunuh diri per tahun | WHO (2021), Suicide worldwide in 2019 |
| Prevalensi depresi penduduk Indonesia ≥15 tahun 6,1%; hanya 9% penderita yang berobat | Kemenkes RI, Riskesdas 2018 |
| Kesejahteraan subjektif berkontribusi pada kesehatan dan umur panjang | Diener & Chan (2011) |
| Ketidakpuasan hidup terkait risiko bunuh diri dalam tindak lanjut 20 tahun | Koivumaa-Honkanen dkk. (2001) |
| Evaluasi hidup ukuran inti kesejahteraan nasional | OECD (2013) |
| Evaluasi hidup naik mengikuti logaritma pendapatan | Kahneman & Deaton (2010) |
| Sekitar separuh variasi kesejahteraan subjektif terkait faktor bawaan | Lykken & Tellegen (1996) |
| Kappa 0,41–0,60 = kesepakatan sedang | Landis & Koch (1977) |

### 5.2 Data
- `train_final.csv` 95.609 × 179 · `test_final.csv` 23.902 × 178 · `data_dictionary.csv` 187 × 3
- 176 fitur numerik, seluruhnya sudah kode numerik (tanpa encoding)
- Tahun survei 2021 sampai 2024 · id unik di uji 23.666 dari 23.902 (submission 23.666 baris)
- Duplikat penuh: 1.892 latih, 472 uji · data eksternal: 0 baris
- Target: 1 = 42.968 (44,94%) · 2 = 48.189 (50,40%) · 3 = 3.559 (3,72%) · 4 = 893 (0,93%) · kelas 3+4 = 4.452 (4,7%)

### 5.3 Metrik
- κ = 1 − Σ wᵢⱼOᵢⱼ / Σ wᵢⱼEᵢⱼ, wᵢⱼ = (i − j)² / 9
- Tebak semua kelas 2: akurasi 50,402%, QWK 0,00000, kelas 3/4 ditemukan 0
- Implementasi QWK sendiri: selisih maks vs sklearn 4,44 × 10⁻¹⁶ (200 uji acak), 43 µs vs 2.029 µs (47× lebih cepat)

### 5.4 EDA
| Temuan | Angka | Keputusan |
|---|---|---|
| Nilai kosong | 14,41% sel; 0 dari 176 kolom bersih; 25,4 per baris; flu_vaccine_year 53,85% latih / 54,28% uji | Tanpa imputasi |
| Kode 7/8/9 | 84 kolom biner; tertinggi insurance_has_deductible_plan1 8,12%; rata-rata target per general_health_status 1,333 / 1,493 / 1,718 / 1,922 / 2,291 | Dipertahankan |
| Prediktor terkuat (rentang rata-rata target) | general_health_status 0,9588; depression_frequency 0,8958; difficulty_self_care 0,6780; anxiety_frequency 0,5603; food_security_4cat 0,5381 | Tambah regresi Huber dan dekomposisi ordinal |
| Korelasi | tertinggi fitur ke target 0,361; median antar fitur 0,037; 17 pasangan > 0,9; 56 pasangan > 0,7; 14.667 pasangan | Seluruh 176 fitur dipertahankan |
| Stabilitas tahun | rata-rata target 2021 1,5914 · 2022 1,6105 · 2023 1,6153 · 2024 1,6070; pergerakan 0,0239 | Satu model semua periode |
| Domain (ρ maks) | kesehatan fisik 0,3614; mental 0,3225; disabilitas 0,2291; ekonomi & pangan 0,2186; demografi 0,1969; akses layanan 0,1806; tempat tinggal 0,1410; pekerjaan 0,1045 | Landasan analisis plafon |
| Rumah tangga | 61,3% baris uji punya anggota berlabel; P(y=1) naik 44,9% → 46,5% (+1,6pp); encoding OOF menurunkan QWK | household_id dibuang |
| Kolom id | Spearman 0,00595; rata-rata per 20 bin 1,5925–1,6251; marginal 1,6065 | id dibuang |

### 5.5 Ablasi fitur (CV 3-fold, 297 detik)
A fitur mentah 0,46577 · B + 13 komposit 0,46487 (−0,00090) · C kode 7/8/9 → NaN 0,46688 (+0,00111) → fitur mentah saja.
13 komposit: n_disease, n_difficulty, n_cost_barrier, n_mental, n_income_src, n_missing, sev_anxiety, sev_depression, sev_mental, sev_food, health_x_mental, poverty_x_health, bmi.

### 5.6 Validasi dan model
- StratifiedKFold(5, shuffle, random_state=42); seed model per fold 0–4; latih 76.487/76.488, validasi 19.121/19.122
- Total pelatihan 6 model × 5 fold: 52,2 menit

| Model | Konfigurasi | Landasan | QWK OOF | Akurasi |
|---|---|---|---|---|
| ord | 3 × LGBM biner P(y>k), 1.200 pohon, lr 0,03 | Frank & Hall 2001 | 0,48114 | 0,62820 |
| xgb | 1.200 pohon, lr 0,04, depth 8 | Chen & Guestrin 2016 | 0,48067 | 0,62518 |
| cat | 1.800 iterasi, lr 0,05, depth 8 | Prokhorenkova dkk. 2018 | 0,47982 | 0,62364 |
| reg | LGBM Huber, 1.500 pohon, lr 0,03 | Huber 1964 | 0,47918 | 0,62929 |
| lgb | 1.500 pohon, lr 0,028, 127 daun | Ke dkk. 2017 | 0,47847 | 0,63121 |
| mlp | fitur ternormalisasi kuantil | – | 0,44466 | 0,59741 |

Rentang lima pohon 0,00267; korelasi prediksi rata-rata antar pohon 0,974.

### 5.7 Stacking dan ambang
- Matriks meta 95.609 × 24. Kandidat: rata-rata lima pohon 0,48517 · logreg 0,48398 · rata-rata enam 0,48361 · LGBM meta 0,48307. Pilihan a priori = rata-rata lima pohon (juga tertinggi). Gain vs model dasar terbaik +0,00403.
- Ambang: grid kuantil 45×32×26 → 0,48446; pencarian koordinat → 0,48517 (48 detik); t = 1,5543 / 2,0027 / 2,3936
- argmax 0,42460 (akurasi 0,66943, prediksi kelas 3+4 0,96%) vs ambang 0,48517 (akurasi 0,63258, 8,58%) → +0,06057
- Distribusi label: aktual 3,72% + 0,93% · argmax 0,94% + 0,02% · ambang 7,00% + 1,58%

### 5.8 Studi lima strategi ambang (23,7 menit) dan split-half (19 menit)
| Strategi | QWK OOF | in-sample | held-out | selisih |
|---|---|---|---|---|
| a. titik tunggal | 0,48517 | 0,48688 | 0,48083 | 0,00606 |
| **b. rata-rata bootstrap (final)** | 0,48425 | 0,48625 | **0,48106** | 0,00519 |
| c. rata-rata subsample 80% | 0,48419 | 0,48654 | 0,48100 | 0,00554 |
| d. cocok distribusi | 0,47413 | 0,47650 | 0,47206 | 0,00444 |
| e. objektif dihaluskan | 0,48435 | – | – | – |

- SD ambang antar 25 bootstrap: t₁ 0,0108 · t₂ 0,0134 · t₃ 0,0392
- Ambang final: 1,5513 / 2,0051 / 2,3942
- Ambang per segmen: in-sample naik, held-out turun monoton → ditolak
- 20 konfigurasi wajar: korelasi QWK OOF ke kinerja uji ≈ 0,08; held-out ≈ 0,16; rentang 0,003

### 5.9 Hasil akhir
- **QWK OOF 0,48425** · akurasi 0,63305
- Matriks konfusi (baris aktual, kolom prediksi): [30.414, 11.918, 576, 60] · [14.757, 28.477, 4.389, 566] · [157, 1.412, 1.369, 621] · [140, 226, 262, 265]
- Penalti (%): [0; 28,89; 5,58; 1,31] · [35,77; 0; 10,64; 5,49] · [1,52; 3,42; 0; 1,51] · [3,05; 2,19; 0,64; 0]
- Kebingungan kelas 1–2 = 64,7% penalti; galat berjarak tiga = 4,36%
- Per kelas (presisi/recall/F1): 1 = 0,6689/0,7078/0,6878 · 2 = 0,6775/0,5909/0,6313 · 3 = 0,2076/0,3847/0,2696 · 4 = 0,1753/0,2968/0,2204
- Prediksi kelas 3: 6.596 (aktual 3.559) · kelas 4: 1.512 (aktual 893) · kelas 4 tertangkap benar 265
- Kalibrasi: diagram reliabilitas dekat diagonal, Platt/isotonik tidak dipakai

### 5.10 Diagnostik
- Jenis kelamin: L 0,4839 (40.381) · P 0,4836 (47.753)
- Usia: 18–29 0,4502 · 30–44 0,4750 · 45–59 0,4966 · 60–74 0,4982 · 75+ 0,4736
- Pendidikan (10 tingkat): 0,3968 sampai 0,4909; terendah tingkat 2 (1.438 orang)
- Permutation importance (acuan subsampel 0,83695): general_health_status 0,09256 · depression_frequency 0,03715 · age 0,03093 · survey_weight 0,03018 · pseudo_stratum 0,02821 · income_to_poverty_ratio 0,02659 · weight_pounds 0,02535 · pseudo_psu 0,02494 · height_inches 0,01654 · interview_month 0,01516

### 5.11 Plafon dan derau
- Kurva belajar: 11.473 → 0,43883 · 23.902 → 0,46162 · 43.024 → 0,46391 · 66.926 → 0,46911 · 95.609 → 0,47669
- QWK = 0,29209 + 0,01613 · ln(n), R² 0,9143, +0,01118 per penggandaan data
- Ekstrapolasi: 0,49 → 213.000 baris (2×) · 0,50 → 396.000 (4×) · 0,55 → 8.790.000 (92×) · 0,60 → 195.000.000 (2.041×, ± 1.950 tahun survei)
- Derau (bootstrap 400×): sd 0,0050 pada 23.666 baris; sd 0,0105 pada 7.100 baris; interval 95% 0,4625–0,5027; selisih peringkat 4–9 = 0,0075 = 0,7σ

### 5.12 Reproduksibilitas dan kepatuhan
- SEED 42, FOLD_SEEDS 0–4, PYTHONHASHSEED; Python 3.11.9, LightGBM 4.7.0, XGBoost 3.2.0, CatBoost 1.2.10, scikit-learn 1.6.1
- model_warkab.joblib 84,0 MB (model, meta, ambang, urutan 176 fitur), muat ulang lulus
- 7 uji integritas lulus; total eksekusi 135,1 menit
- Seed meta 7 / 202 / 999 → 0,48384 / 0,48413 / 0,48390; rentang 0,00029, sd 0,00015
- Selisih multi-thread sekitar 0,001 QWK
- Pasal: B.1.a hanya data resmi · B.1.c ambang dan model dari OOF latih · C seed, model tersimpan, output terlihat · D submission dari notebook yang sama

### 5.13 Produk LifeScope
- URL: `lifescope-mikaeladikara-5555s-projects.vercel.app` · repo: `github.com/MikaelAdikara/DataQuest-Warkab`
- Berjalan penuh di peramban, tanpa server
- Surrogate 440 pohon, 17 fitur, QWK 0,46752 (96,5% pipeline penuh); +0,06931 dari aturan keputusan
- Tampilan: Ikhtisar, Skrining, Kohort, Prioritas, Ambang, Cara kerja, Model
- Fitur yang benar-benar ada: grid 200 kotak proporsi kelas, skrining satu responden dengan gauge E[y], penilaian kohort contoh 800 baris, tabel prioritas terurut dan ekspor CSV, histogram dengan ambang t₃ yang bisa digeser, tombol (i) berisi rumus dan definisi

### 5.14 Eksperimen yang ditolak
Di notebook: fitur komposit, kode 7/8/9 → NaN, target encoding rumah tangga, id sebagai fitur, argmax, MLP sebagai model utama, ambang titik tunggal, kalibrasi Platt/isotonik, indikator tahun, seleksi fitur agresif.
Di luar notebook: hyperparameter acak 28 konfigurasi (0,465–0,467); rekonstruksi 3.030.768 sel hilang (0,4755–0,4806, datar di pemulihan 56/79/100%, 78 kolom pulih >95%); pembobotan sampel 4 tingkat (0,458–0,469, turun monoton); self-training (0,4735); survey_weight sebagai bobot (0,4726); bagging 9 model (0,4820); blending 25 kandidat (0,4834–0,4839); vektor nilai kelas terlatih (0,4835); aturan linear simpleks (0,4744); TabPFN v2 (tidak selesai, 85 menit per bag); ambang per segmen (overfit).

---

## 6. Keunggulan kompetitif (pakai kalimat ini, bukan klaim tentang tim lain)

| Aspek | Pendekatan standar | Pipeline kami | Bukti |
|---|---|---|---|
| Aturan keputusan | argmax, mengejar akurasi | Nilai harapan + 3 ambang ordinal | +0,06269 QWK pada model yang sama |
| Dasar keputusan | Fitur ditambah tanpa uji | 10 temuan EDA → 10 keputusan, lewat ablasi | 13 komposit dibuang (−0,00090) |
| Kebocoran | Sinyal menggiurkan langsung dipakai | Diukur dulu, lalu ditolak | Lift rumah tangga hanya +1,6pp |
| Pemilihan konfigurasi | Skor validasi tertinggi | Paling stabil lewat split-half | Held-out 0,48106 vs 0,48083 |
| Kapan berhenti | Terus tuning | Plafon dikuantifikasi | R² 0,9143; QWK 0,60 butuh 195 juta baris |
| Siap dipakai | Berhenti di notebook | Reproduksibel dan ada produk | Rentang seed 0,00029; demo di peramban |

Pesan kunci: *di rentang 0,7σ, keunggulan bukan skor, melainkan kepercayaan: stabil di data baru, bisa diulang, bisa dipakai.*

---

## 7. Isi dua slide penutup

**Keterbatasan → pengembangan lanjut**
| Keterbatasan | Dampak | Pengembangan |
|---|---|---|
| Faktor psikososial tak terekam | Plafon QWK ±0,48 | Tambah 3–5 butir kepribadian dan dukungan sosial |
| Kelas 4 hanya 893 sampel | t₃ paling goyah (sd 0,0392) | Label lintas gelombang; ambang peka biaya |
| Satu populasi survei | Belum valid untuk Indonesia | Validasi eksternal pada survei nasional |
| Kelas 1–2 sebagian subjektif | 64,7% penalti | Fokus deteksi kelas 3 dan 4 |
| Distribusi bisa bergeser | Kalibrasi menurun | Pantau drift, kalibrasi ulang per gelombang |
| Belum ada penjelasan per individu | Sulit dijelaskan petugas | SHAP per orang, audit keadilan subkelompok |
| Boosting multi-thread | Selisih ±0,001 | Mode single-thread untuk audit |

**Kesimpulan · Implementasi · Rekomendasi**
- Kesimpulan: 0,48425 (sedang, dekat plafon) · 89,9% perbaikan dari aturan keputusan · rentang seed 0,00029, sudah menjadi produk
- Siklus implementasi: survei rutin → skor E[y] → daftar prioritas per wilayah → tindak lanjut konseling/rujukan → label kunjungan kembali → kalibrasi ulang ambang
- Etika: penapisan populasi, bukan diagnosis; persetujuan responden; data anonim; keputusan akhir oleh tenaga kesehatan
- Rekomendasi: pakai untuk populasi · mulai dari data yang ada · atur t₃ sesuai kapasitas layanan · tambah variabel, bukan model

---

## 8. Sistem desain

- Rasio 16:9 (13,333 × 7,5 inci), margin 0,7 inci
- Warna: tinta `#16191D`, tinta sekunder `#3A4048`, redup `#6E747C`, garis `#DCD8D1`, kertas `#FFFFFF`, tint `#F4F1EC` / `#ECE7DF`, aksen bata `#A8442A`, hijau tua `#2F6B5F`
- Skala ordinal kelas 1→4: `#2F6B5F` `#8FB0A4` `#D8A25E` `#A8442A`
- Huruf: judul **Cambria** tebal 24 pt; isi **Calibri** 10–13 pt; angka besar Cambria 20–40 pt
- Slide gelap hanya untuk sampul, hook, dan penutup
- Kartu: sudut sedikit membulat, garis tipis penuh (tanpa garis aksen di satu sisi)
- Badge keunggulan: pil hijau tua kanan atas, teks putih kapital "KEUNGGULAN · ..."
- Bar navigasi enam babak di bawah, babak aktif berwarna bata
- Tanpa gradien, tanpa ikon dekoratif berlebihan, tanpa garis di bawah judul
- Grafik: batang horizontal, matriks 4×4 berwarna, garis kurva belajar; label desimal pakai koma

---

## 9. Kesalahan yang harus dihindari

- Menulis "argmax menangkap kelas 4 sebanyak 5 kali" (angka tidak ada di notebook)
- Menyebut rata-rata lima pohon "bukan yang tertinggi di OOF" (kalimat notebook bagian 8 ini salah; faktanya tertinggi, 0,48517)
- Memakai angka model dasar sebelum dihaluskan (0,48062, 0,48015, dst.); pakai tabel 5.6
- Mengklaim aplikasi bisa unggah CSV (yang ada: kohort contoh 800 baris dan ekspor CSV)
- Menyebut model mendiagnosis depresi atau risiko bunuh diri
- Mengklaim sumber WHO/Riskesdas dipakai sebagai data latih

---

## 10. Contoh prompt pemakaian

> Pakai context ini. Tulis ulang slide 3 agar lebih emosional tanpa menambah angka baru, maksimal 50 kata tampil, sertakan catatan pembicara 3 kalimat.

> Pakai context ini. Buat versi 15 slide untuk pitching 8 menit, gabungkan slide EDA 8–10 menjadi satu, pertahankan demo di tengah dan dua slide penutup.

> Pakai context ini. Beri 3 alternatif judul untuk slide 16 yang menonjolkan keunggulan kompetitif, masing-masing di bawah 65 karakter.
