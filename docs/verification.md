# Laporan pengujian

## Binaan dan kandungan

- **Lulus**: TypeScript dan binaan produksi Vite.
- **Lulus**: 45 laluan aset kandungan/dunia wujud sebelum build, termasuk model GLB, muzik dan 36 fail naratif Bahasa Melayu.
- **Lulus**: 11 ujian kandungan, API dan pergerakan melalui `npm test`.

Ujian merangkumi jawapan tiga sebab yang tepat, skema dan laluan kandungan, enkripsi sesi, akses guru/CSRF, draf bersama, pengesahan fail, konflik versi, penerbitan atomik, pemulihan versi, pergerakan pada kadar bingkai berbeza, collision dan sempadan peta.

Semakan penerbitan GitHub dipautkan kepada commit induk yang sama dan ref dikemas kini tanpa force push. Perubahan serentak tidak digabungkan secara senyap dengan draf lama.

## Lima senario browser — lulus

| Senario                  | Bukti                                                                                                                                                                                                                                                         |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Perjalanan lengkap murid | Pilih watak/nama, bergerak melalui kawalan sebenar, selesaikan semua 16 aktiviti dalam tiga misi, jawab salah dan cuba semula, capai penamat dan tulis refleksi. Semua misi dan refleksi dipulihkan selepas refresh. Tiada ralat JavaScript dalam aliran ini. |
| Ralat aset dan Retry     | Model 3D dipaksa pulang 404; mesej ralat dipaparkan dan Retry berjaya memuatkan dunia.                                                                                                                                                                        |
| Teacher Editor tempatan  | Sunting tajuk, simpan draf, pratonton 3D, muatkan semula draf. Butang penerbitan global dinyahaktifkan tanpa sesi backend.                                                                                                                                    |
| Telefon                  | Viewport 390 × 844, tiada overflow mendatar, joystick analog menggerakkan pemain.                                                                                                                                                                             |
| Sempadan simpanan        | Simpanan selesai pada X=4.85 kekal boleh disambung, refleksi dipulihkan, dan tetapan kelantangan/sensitiviti rosak dipulihkan kepada lalai.                                                                                                                   |

Perjalanan lengkap diuji pada binaan produksi dalam Chromium dengan grafik perisian dan tetapan kualiti rendah. Larian akhir yang diasingkan selesai dengan keputusan **1 passed (4.7m)**; empat senario lain turut lulus secara berasingan. Pengujian tidak mengisi terus senarai aktiviti selesai untuk senario perjalanan lengkap.

Pengujian ini ialah emulasi browser, bukan ujian prestasi pada komputer atau telefon fizikal sekolah.

## Backend yang dijalankan secara setempat

Arahan `npm run server` berjaya memulakan servis Node. `GET /health` mengembalikan `ok: true` dan **`configured: false`** apabila OAuth belum disediakan. Permintaan tanpa sesi ke `/api/draft` ditolak dengan **HTTP 401**.

Ujian API menggunakan penyedia GitHub tiruan untuk mengesahkan simpanan/penerbitan secara selamat. **Ini tidak membuktikan OAuth produksi atau penerbitan guru sebenar telah tersedia.**

## GitHub Pages — belum diterbitkan

Kod dan workflow telah dihantar ke branch `main`. Workflow berjaya menjalankan build dan ujian, tetapi langkah `actions/configure-pages` tidak dapat menemui tapak Pages yang telah diaktifkan. Cubaan mengaktifkannya melalui GitHub API ditolak dengan **403 Resource not accessible by integration**.

Pemilik perlu membuka **Settings → Pages → Source → GitHub Actions**, kemudian menjalankan semula workflow atau push baharu.

URL sasaran:

`https://khiewxinru-ui.github.io/khiewxinru-ui-misi-rukun-negara/`

URL itu belum boleh dianggap deployment yang berjaya. Perjalanan pada URL GitHub Pages sebenar perlu diuji selepas penerbitan berjaya.

## Masih memerlukan konfigurasi pemilik

- Hosting backend Node dengan HTTPS dan volum kekal.
- GitHub OAuth App, rahsia pelayan dan senarai akaun guru.
- Log masuk guru sebenar, penerbitan melalui akaun guru, serta pengesahan perubahan pada URL murid yang sama.
- Ujian browser dan prestasi pada peranti fizikal sekolah.

Rujuk [panduan backend](teacher-backend.md) untuk langkah persediaan dan senarai penerimaan produksi.
