# Laporan pengujian

## Binaan dan kandungan

- **Lulus**: TypeScript dan binaan produksi Vite.
- **Lulus**: 100 laluan aset kandungan/dunia wujud sebelum build, termasuk 91 rakaman Osman yang dipilih, model GLB, tekstur, muzik dan bunyi persekitaran.
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

Perjalanan lengkap diuji pada binaan produksi dalam Chromium dengan grafik perisian dan tetapan kualiti rendah. Larian lengkap yang diasingkan dengan rakaman Osman dan arahan baharu lulus; senario lain diuji secara berasingan. Pengujian tidak mengisi terus senarai aktiviti selesai untuk senario perjalanan lengkap.

Pengujian ini ialah emulasi browser, bukan ujian prestasi pada komputer atau telefon fizikal sekolah.

## Backend yang dijalankan secara setempat

Arahan `npm run server` berjaya memulakan servis Node. `GET /health` mengembalikan `ok: true` dan **`configured: false`** apabila OAuth belum disediakan. Permintaan tanpa sesi ke `/api/draft` ditolak dengan **HTTP 401**.

Ujian API menggunakan penyedia GitHub tiruan untuk mengesahkan simpanan/penerbitan secara selamat. **Ini tidak membuktikan OAuth produksi atau penerbitan guru sebenar telah tersedia.**

## GitHub Pages — bukti penerbitan terdahulu

Binaan asas telah diterbitkan. Deployment [42385002591](https://github.com/khiewxinru-ui/khiewxinru-ui-misi-rukun-negara/actions/runs/42385002591) berjaya: ujian, build, konfigurasi Pages dan job deploy semuanya lulus. Pemilik telah menetapkan Source kepada GitHub Actions.

URL website sebenar:

https://khiewxinru-ui.github.io/khiewxinru-ui-misi-rukun-negara/

- Halaman utama mengembalikan **HTTPS 200**.
- Semakan sebelum penarikan balik suara meliputi 41 laluan model/audio/media yang mengembalikan HTTP 200; fail eSpeak kemudian ditarik balik selepas semakan kualiti pemilik.
- Sampel model GLB, muzik dan naratif yang diterbitkan mempunyai SHA-256 sama dengan fail sumber.
- Perjalanan lengkap pada URL sebenar lulus: semua 16 aktiviti, tiga misi, refleksi dan pemulihan selepas refresh (4.7 minit). Ralat aset/Retry, editor tempatan, joystick telefon dan pemulihan sempadan juga lulus.
- Permintaan browser dalam Cloud disalurkan melalui klien permintaan yang mengesahkan TLS menggunakan CA proksi persekitaran. Pengesahan sijil tidak dinyahaktifkan.

Status binaan terkini boleh disemak pada [Actions](https://github.com/khiewxinru-ui/khiewxinru-ui-misi-rukun-negara/actions). Bukti URL sebenar di atas merujuk binaan asas; keputusan pengujian Osman dan saiz teks di bawah merujuk binaan produksi tempatan sehingga workflow kemas kini selesai.

## Masih memerlukan konfigurasi pemilik

- Hosting backend Node dengan HTTPS dan volum kekal.
- GitHub OAuth App, rahsia pelayan dan senarai akaun guru.
- Log masuk guru sebenar, penerbitan melalui akaun guru, serta pengesahan perubahan pada URL murid yang sama.
- Ujian browser dan prestasi pada peranti fizikal sekolah.

Rujuk [panduan backend](teacher-backend.md) untuk langkah persediaan dan senarai penerimaan produksi.

## Status kualiti suara

Pemilik memilih suara lelaki **ms-MY-OsmanNeural**. 91 rakaman menggunakan kadar pertuturan, nada, kelantangan dan jeda mengikut jenis ayat. Ini ialah rakaman sintetik; ujian automatik mengesahkan main balik dan kawalan audio, bukan penilaian manusia terhadap ketepatan sebutan atau keberkesanan emosi. Halaman `voice-preview.html` memainkan empat rakaman sebenar daripada permainan untuk semakan pemilik.

Rakaman eSpeak terdahulu dan fallback TTS pelayar kekal disekat, termasuk apabila kandungan/tetapan lama masih tersimpan.

## Kemas kini bahasa dan arahan suara

Pemilik memilih Osman lelaki (ms-MY) dan meminta arahan pendek serta kandungan sejarah dikekalkan. 91 fail audio dijana dan dinyahkod semasa penghasilan. Arahan tugasan/misi dipendekkan kepada 4–9 perkataan, dengan perbandingan hash yang mengesahkan dialog sejarah, pilihan, padanan, jawapan, maklum balas ilmu dan rumusan tidak berubah.

Ujian browser rakaman baharu lulus: rakaman memainkan audio, butang Teruskan menghentikan rakaman lama, muzik menjadi perlahan semasa pertuturan dan kembali kepada aras asal selepas dialog ditutup. Fail eSpeak serta TTS pelayar kekal disekat.

## Saiz teks pembelajaran

Dialog 20 px pada komputer dan 18 px pada telefon. Soalan 20/18 px; pilihan, padanan, susunan, petunjuk dan catatan 17–18 px, dengan jarak baris yang lebih selesa. Kawalan jawapan sekurang-kurangnya 48 px tinggi. Kandungan sejarah tidak dipendekkan untuk memuatkan skrin.

Semakan browser pada 1024 × 768 dan 390 × 844 menguji paparan dialog penuh, saiz teks sebenar, pemilihan jawapan, skrol, penghantaran dan penutupan dialog tanpa overflow mendatar. Senario joystick, peralihan misi dan kedua-dua regresi audio turut lulus.
