# Laporan pengujian

Keputusan akan dikemas kini berdasarkan ujian sebenar, bukan berdasarkan kewujudan butang atau halaman.

## Disahkan

- TypeScript dan binaan produksi Vite berjaya.
- 43 laluan aset kandungan/dunia diperiksa wujud sebelum build.
- 8 ujian kandungan dan API lulus: penilaian jawapan, tiga sebab yang tepat, skema kandungan, enkripsi sesi, kawalan akses, CSRF, draf, fail, konflik, penerbitan atomik dan pemulihan.
- Browser Chromium: telefon 390 × 844 tanpa overflow mendatar dan butang pergerakan berfungsi.
- Browser Chromium: ralat model 404 dipaparkan dan Retry berjaya memuatkan semula dunia.
- Browser Chromium: editor tempatan boleh menyimpan, memuatkan semula dan melihat pratonton 3D; penerbitan global dinyahaktifkan tanpa sesi backend.

## Sedang disahkan

- Perjalanan lengkap 16 aktiviti melalui kawalan pergerakan sebenar, ketiga-tiga misi, refleksi dan pemulihan selepas refresh.
- Deployment GitHub Pages pada URL sebenar.

## Belum boleh disahkan tanpa konfigurasi pemilik

- OAuth GitHub sebenar untuk Teacher Editor, backend HTTPS kekal dan penerbitan melalui akaun guru sebenar.
- Prestasi pada komputer dan telefon fizikal sasaran sekolah.

Ujian API menggunakan penyedia GitHub tiruan untuk memeriksa aliran simpan/publish secara selamat. Ini tidak membuktikan login OAuth produksi tersedia.
