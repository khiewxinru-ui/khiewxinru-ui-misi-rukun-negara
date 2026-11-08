# Laporan pengujian — kemas kini penerokaan visual

## Binaan dan kandungan

- TypeScript dan binaan produksi Vite lulus.
- 169 laluan aset kandungan/dunia disahkan sebelum build, termasuk 135 rakaman Osman, 21 imej unik dan empat model baharu.
- 14 ujian kandungan, pentaksiran, API dan pergerakan melalui `npm test` lulus.
- Audit [visual-history-review.json](visual-history-review.json) membandingkan commit asas dengan versi baharu: dialog sejarah, soalan asal, pilihan, padanan, jawapan, maklum balas ilmu, petunjuk dan rumusan kekal sama.

## Senario browser

Pengujian menggunakan binaan produksi dalam Chromium, grafik perisian dan kualiti rendah. Senario perjalanan lengkap menggerakkan pemain melalui kawalan sebenar; ia tidak mengisi terus senarai aktiviti selesai. Senario khusus menggunakan checkpoint untuk mengasingkan perkara yang diuji.

| Senario                | Pengesahan                                                                                                                                                                                                                              |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Perjalanan lengkap     | Pilihan watak/nama → video pilihan pemilik → prolog/portal → semua 16 aktiviti dan pemerhatian dalam tiga misi → enam tugasan objektif serta tiga jawapan bertulis → keputusan mengikut objektif → refleksi → pemulihan selepas refresh |
| Gambar dan pemerhatian | Gambar dipaksa 404; Retry berjaya. Foto arkib/kredit/tarikh, paparan besar, fokus papan kekunci/Escape, jawapan salah/cuba semula dan catatan tersimpan diuji                                                                           |
| Tiga dunia             | Lorong warisan, dewan sivik dan sekolah/komuniti dimuatkan tanpa ralat JavaScript; NPC serta papan bergambar dilihat melalui screenshot                                                                                                 |
| Telefon dan saiz teks  | Viewport 390 × 844, joystick menggerakkan pemain, dialog penuh dan teks besar, jawapan boleh dipilih/dihantar, tiada overflow mendatar                                                                                                  |
| Audio                  | Rakaman lelaki memainkan audio, Next menghentikan rakaman lama, muzik diperlahankan semasa suara dan dipulihkan selepas dialog; penerangan gambar memainkan fail Osman yang berkaitan                                                   |
| Suara ditolak          | Laluan eSpeak lama dan fallback TTS pelayar tidak digunakan, walaupun tetapan/kandungan lama masih ada                                                                                                                                  |
| Pentaksiran separa     | Padanan yang belum lengkap dan jawapan bertulis kekal selepas refresh; jawapan yang belum lengkap tidak boleh dihantar sebagai pentaksiran lengkap                                                                                      |
| Editor tempatan        | Draf boleh disunting, disimpan, dipratonton dan dimuatkan semula; Terbitkan dinyahaktifkan tanpa sesi backend                                                                                                                           |
| Ralat 3D               | Fail model dipaksa 404; mesej ralat dan Retry berjaya                                                                                                                                                                                   |
| Simpanan lama          | Checkpoint di tepi peta, refleksi dan tetapan rosak pulih dengan selamat; medan pemerhatian/pentaksiran baharu mempunyai nilai lalai                                                                                                    |

Keputusan akhir senario perjalanan lengkap dan pemeriksaan visual: **5 passed (8.0m)**, termasuk perjalanan lengkap selama **6.7 minit**. Senario lain lulus secara berasingan. Binaan selepas pelarasan mod grafik rendah turut lulus enam senario regresi; ujian animasi tambahan lulus secara berasingan.

## Batas pengujian video

Pautan **2FgimpUv8q8** diberikan oleh pemilik. URL iframe yang tepat, pautan asal, susun atur responsif dan pilihan meneruskan apabila iframe gagal telah diuji. Halaman embed mengembalikan HTTP 200, tetapi konfigurasi pemain di Cloud memaparkan **Video player configuration error**. Oleh itu, pengujian ini **tidak membuktikan penstriman video atau ketersediaan sari kata pada peranti murid**. Pautan rasmi YouTube sentiasa disediakan; tiada salinan video dihoskan semula.

## Status penerbitan

Laman murid menggunakan URL yang sama:

https://khiewxinru-ui.github.io/khiewxinru-ui-misi-rukun-negara/

Workflow [Deploy to GitHub Pages](https://github.com/khiewxinru-ui/khiewxinru-ui-misi-rukun-negara/actions/workflows/pages.yml) menjalankan ujian, build dan deployment selepas push. Semak workflow pada commit semasa untuk keputusan penerbitan; build tempatan tidak dianggap bukti bahawa deployment telah berjaya.

## Backend guru

Servis Node/SQLite dan laluan penerbitan GitHub tersedia dalam kod, dengan ujian akses guru/CSRF, penyimpanan draf, validasi fail, konflik versi dan penerbitan atomik. Pengujian API menggunakan penyedia GitHub tiruan. Log masuk OAuth produksi dan penerbitan melalui akaun guru **belum dikonfigurasi serta diuji**.

Konfigurasi yang masih diperlukan: hosting backend Node HTTPS dengan volum kekal, GitHub OAuth App dan rahsia pelayan, senarai akaun guru, `APP_URL` dan repository variable `EDITOR_API_URL`. Rujuk [teacher-backend.md](teacher-backend.md). Tiada token disimpan dalam frontend dan tiada Vercel digunakan.

## Had penilaian

Ujian browser ialah emulasi, bukan ujian prestasi pada peranti fizikal sekolah. Skor objektif tidak memberi markah automatik untuk penerangan bertulis; rubrik dan semakan guru masih diperlukan. Ujian audio membuktikan fail boleh dimainkan dan kawalan berfungsi, bukan penilaian manusia bahawa semua sebutan atau emosi telah sempurna. Model dan ilustrasi ialah rekaan pendidikan, bukan rekonstruksi ukur tepat atau gambar sejarah sebenar.
