# Script Pitching · Tim Warkab · DataQuest 5.0

**Durasi target:** 13 sampai 15 menit untuk slide 1–25, lalu tanya jawab. Slide 26–27 cadangan.
**Prinsip:** ceritakan proyek yang menolong orang, bukan tugas lomba. Setiap klaim keunggulan harus langsung ditunjuk buktinya di layar.
**Kode waktu:** `[0:30]` adalah durasi yang disarankan per slide.

---

## BABAK I · Masalah dan data (± 4 menit)

### Slide 1 · Sampul `[0:15]`
> Selamat pagi, Bapak dan Ibu juri. Kami Tim Warkab. Proyek kami namanya *Membaca Skala, Bukan Menebak Kelas*: cara menemukan lebih awal siapa yang paling perlu ditolong, dari survei kesehatan yang sudah ada.

### Slide 2 · Hook `[0:45]`
*(Jeda dua detik setelah membaca judul.)*
> Orang yang tidak puas dengan hidupnya jarang terlihat, sampai terlambat.
>
> Menurut WHO, sekitar 280 juta orang hidup dengan depresi, dan sekitar 703 ribu orang meninggal karena bunuh diri setiap tahun. Di Indonesia, Riskesdas 2018 mencatat prevalensi depresi 6,1 persen, tapi hanya 9 persen dari mereka yang berobat.
>
> Penelitian menunjukkan kepuasan hidup yang rendah memprediksi umur lebih pendek dan risiko bunuh diri hingga 20 tahun kemudian. Jadi masalahnya bukan tidak bisa dideteksi. Masalahnya, tidak ada yang membacanya lebih awal.
>
> Proyek kami dimulai dari satu pertanyaan: bisakah kita menemukan mereka lebih awal, dari data yang sudah rutin dikumpulkan?

### Slide 3 · Celah dunia nyata `[0:45]`
> Datanya sebenarnya sudah ada. Survei kesehatan rutin menanyakan kepuasan hidup. Tapi hasilnya berakhir sebagai satu angka: 4,7 persen responden tidak puas. Itu 4.452 orang, dan tidak ada satu nama pun yang bisa dihubungi dari sebuah persentase.
>
> Tujuan proyek kami adalah mengubah jawaban survei itu menjadi daftar prioritas: siapa yang paling mungkin tidak puas, siapa yang didahulukan.
>
> Yang diuntungkan ada tiga: layanan kesehatan primer untuk memprioritaskan rujukan konseling, program kesejahteraan karyawan dan asuransi untuk menjangkau lebih awal, dan pembuat kebijakan untuk memetakan kesejahteraan per wilayah dengan instrumen yang murah.

### Slide 4 · Kenapa sulit `[0:40]`
> Kenapa ini tidak mudah? Coba model paling malas: tebak semua orang "baik-baik saja". Akurasinya 50,4 persen. Kedengarannya setengah benar. Tapi dari 4.452 orang yang tidak puas, ia tidak menemukan satu pun.
>
> Karena itu kami tidak memakai akurasi. Kami memakai Quadratic Weighted Kappa, yang menilai model malas tadi tepat nol. Metrik ini menghukum salah menempatkan orang yang sangat tidak puas sebagai sangat puas sembilan kali lebih berat. Persis seperti biaya skrining yang meloloskan kasus berat.

### Slide 5 · Keunggulan pipeline `[0:40]`
> Sebelum masuk teknis, ini enam hal yang membedakan pipeline kami dari pendekatan standar. Setiap baris punya bukti angka, dan setiap bukti akan muncul lagi dengan badge hijau "Keunggulan" di pojok kanan atas slide.
>
> Yang paling penting ada di kotak bawah: enam peringkat teratas papan skor hanya terpaut 0,7 simpangan baku. Di rentang itu, yang membedakan bukan skor, tapi apakah hasilnya stabil, bisa diulang, dan bisa dipakai.

### Slide 6 · Metrik dan keputusan ordinal `[0:35]`
> Karena penaltinya kuadratik, keputusan optimalnya adalah nilai harapan, bukan kelas dengan probabilitas tertinggi. Kami menghitung E[y], satu angka kontinu per orang, lalu memotongnya dengan tiga ambang. Ketiga ambang ini diestimasi hanya dari data latih. Data uji tidak pernah menyentuhnya.

