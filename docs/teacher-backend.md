# Persediaan Teacher Editor dalam talian

## Keperluan

- Pelayan Node.js 24 dengan HTTPS dan volum cakera kekal. GitHub Pages kekal sebagai hosting permainan.
- Akses pentadbir repository GitHub.
- GitHub OAuth App milik sekolah/pemilik projek. Jangan gunakan OAuth secret dalam frontend.

Backend ini menggunakan satu instance Node dan SQLite. Letakkan fail data pada volum kekal. Deploy berbilang instance memerlukan pangkalan data serta kunci penerbitan yang dikongsi; ia bukan konfigurasi yang diuji di sini.

## 1. Cipta OAuth App

Di GitHub: **Settings → Developer settings → OAuth Apps → New OAuth App**.

- Homepage URL: `https://khiewxinru-ui.github.io/khiewxinru-ui-misi-rukun-negara/`
- Authorization callback URL: `https://URL-BACKEND-ANDA/auth/callback`

Simpan Client ID dan Client Secret terus dalam pengurus rahsia atau environment pelayan. Jangan hantar secret dalam chat atau commit ke repository. OAuth meminta skop `public_repo` untuk mengemas kini repository awam. Backend mengehadkan penerbitan kepada repository yang dikonfigurasi dan akaun guru yang dibenarkan.

## 2. Konfigurasi pelayan

Salin nilai berkaitan daripada `.env.example` ke `.env.server` pada pelayan. Fail ini diabaikan Git.

```dotenv
PORT=8787
APP_URL=https://khiewxinru-ui.github.io/khiewxinru-ui-misi-rukun-negara/
PUBLIC_API_URL=https://URL-BACKEND-ANDA
GITHUB_CLIENT_ID=ISI-DALAM-ENV-PELAYAN
GITHUB_CLIENT_SECRET=ISI-DALAM-ENV-PELAYAN
GITHUB_OWNER=khiewxinru-ui
GITHUB_REPO=khiewxinru-ui-misi-rukun-negara
GITHUB_BRANCH=main
TEACHER_LOGINS=khiewxinru-ui
SESSION_ENCRYPTION_KEY=KUNCI-HEX-64-AKSARA
DATA_DIR=/volum-kekal/misi-editor
```

Jana kunci dengan `openssl rand -hex 32` dan simpan terus sebagai secret pelayan. Simpan salinan kunci secara selamat; perubahan kunci membatalkan sesi yang menyimpan token terenkripsi. Jangan guna nilai contoh sebagai kunci sebenar.

Untuk ujian setempat, gunakan `http://localhost:5173/`, `http://localhost:8787`, dan callback localhost pada OAuth App pembangunan yang berasingan.

```sh
npm ci
npm run server
```

Gunakan pengurus proses pelayan supaya servis dimulakan semula apabila gagal. Letakkan di belakang reverse proxy HTTPS. Semak `GET /health`; `configured: true` menunjukkan tetapan asas tersedia, bukan bukti OAuth berjaya.

## 3. Hubungkan frontend

Di repository: **Settings → Secrets and variables → Actions → Variables**, tambah:

```text
EDITOR_API_URL=https://URL-BACKEND-ANDA
```

Jalankan semula workflow GitHub Pages. Sebagai alternatif, guru boleh memasukkan URL API dalam Ruang Guru; hanya URL itu disimpan dalam pelayar.

Backend menerima CORS daripada origin `APP_URL` sahaja, memerlukan CSRF pada semua mutasi, dan menggunakan cookie sesi HttpOnly/Secure. Polisi sekatan cookie pihak ketiga sesetengah pelayar boleh menghalang sesi antara domain GitHub Pages dan API. Untuk penggunaan sekolah yang stabil, gunakan domain tersuai permainan dan API di bawah domain tapak yang sama, atau sahkan konfigurasi cookie pada pelayar sasaran sebelum digunakan.

## 4. Aliran guru

1. Buka `#guru`, log masuk dengan GitHub, dan benarkan OAuth App.
2. Backend menyemak senarai `TEACHER_LOGINS` serta kebenaran `write`/`maintain`/`admin` pada repository.
3. Sunting kandungan, muat naik gambar/audio dan simpan draf bersama.
4. Lihat pratonton 3D dan uji cabaran yang diubah.
5. Klik **Terbitkan**, semak maklumat pengesahan, kemudian **Simpan dan terbitkan**.
6. Editor menunjukkan bahawa commit dihantar. Ia hanya menunjukkan penerbitan berjaya apabila workflow GitHub Pages bagi commit itu melaporkan kejayaan.
7. Buka URL permainan yang sama dalam sesi murid baharu / refresh untuk mengesahkan perubahan.

Fail gambar diterima: PNG, JPEG dan WebP. Audio: WAV, MP3 dan OGG. Had 6 MB setiap fail; maksimum 100 fail sementara. Fail sementara berusia lebih tujuh hari dibersihkan ketika backend bermula. Aset yang telah diterbitkan berada dalam GitHub dan tidak bergantung pada storan sementara backend.

## 5. Draf, konflik dan pemulihan

- Kandungan yang diterbitkan tidak disimpan dalam localStorage guru. Draf bersama disimpan dalam SQLite dan versi terbit disimpan dalam GitHub.
- Setiap simpanan memerlukan revision terkini. Perubahan daripada dua tab/guru tidak ditindih secara senyap.
- Penerbitan membandingkan versi kandungan asal, kemudian mengemas kini ref branch tanpa force push. Konflik memerlukan semakan semula.
- **Versi terdahulu → Pulihkan draf** memulihkan salinan kandungan. Semak dan terbitkan secara berasingan.
- Untuk konflik, eksport draf anda dahulu, buka semula draf terkini dan gabungkan perubahan dengan teliti. Jangan force push.
- Sandarkan direktori data dan konfigurasi rahsia menggunakan mekanisme pelayan yang sesuai. Jangan commit pangkalan data sesi/draf.

## Ujian penerimaan yang perlu dibuat selepas konfigurasi

- [ ] Guru yang dibenarkan boleh log masuk menggunakan OAuth sebenar.
- [ ] Akaun lain ditolak dan tidak boleh menerbitkan.
- [ ] Ubah teks dan audio, simpan draf, kemudian semak pratonton.
- [ ] Terbitkan; pastikan workflow GitHub Actions bagi commit tersebut berjaya.
- [ ] Murid melihat perubahan pada URL yang sama selepas refresh.
- [ ] Uji konflik daripada dua tab serta pemulihan versi.
- [ ] Uji polisi cookie pada browser sebenar sekolah.

Ujian API automatik dalam repository meliputi kawalan akses, CSRF, draf, fail, konflik dan penerbitan dengan penyedia GitHub tiruan. Ia tidak menggantikan senarai penerimaan produksi ini.
