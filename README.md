# Misi Rukun Negara

**Pengembaraan Merentas Masa** — permainan penerokaan orang pertama untuk Sejarah Tahun 6, Unit 3, SP 10.3.1–10.3.3.

Repository: https://github.com/khiewxinru-ui/khiewxinru-ui-misi-rukun-negara

URL GitHub Pages: https://khiewxinru-ui.github.io/khiewxinru-ui-misi-rukun-negara/

Status sebenar deployment boleh disemak pada tab **Actions**. URL sahaja bukan bukti bahawa deployment berjaya.

## Menjalankan projek

Gunakan Node.js 24 dan npm.

```sh
npm ci
npm run dev
```

Buka URL yang dipaparkan oleh Vite. Untuk binaan pengeluaran:

```sh
npm test
npm run build
npm run preview
```

Semua aset permainan dan fon dihoskan bersama website. Sambungan Internet diperlukan untuk memuatkan website; selepas dimuatkan, interaksi pelajar tidak memerlukan akaun atau panggilan API berbayar. Tiada Vercel digunakan.

## Cara bermain

1. Pilih **Mula Pengembaraan**, pilih watak dan masukkan nama panggilan.
2. Masuki lorong masa dan baca arahan misi.
3. Komputer: **W A S D** / anak panah atas-bawah untuk bergerak, tetikus atau anak panah kiri-kanan untuk melihat. Klik dunia untuk mengunci tetikus; **Esc** melepaskannya.
4. Dekati penanda emas, kemudian tekan **E** atau butang interaksi.
5. Baca atau dengar penemuan. Selesaikan padanan, susunan dan pilihan situasi.
6. Lengkapkan aktiviti misi untuk membuka misi seterusnya. Tiada had masa.
7. Buku pengembaraan merekodkan pengetahuan yang telah ditemui. Nama, kemajuan dan refleksi disimpan pada peranti yang sama.

Telefon/tablet: gunakan butang arah dan leret dunia untuk melihat. Kualiti grafik rendah boleh dipilih dalam tetapan. Ujian emulasi telefon tidak menggantikan penilaian prestasi pada telefon fizikal sekolah.

## Tiga misi

| Misi | Aktiviti | Kandungan |
| --- | --- | --- |
| Jejak Masa 1969 | 4 | Tiga petunjuk dan pentaksiran tiga sebab pengenalan |
| Lima Prinsip, Satu Negara | 6 | Lima matlamat dan lima cabaran prinsip |
| Duta Perpaduan | 6 | Enam peranan Rukun Negara dalam situasi kehidupan |

Kandungan disemak daripada halaman **bercetak 36–46** buku teks yang dinyatakan dalam prompt. Watak dan dialog pendidikan ialah rekaan. Galeri ialah ruang imaginatif. Rekonstruksi visual tidak didakwa sebagai rakaman atau pembinaan semula tepat sebuah lokasi sebenar.

[Pemetaan kandungan dan pentaksiran](docs/content-map.md) · [Master prompt](docs/MASTER-PROMPT.md)

## Teacher Editor

Buka **Ruang Guru** di menu atau tambah `#guru` pada URL.

### Mod tempatan

Butang **Lihat editor tempatan** membolehkan penyuntingan, simpan draf pada peranti, eksport/import JSON dan pratonton 3D. Ia **tidak menerbitkan perubahan kepada murid**. Akses ini bukan log masuk pentadbir. Butang Terbitkan dimatikan tanpa sesi guru backend.

### Mod guru dengan backend

Backend Node.js disertakan dalam `server/`. Ia menyediakan:

- OAuth GitHub dengan state dan PKCE, senarai guru yang dibenarkan dan semakan kebenaran repository.
- Sesi 8 jam dalam cookie HttpOnly; token GitHub dienkripsi menggunakan AES-256-GCM pada backend.
- Draf bersama dalam SQLite, kawalan versi draf untuk mengelakkan tindihan perubahan, dan storan multimedia sementara.
- Penyuntingan teks, dialog, soalan, jawapan, maklum balas, gambar, audio, kedudukan dan jenis objek.
- Penerbitan atomik kandungan/aset dalam satu commit GitHub, tanpa force push.
- Pemantauan GitHub Actions: **commit berjaya tidak dilabelkan sebagai deployment berjaya**.
- Pemulihan versi sebagai draf, kemudian penerbitan secara berasingan.

**GitHub Pages tidak menjalankan backend ini.** Ia perlu dihoskan pada pelayan Node berasingan dengan HTTPS dan cakera kekal. OAuth sebenar dan penerbitan guru dalam talian memerlukan konfigurasi pemilik serta ujian log masuk sebenar; ujian API dengan penyedia GitHub tiruan bukan pengesahan OAuth produksi.