### Slide 7 · Pohon akar masalah `[0:25]`
> Kesulitannya bisa diringkas jadi empat akar: metrik menghukum jarak, kelas yang dicari sangat langka, pilihan konfigurasi banyak tapi selisihnya tipis, dan penentu utamanya tidak terekam di survei. Sisa presentasi membuktikan kolom jawaban di tengah.

---

## BABAK II · EDA (± 2 menit 15 detik)

### Slide 8 · EDA 1 `[0:35]`
> Sebelum melatih satu model pun, kami membaca datanya. Tiga temuan pertama: target sangat timpang, jadi kami mengoptimalkan ambang. Setiap kolom punya nilai kosong dengan pola yang sama di data latih dan uji, jadi kami tidak mengimputasi. Kode 7, 8, 9 ternyata membawa sinyal, jadi kami pertahankan.

### Slide 9 · EDA 2 `[0:30]`
> Prediktor terkuat, seperti status kesehatan umum dan frekuensi depresi, bersifat monoton. Itu alasan kami menambahkan regresi dan dekomposisi ordinal. Sinyalnya tersebar tipis, korelasi tertinggi hanya 0,361, jadi tidak ada fitur yang dibuang. Dan distribusinya stabil empat tahun, jadi satu model cukup.

### Slide 10 · EDA 3 `[0:40]` · *badge keunggulan*
> Temuan paling penting untuk dunia nyata: domain terkuat adalah kesehatan fisik dan mental, tapi kepribadian dan hubungan sosial, yang menurut literatur penentu besar kepuasan hidup, tidak ada di survei ini.
>
> Kami juga menemukan kebocoran yang menggoda: label anggota rumah tangga lain. Kami ukur dulu, liftnya hanya 1,6 poin, dan justru menurunkan skor. Kami buang sebelum melihat papan skor.

### Slide 11 · Rantai EDA ke desain `[0:30]`
> Ini tulang punggung metodologi kami. Sepuluh temuan, sepuluh keputusan. Tidak ada keputusan yang diambil karena kebiasaan.

---

## BABAK III · Pipeline (± 3 menit 30 detik)

### Slide 12 · Preprocessing dan ablasi `[0:30]` · *badge*
> Tujuh keputusan preprocessing, masing-masing dengan dasar. Kami juga membangun 13 fitur komposit, lalu mengujinya lewat ablasi. Selisihnya di bawah 0,0012, setara derau. Jadi kami buang. Fitur hanya dipakai kalau terbukti membantu.

### Slide 13 · Kerangka `[0:30]` · *badge*
> Kami menulis ulang metrik QWK sendiri, 47 kali lebih cepat, dan membuktikannya identik dengan scikit-learn. Satu pembagian fold dipakai semua model, syarat supaya stacking sah dan estimasi tetap tak bias.

### Slide 14 · Enam model `[0:35]` · *badge*
> Enam keluarga algoritma, dipilih agar berbeda cara berpikirnya, termasuk dekomposisi ordinal yang memecah masalah menjadi tiga pertanyaan: apakah skor orang ini di atas 1, di atas 2, di atas 3.
>
> Hasilnya, lima model pohon hanya terpaut 0,00267. Ketika cara berpikir yang berbeda mendarat di titik yang sama, dindingnya milik data.

### Slide 15 · Stacking dan ambang `[0:30]` · *badge*
> Kombinasinya kami tetapkan sebelum melihat hasil: rata-rata lima model pohon, tanpa meta-learner yang bisa menempel pada derau. Setelah dihitung, pilihan ini juga yang tertinggi. Ambangnya dicari dua tahap: grid kuantil, lalu pencarian koordinat.

### Slide 16 · Keputusan terbesar `[0:45]` · *badge*
> Ini keunggulan terbesar kami. Pada model yang sama persis, mengganti argmax dengan nilai harapan dan ambang menaikkan QWK 0,06. Akurasinya justru turun, dan itu benar.
>
> Lihat batang di kiri: argmax hampir tidak pernah menebak kelas 3 dan 4, hanya 0,96 persen. Dengan ambang, 8,58 persen. Artinya orang yang tidak puas benar-benar ditemukan.
>
> Dari dekomposisi baseline, 89,9 persen perbaikan kami datang dari satu keputusan ini, bukan dari model yang lebih besar.

