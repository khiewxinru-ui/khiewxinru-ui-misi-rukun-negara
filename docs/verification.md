# Laporan pengujian

## Binaan dan kandungan

- **Lulus**: TypeScript dan binaan produksi Vite.
- **Lulus**: 9 laluan aset kandungan/dunia wujud sebelum build selepas penarikan balik naratif eSpeak, termasuk model GLB, tekstur, muzik dan bunyi persekitaran.
- **Lulus**: 11 ujian kandungan, API dan pergerakan melalui `npm test`.

Ujian merangkumi jawapan tiga sebab yang tepat, skema dan laluan kandungan, enkripsi sesi, akses guru/CSRF, draf bersama, pengesahan fail, konflik versi, penerbitan atomik, pemulihan versi, pergerakan pada kadar bingkai berbeza, collision dan sempadan peta.

Semakan penerbitan GitHub dipautkan kepada commit induk yang sama dan ref dikemas kini tanpa force push. Perubahan serentak tidak digabungkan secara senyap dengan draf lama.

## Senario browser — lulus

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

## GitHub Pages — telah diterbitkan

Deployment [42385002591](https://github.com/khiewxinru-ui/khiewxinru-ui-misi-rukun-negara/actions/runs/42385002591) berjaya: ujian, build, konfigurasi Pages dan job deploy semuanya lulus. Pemilik telah menetapkan Source kepada GitHub Actions.

URL website sebenar:

https://khiewxinru-ui.github.io/khiewxinru-ui-misi-rukun-negara/

- Halaman utama mengembalikan **HTTPS 200**.
- Semakan sebelum penarikan balik suara meliputi 41 laluan model/audio/media yang mengembalikan HTTP 200; fail eSpeak kemudian ditarik balik selepas semakan kualiti pemilik.
- Sampel model GLB, muzik dan naratif yang diterbitkan mempunyai SHA-256 sama dengan fail sumber.
- Perjalanan lengkap pada URL sebenar lulus: semua 16 aktiviti, tiga misi, refleksi dan pemulihan selepas refresh (4.7 minit). Ralat aset/Retry, editor tempatan, joystick telefon dan pemulihan sempadan juga lulus.
- Permintaan browser dalam Cloud disalurkan melalui klien permintaan yang mengesahkan TLS menggunakan CA proksi persekitaran. Pengesahan sijil tidak dinyahaktifkan.

## Masih memerlukan konfigurasi pemilik

- Hosting backend Node dengan HTTPS dan volum kekal.
- GitHub OAuth App, rahsia pelayan dan senarai akaun guru.
- Log masuk guru sebenar, penerbitan melalui akaun guru, serta pengesahan perubahan pada URL murid yang sama.
- Ujian browser dan prestasi pada peranti fizikal sekolah.

Rujuk [panduan backend](teacher-backend.md) untuk langkah persediaan dan senarai penerimaan produksi.

## Status kualiti suara

Naratif eSpeak terdahulu ditolak oleh pemilik kerana sebutan tidak standard untuk Bahasa Melayu Malaysia. Fail telah ditarik balik, rujukan kandungan dikosongkan dan fallback TTS pelayar dimatikan. Ujian main balik/metadata terdahulu hanya membuktikan fail boleh dimainkan; ia bukan penilaian sebutan. Sampel pengganti ms-MY memerlukan semakan manusia sebelum penerbitan keseluruhan.

Ujian regresi suara lulus: tetapan lama `voice: true` dan `subtitles: false` tidak mencetuskan rakaman yang ditolak atau TTS pelayar; teks dialog tetap kelihatan dan kawalan audio tidak tersedia dilumpuhkan.