[Panduan pemasangan backend dan OAuth](docs/teacher-backend.md)

## Mengubah kandungan

Kandungan utama ialah `public/content/game.json`. Permainan memuatkannya ketika dibuka, menggunakan laluan relatif yang serasi dengan subfolder GitHub Pages. Guru juga boleh mengubahnya melalui editor selepas backend dihubungkan.

- `missions[].activities[]`: dialog, soalan, pilihan dan jawapan, maklum balas, petunjuk dan objek.
- `position`: `[x, z]`, dalam sempadan laluan permainan.
- `audio`: audio halaman dialog pertama; `narration[]`: audio mengikut halaman dialog.
- `soundtrack`: muzik latar dan bunyi persekitaran.
- `correct`: indeks jawapan bermula daripada **0** dalam fail JSON; editor memaparkan indeks **1** untuk input padanan/susunan.
- Mengubah teks dialog dalam editor membuang pautan rakaman bagi halaman tersebut supaya audio lama tidak menyampaikan teks yang berbeza. Muat naik rakaman pengganti untuk halaman itu.

Jangan menukar ID objek sedia ada tanpa migrasi simpanan murid. Jangan simpan rahsia dalam JSON, frontend, repository atau pemboleh ubah `VITE_*`.

## Struktur

```text
src/
  components/       Menu, dialog cabaran, HUD dan Teacher Editor
  game/             Dunia R3F, gerakan/collision, audio, simpanan, loading
  shared/           Skema kandungan dan semakan jawapan
public/
  content/game.json Kandungan pembelajaran yang diterbitkan
  assets/           GLB, tekstur, muzik, naratif dan fon tempatan
server/             OAuth, sesi, SQLite dan penerbitan GitHub
scripts/            Penjana aset asal dan semakan aset
tests/              Ujian kandungan, integrasi API dan perjalanan browser
docs/               Panduan guru, sumber, laporan ujian dan lesen
.github/workflows/  Build dan deployment GitHub Pages
```

## GitHub Pages

1. Dalam **Settings → Pages**, tetapkan sumber kepada **GitHub Actions**.
2. Push ke branch `main`, atau jalankan workflow **Deploy to GitHub Pages** secara manual.
3. Workflow menjalankan ujian, memeriksa TypeScript, membina Vite dan menerbitkan `dist/`.
4. Semak kejayaan job deployment dan uji URL sebenar, termasuk model dan audio.
5. Jika backend guru telah tersedia, tambah repository variable `EDITOR_API_URL` dan jalankan semula workflow. Nilai ini ialah URL awam API, bukan token.

Vite menggunakan `base: './'`, jadi repository ini berfungsi pada laluan `/khiewxinru-ui-misi-rukun-negara/`. Jika nama repository ditukar, URL turut berubah; kemas kini `APP_URL` pada backend.

## Ujian

```sh
npm test
npm run build
# Dalam terminal lain:
npm run preview -- --port 4173
TEST_URL=http://127.0.0.1:4173 npm run test:e2e
```

Konfigurasi browser menggunakan Chromium pada `/usr/bin/chromium`; tetapkan `PLAYWRIGHT_CHROMIUM_EXECUTABLE` pada sistem lain atau pasang Chromium Playwright. Ujian perjalanan menggerakkan pemain melalui kawalan sebenar; ia tidak mengisi terus senarai misi selesai.

[Keputusan dan had pengujian](docs/verification.md)

## Aset dan skop visual

Bangunan GLB asal dimodelkan dengan arked melengkung, kaki lima, tiang, cornice, tingkap berbidai, pintu berpanel dan jubin bumbung. Tekstur plaster, kayu, batu dan jalan disertakan. Misi menggunakan kawasan warisan bersaiz kecil dengan variasi pasar, galeri dan taman komuniti.

Imej menu ialah ilustrasi sinematik yang dijana; ia bukan tangkapan skrin gameplay. Paparan permainan sebenar ialah dunia 3D dalam `src/game/World.tsx`. Aset tidak mewakili dokumentasi tepat sebuah bandar atau bangunan tahun 1969.

Muzik, kesan dan bunyi persekitaran dijana untuk projek ini. Naratif ialah suara sintesis Bahasa Melayu. Fon DM Sans dan Libre Caslon Display menggunakan SIL Open Font License; salinan lesen tersedia dalam `docs/licenses/`.

Model boleh dijana semula dengan Blender melalui `scripts/build-heritage.py`. Skrip audio memerlukan Python; skrip naratif juga memerlukan `espeakng-loader` dan ffmpeg. **Semua hasil aset telah disertakan** — Blender dan Python tidak diperlukan oleh murid atau untuk build website.