### Slide 17 · Disiplin estimasi `[0:40]` · *badge*
> Tiga angka ambang ditentukan dari data yang sama yang dipakai menilainya. Itu rawan. Jadi kami uji lima strategi dengan split-half: pasang di separuh data, nilai di separuh lain. Titik tunggal menang di dalam sampel tapi kalah di luar. Kami pilih rata-rata bootstrap, yang paling stabil.
>
> Kami bahkan menangkap ide kami sendiri yang overfit: ambang per segmen. Skornya naik di dalam sampel, turun di luar. Kami tolak.

---

## BABAK IV · Demo (± 1 menit 30 detik)

### Slide 18 · Demo LifeScope `[1:30]` · *badge*
> Sekarang metodologi tadi kita lihat bekerja.

**Langkah demo** (buka `lifescope-mikaeladikara-5555s-projects.vercel.app`):
1. **Ikhtisar** `[0:15]`: tunjuk grid 200 kotak. "Setiap kotak satu responden. Yang berwarna hangat adalah 4,7 persen yang kita cari."
2. **Skrining** `[0:25]`: isi atau pilih contoh responden. "Satu orang, 17 pertanyaan, keluar E[y] dan faktor pendorong utamanya."
3. **Kohort** `[0:20]`: klik *Nilai satu kohort*. "800 orang dinilai langsung di peramban, tanpa server, lalu diurutkan jadi daftar prioritas yang bisa diekspor."
4. **Ambang** `[0:20]`: geser t₃. "Kalau konselornya sedikit, ambang dinaikkan. Kalau kapasitasnya besar, diturunkan. Jumlah orang tertangkap langsung berubah. Ambang bukan konsep abstrak, ini tuas kebijakan."
5. **Tombol (i)** `[0:10]`: klik satu. "Setiap istilah punya rumus dan definisi, siap untuk pertanyaan."

> Model di peramban adalah versi ringkas 440 pohon dengan 17 fitur, mencapai 96,5 persen dari QWK pipeline penuh.

*Cadangan jika internet gagal:* tunjuk screenshot di slide dan jelaskan alur yang sama.

---

## BABAK V · Hasil dan plafon (± 2 menit 30 detik)

### Slide 19 · Hasil `[0:40]` · *badge*
> QWK out-of-fold kami 0,48425. Peta penalti di tengah menunjukkan 64,7 persen penalti datang dari kebingungan "Sangat puas" dan "Puas", dua kelas yang memang berdekatan dan sebagian subjektif. Galat terjauh, yang paling mahal, tinggal 4,36 persen. Dan kelas 4 tertangkap benar 265 dari 893 orang.

### Slide 20 · Diagnostik `[0:35]`
> Model tidak meninggalkan kelompok mana pun: selisih laki-laki dan perempuan hanya 0,0003. Fitur paling berpengaruh sejalan dengan literatur, bukan artefak. Pada skala Landis dan Koch, 0,484 adalah kesepakatan sedang, dan itu klaim jujur kami.

### Slide 21 · Plafon `[0:40]` · *badge*
> Apakah angka ini bisa dinaikkan? Kami latih ulang pada lima ukuran data. Kurvanya logaritmik dengan R kuadrat 0,91. Untuk mencapai QWK 0,60, dibutuhkan 195 juta baris, sekitar 1.950 tahun survei. Plafon ini milik data, bukan kemampuan kami.
>
> Dan papan skor sendiri punya derau: enam peringkat teratas hanya terpaut 0,7 simpangan baku.

### Slide 22 · Reproduksibilitas `[0:30]` · *badge*
> Satu eksekusi menghasilkan model, submission, dan semua angka ini. Seed dikunci, tujuh uji integritas lulus, dan rentang antar seed hanya 0,00029. Semua artefak bisa diperiksa juri sekarang.

---

## BABAK VI · Dampak (± 2 menit)

### Slide 23 · Keterbatasan dan pengembangan `[0:45]`
> Kami sebut keterbatasannya sebelum ditanya. Yang terbesar: faktor psikososial tidak terekam. Perbaikannya bukan algoritma yang lebih rumit, tapi menambah tiga sampai lima pertanyaan tentang kepribadian dan dukungan sosial.
>
> Model ini juga belum divalidasi untuk populasi Indonesia. Syaratnya jelas: validasi eksternal pada survei kesehatan nasional sebelum dipakai. Kami juga merencanakan pemantauan drift, penjelasan per individu, dan audit keadilan.

### Slide 24 · Kesimpulan, rekomendasi, implementasi `[0:50]`
> Kesimpulannya: QWK 0,484 dekat plafon informasi, 89,9 persen perbaikan dari aturan keputusan, dan hasilnya stabil serta sudah menjadi produk.
>
> Implementasinya berupa siklus: survei rutin, skor tiap responden, daftar prioritas per wilayah, tindak lanjut konseling atau rujukan, label hasil kunjungan kembali ke sistem, lalu ambang dikalibrasi ulang. Model makin baik tanpa survei tambahan.
>
> Syarat etisnya: ini penapisan populasi, bukan diagnosis. Butuh persetujuan responden, data anonim, dan keputusan akhir tetap di tangan tenaga kesehatan.
>
> Rekomendasi kami: pakai untuk populasi, mulai dari data yang sudah ada, atur ambang sesuai kapasitas layanan, dan tambah variabel, bukan tambah model.

### Slide 25 · Penutup `[0:20]`
> Di balik 4,7 persen itu ada 4.452 orang. Kami membangun cara menemukan mereka lebih awal. Terima kasih, kami siap menjawab pertanyaan.

---

## Bank tanya jawab

| Pertanyaan yang mungkin | Jawaban singkat | Slide |
|---|---|---|
| Kenapa akurasi turun tapi dianggap lebih baik? | QWK menghukum jarak. argmax hampir tidak menebak kelas 3 dan 4 (0,96%), sehingga orang yang paling butuh bantuan menjadi galat berbiaya 9. | 4, 16 |
| Kenapa tidak pakai deep learning? | MLP sudah diuji: QWK 0,44466, di bawah semua model pohon. Kurva belajar juga menunjukkan batasnya ada di informasi, bukan kapasitas model. | 14, 21 |
| Kenapa tidak imputasi nilai kosong? | Pola kosong latih dan uji identik, boosting menangani NaN sendiri. Kami juga merekonstruksi 3.030.768 sel dan QWK tetap datar. | 8, 26 |
| Bukankah household_id bocoran yang bagus? | Diukur: lift hanya +1,6 poin, dan encoding out-of-fold lengkap justru menurunkan QWK. | 10 |
| Bagaimana memastikan tidak overfit ke papan skor? | Semua ambang dan pilihan model dari OOF latih. Strategi dipilih lewat split-half. Tidak ada probing papan skor (pasal B.1.c). | 17 |
| Kenapa bukan meta-learner? | Model dasar berkorelasi 0,974; meta-learner menambah parameter tanpa informasi. Rata-rata lima pohon juga tertinggi di OOF (0,48517). | 15 |
| Apakah 0,484 bagus? | Kesepakatan sedang (Landis & Koch). Dekat plafon: 0,60 butuh 195 juta baris. | 20, 21 |
| Bisa dipakai di Indonesia? | Belum langsung. Butuh validasi eksternal pada survei nasional, dan kalibrasi ulang ambang. Kami menyebutnya sebagai syarat. | 23 |
| Etis tidak memprediksi kondisi mental orang? | Ini penapisan populasi, bukan diagnosis. Persetujuan, anonimisasi, dan keputusan akhir oleh tenaga kesehatan. | 24 |
| Kenapa ambang t₃ paling tidak stabil? | Kelas 4 hanya 893 sampel; sd bootstrap t₃ 0,0392, hampir 4 kali t₁. | 17 |
| Apakah hasil bisa diulang? | Seed dikunci, rentang antar tiga seed 0,00029, selisih multi-thread sekitar 0,001. | 22 |
| Kenapa survey_weight muncul di importance? | Struktur sampling membawa informasi geografis dan demografis tidak langsung. Memakainya sebagai bobot latih diuji dan tidak membantu (0,4726). | 20, 26 |
| Bagaimana model di peramban bisa akurat? | Surrogate 440 pohon, 17 fitur, QWK 0,46752 (96,5% pipeline penuh), memakai aturan keputusan yang sama. | 18 |
| Apa saja yang sudah dicoba dan gagal? | 21 pendekatan, lengkap dengan angka. | 26 |
| Apa kontribusi terbesar proyek ini? | Mengubah persentase menjadi daftar prioritas, dengan keputusan ordinal yang menyumbang 89,9% perbaikan. | 3, 16 |
