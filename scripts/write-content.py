import json
from pathlib import Path

def activity(id,title,label,speaker,dialogue,kind,question,options,correct,feedback,hint,position,obj,page,matches=None):
 return dict(id=id,title=title,label=label,speaker=speaker,dialogue=dialogue,kind=kind,question=question,options=options,correct=correct,matches=matches or [],feedback=feedback,hint=hint,position=position,object=obj,image='',audio='',page=page)

m1=[
activity('ekonomi','Tiga pekerjaan, satu persoalan','Peti perdagangan','Pak Rahman, penjaga kedai',[
'Selamat datang, {name}. Lihat barang-barang ini: hasil tani, bijih timah dan getah. Setiap satunya menceritakan kegiatan ekonomi yang berbeza.',
'Semasa pentadbiran British, masyarakat dipisahkan mengikut kegiatan ekonomi utama. Keadaan itu mewujudkan jurang ekonomi yang tidak seimbang.',
'Ini ialah gambaran pola sejarah dalam buku teks, bukan pekerjaan semua orang dalam sesuatu kaum, dan bukan gambaran masyarakat Malaysia hari ini.'
],'match','Padankan hasil dengan kegiatan ekonominya.',['Hasil tanaman','Bijih timah','Getah'],[2,0,1],
'Tepat! Perbezaan kegiatan ekonomi ialah salah satu sebab pengenalan Rukun Negara. Corak ekonomi yang terpisah mewujudkan jurang antara masyarakat.',
'Bijih timah dilombong; getah dihasilkan di ladang; tanaman berkaitan pertanian.',[-3.5,3],'crate','37',['Perlombongan','Perladangan','Pertanian']),
activity('penempatan','Jarak yang memisahkan','Peta penempatan','Mei Ling, penduduk rekaan',[
'Pada peta ini, kampung, bandar dan ladang terletak berjauhan. Cuba bayangkan jika kita jarang berjumpa dengan jiran daripada kawasan lain.',
'Buku teks menerangkan pola sejarah: orang Melayu banyak di kampung dan pedalaman, orang Cina di bandar, dan orang India di ladang. Ini bukan keadaan semua individu.',
'Pengasingan tempat tinggal mengurangkan peluang masyarakat untuk berinteraksi. Bagaimanakah hubungan dapat dieratkan?'
],'multi','Pilih DUA pemerhatian yang disokong oleh petunjuk ini.',['Tempat tinggal yang berasingan mengurangkan interaksi.','Semua individu dalam sesuatu kaum tinggal di tempat yang sama.','Aktiviti bersama membuka peluang untuk berkenalan.','Masyarakat tidak perlu berhubung.'],[0,2],
'Bagus. Pengasingan tempat tinggal mengurangkan interaksi. Peluang bertemu dan bekerjasama membantu mengeratkan hubungan.',
'Fikirkan peluang untuk bertemu. Elakkan kenyataan yang menganggap semua orang adalah sama.',[3.5,-5],'map','37'),
activity('politik','Suara dari radio lama','Radio kedai','Narator',[
'Radio ini membawa kita menelusuri latar sejarah. Perbezaan fahaman politik merenggangkan hubungan antara kaum. Keadaan tidak harmoni turut menjadi latar Peristiwa 13 Mei 1969.',
'Selepas peristiwa tersebut, pentadbiran negara dijalankan oleh MAGERAN. Rukun Negara kemudiannya diperkenalkan untuk mengukuhkan perpaduan dan semangat kekitaan.',
'Tiada rakaman berita sejarah dimainkan di sini. Penerangan ini ialah naratif pendidikan yang disusun berdasarkan buku teks.'
],'order','Susun hubungan sebab dan keperluan ini daripada awal hingga akhir.',['Hubungan antara kaum menjadi renggang.','Perpaduan dan semangat kekitaan perlu diperkukuh.','Wujud perbezaan fahaman politik.'],[2,0,1],
'Betul. Perbezaan fahaman politik merenggangkan hubungan. Rukun Negara menjadi panduan untuk mengukuhkan perpaduan.',
'Mulakan dengan perbezaan fahaman, kemudian kesannya kepada hubungan, dan akhirnya perkara yang perlu diperkukuh.',[-3.5,-14],'radio','36–37'),
activity('sebab','Tiga petunjuk sejarah','Meja penyiasat','Penjaga masa',[
'Kamu telah menemui petunjuk tentang ekonomi, tempat tinggal dan fahaman politik. Kini satukan hasil penyiasatanmu.',
'Peristiwa 13 Mei 1969 ialah latar sejarah yang penting. Namun, pentaksiran ini meminta tiga sebab pengenalan Rukun Negara yang dinyatakan dalam buku teks.'
],'multi','Pilih tepat TIGA sebab pengenalan Rukun Negara.',['Perbezaan kegiatan ekonomi','Kemajuan Internet','Pengasingan tempat tinggal','Peristiwa 13 Mei 1969','Perbezaan fahaman politik','Perubahan cuaca'],[0,2,4],
'Ketiga-tiga sebab tepat: perbezaan kegiatan ekonomi, pengasingan tempat tinggal dan perbezaan fahaman politik. Laluan masa seterusnya kini terbuka.',
'Gunakan tiga petunjuk yang kamu kumpulkan. Bezakan sebab yang dinilai dengan latar peristiwa.',[3.5,-25],'book','36–37')]

m2=[
activity('matlamat','Lima cita-cita bersama','Papan cita-cita','Penjaga galeri imaginatif',[
'Selepas memahami sebab pengenalannya, kita meneroka cita-cita dan prinsip Rukun Negara. Galeri ini ialah ruang pengembaraan imaginatif, bukan bangunan sejarah sebenar.',
'Rukun Negara diisytiharkan pada 31 Ogos 1970. Lima matlamatnya meliputi perpaduan, demokrasi, masyarakat adil, kebebasan terhadap tradisi kebudayaan yang pelbagai, dan masyarakat progresif berasaskan sains serta teknologi moden.'
],'match','Padankan tindakan dengan matlamat yang paling sesuai.',['Bermuafakat antara masyarakat','Menghormati keputusan melalui proses demokrasi','Menikmati kemakmuran secara adil dan saksama','Menghargai kepelbagaian tradisi kebudayaan','Menggunakan sains dan teknologi moden'],[2,4,0,3,1],
'Lima matlamat saling melengkapi: perpaduan erat, hidup demokrasi, masyarakat adil, sikap liberal terhadap tradisi kebudayaan, dan masyarakat progresif.',
'Cari perkataan petunjuk: muafakat, demokrasi, adil, tradisi serta teknologi.',[-3.5,4],'notice','38',['Masyarakat yang adil','Masyarakat progresif','Perpaduan lebih erat','Sikap liberal terhadap tradisi kebudayaan','Cara hidup demokrasi']),
activity('tuhan','Ruang untuk saling menghormati','Pelita keharmonian','Asha, pengunjung rekaan',[
'Kepercayaan kepada Tuhan bermaksud agama sebagai pegangan utama rakyat Malaysia.',
'Prinsip ini membimbing kita menghormati amalan beragama masyarakat lain dan membantu menyatupadukan masyarakat yang berbilang kaum.'
],'choice','Seorang rakan mengamalkan agamanya. Apakah tindakan yang menepati prinsip pertama?',['Memaksanya mengikut amalan kita.','Menghormati amalannya dan menjaga adab.','Mengejek amalannya.'],[1],
'Menghormati amalan beragama orang lain membantu masyarakat hidup bersatu padu.',
'Prinsip ini mengajak kita menghormati pegangan dan amalan beragama.',[3.5,-1],'lantern','39'),
activity('raja','Taat setia, bersama','Sudut kedaulatan','Penjaga galeri',[
'Kesetiaan kepada Raja dan Negara menuntut setiap warganegara memberikan sepenuh taat setia kepada Yang di-Pertuan Agong sebagai Ketua Utama Negara.',
'Prinsip ini menyatupadukan rakyat dan menyemai semangat patriotik.'
],'match','Padankan unsur dengan penerangan yang betul.',['Yang di-Pertuan Agong','Kesetiaan kepada Raja dan Negara','Semangat patriotik'],[1,2,0],
'Tepat. Yang di-Pertuan Agong ialah Ketua Utama Negara. Taat setia menyatukan rakyat dan memupuk kecintaan kepada negara.',
'Bezakan institusi negara, nama prinsip, dan perasaan cinta akan negara.',[-3.5,-6],'flag','40',['Cinta akan negara','Ketua Utama Negara','Prinsip kedua Rukun Negara']),
activity('perlembagaan','Asas tertinggi','Naskhah perlembagaan','Penjaga galeri',[
'Keluhuran Perlembagaan bermaksud Perlembagaan Persekutuan ialah undang-undang tertinggi negara.',
'Tiada institusi yang dapat mengatasi ketertinggiannya. Rakyat perlu menerima, mematuhi dan mempertahankan kemuliaan Perlembagaan Persekutuan.'
],'choice','Letakkan naskhah yang menjadi undang-undang tertinggi pada tempat utama.',['Peraturan permainan','Perlembagaan Persekutuan','Peraturan sebuah kelab'],[1],
'Perlembagaan Persekutuan ialah undang-undang tertinggi negara. Peraturan lain tidak mengatasi ketertinggiannya.',
'Cari undang-undang yang menjadi asas tertinggi bagi negara.',[3.5,-12],'book','41'),
activity('undang','Laluan yang selamat','Tanda keselamatan','Penjaga laluan',[
'Kedaulatan Undang-undang bermaksud rakyat menghormati dan mematuhi undang-undang yang ditetapkan.',
'Kepatuhan ini membantu menjamin keharmonian masyarakat dan keselamatan negara.'
],'order','Susun tindakan sebelum melintas jalan di tempat yang sesuai.',['Melintas apabila laluan selamat.','Berhenti di tepi jalan.','Perhatikan keadaan lalu lintas.'],[1,2,0],
'Sikap berhati-hati dan mematuhi peraturan membantu menjaga keselamatan bersama.',
'Berhenti dahulu, perhatikan lalu lintas, kemudian melintas apabila selamat.',[-3.5,-18],'notice','42'),
activity('sopan','Budi membina jambatan','Bangku pertemuan','Amir, pengunjung rekaan',[
'Kesopanan dan Kesusilaan bermaksud amalan nilai murni yang mencerminkan keperibadian rakyat Malaysia.',
'Nilai murni membentuk masyarakat yang berdisiplin, berakhlak mulia, saling memahami dan bekerjasama.'
],'multi','Pilih DUA tindakan yang menunjukkan kesopanan dan kesusilaan.',['Mendengar pendapat rakan dengan tertib.','Memotong percakapan dan menghina rakan.','Mengucapkan terima kasih selepas dibantu.','Merampas barang tanpa izin.'],[0,2],
'Mendengar dengan tertib dan berterima kasih mengeratkan hubungan. Kelima-lima prinsip kini menjadi bekalan untuk misi seterusnya.',
'Pilih tindakan yang menjaga perasaan dan menghargai orang lain.',[3.5,-25],'bench','43')]

m3=[
activity('agama','Jiran yang saling menghargai','Ruang kejiranan','Asha, jiran rekaan',[
'Kamu kembali ke Malaysia masa kini. Jiran-jiran sedang merancang aktiviti komuniti yang disertai pelbagai agama dan kepercayaan.',
'Menghormati amalan dan keperluan masing-masing membantu kita meraikan kepelbagaian.'
],'choice','Seorang jiran meminta ruang untuk menunaikan amalan agamanya. Apakah pilihanmu?',['Memberikan ruang dan menghormati keperluannya.','Menyuruhnya meninggalkan aktiviti.','Menjadikan amalannya bahan jenaka.'],[0],
'Jiranmu berasa dihargai. Menghormati agama dan kepercayaan membina masyarakat yang bertoleransi.',
'Fikirkan cara memastikan semua jiran berasa dihormati.',[-3.5,4],'lantern','44'),
activity('patriotik','Hormat lambang negara','Dataran komuniti','Mei Ling, sukarelawan rekaan',[
'Komuniti sedang bersedia untuk sambutan Hari Kebangsaan. Semangat patriotik menyemai cinta dan taat setia kepada negara.',
'Rukun Negara juga membimbing kita menghormati lambang kedaulatan negara seperti Jalur Gemilang, Jata Negara dan lagu Negaraku.'
],'multi','Pilih DUA tindakan yang memperlihatkan semangat patriotik.',['Menghormati Jalur Gemilang.','Mempermainkan lagu Negaraku.','Menyertai aktiviti komuniti dengan rasa cinta akan negara.','Merosakkan hiasan kebangsaan.'],[0,2],
'Persiapan komuniti kini lebih bermakna. Menghormati lambang negara dan menyumbang kepada komuniti mencerminkan semangat patriotik.',
'Pilih perbuatan yang menunjukkan hormat dan cinta akan negara.',[3.5,-1],'flag','45'),
activity('patuh','Keselamatan milik bersama','Papan komuniti','Pak Rahman, jiran rekaan',[
'Ada rakan mengajak kamu merosakkan kemudahan awam. Undang-undang membantu menjaga keamanan dan keselamatan.',
'Rukun Negara membimbing rakyat menghindari kegiatan jenayah dan mematuhi undang-undang.'
],'choice','Apakah tindakan yang menjaga kesejahteraan komuniti?',['Mengikut ajakan supaya diterima rakan.','Menolak ajakan dan mendapatkan bantuan orang dewasa.','Merosakkan kemudahan apabila tiada orang melihat.'],[1],
'Kemudahan awam terpelihara dan komuniti kekal selamat. Kamu menunjukkan sikap menghormati undang-undang.',
'Pilih tindakan yang mematuhi undang-undang dan mendapatkan bantuan yang sesuai.',[-3.5,-6],'notice','45'),
activity('perpaduan','Taman kita, usaha bersama','Taman muafakat','Amir, sukarelawan rekaan',[
'Taman kejiranan memerlukan gotong-royong. Jiran daripada pelbagai latar belakang mahu menyumbang.',
'Permuafakatan, toleransi dan sikap menghormati budaya lain membantu mengukuhkan perpaduan masyarakat.'
],'match','Padankan situasi dengan tindakan yang membantu kerjasama.',['Jiran baharu belum mengenali sesiapa.','Ahli kumpulan berbeza pendapat.','Tugasan perlu disiapkan bersama.'],[2,0,1],
'Taman kembali ceria melalui kerjasama semua. Sikap bertoleransi dan bermuafakat mengukuhkan perpaduan.',
'Kenalkan jiran, dengar pandangan, dan bahagikan kerja secara adil.',[3.5,-12],'garden','45',['Dengar pandangan dan cari persetujuan.','Bahagikan kerja dengan adil.','Ajak berkenalan dan sertai kumpulan.']),
activity('nilai','Kecil tindakan, besar makna','Bangku kejiranan','Mei Ling, jiran rekaan',[
'Seorang jiran tercicir barang ketika membawa bekalan untuk aktiviti komuniti.',
'Kesopanan dan budi pekerti mulia mewujudkan hubungan yang harmoni dan saling menghormati.'
],'order','Susun tindakan membantu jiran dengan sopan.',['Ucapkan kata yang baik setelah membantu.','Minta izin untuk membantu.','Bantu mengutip dan pulangkan barangnya.'],[1,2,0],
'Jiranmu tersenyum dan berterima kasih. Nilai murni dapat diamalkan melalui tindakan harian yang sederhana.',
'Mulakan dengan meminta izin. Bantu dengan baik dan akhiri dengan kata yang sopan.',[-3.5,-18],'bench','46'),
activity('jati','Janji seorang Duta Perpaduan','Gerbang perpaduan','Penjaga masa',[
'Perjalananmu hampir selesai, {name}. Rukun Negara membina jati diri melalui toleransi, kerjasama dan sikap saling memahami.',
'Integriti bermaksud kejujuran yang tulen dan konsisten. Tindakan kita perlu mencerminkan nilai yang kita pegang.'
],'multi','Pilih TIGA amalan yang akan kamu bawa pulang.',['Bekerjasama dengan rakan pelbagai latar belakang.','Meniru dalam peperiksaan apabila sukar.','Bertolak ansur dan cuba memahami orang lain.','Bersikap jujur walaupun tiada orang melihat.','Menghina perbezaan budaya.'],[0,2,3],
'Kamu memilih kerjasama, toleransi dan kejujuran. Inilah antara amalan yang membentuk jati diri dan mengukuhkan perpaduan dalam kehidupan.',
'Pilih tiga amalan yang menunjukkan kerjasama, toleransi dan integriti.',[3.5,-25],'arch','46')]

data=dict(version=1,title='MISI RUKUN NEGARA',subtitle='Pengembaraan Merentas Masa',
introduction='Setiap negara mempunyai kisah yang membentuk masa depannya. Hari ini, kamu diberi peluang untuk menyaksikan sebahagian daripada perjalanan sejarah Malaysia. Apakah yang menyatukan rakyat berbilang kaum di Malaysia?',
source=dict(url='https://fliphtml5.com/itcew/pnmn/Sejarah_Tahun_6/',pages='36–46',checked='2026-11-07'),
missions=[
dict(id=1,title='Jejak Masa 1969',era='MALAYSIA · 1969',tagline='Tiga petunjuk. Satu permulaan.',introduction='Terokai lorong ini dan temui tiga petunjuk yang membantu kamu memahami keadaan masyarakat Malaysia pada zaman tersebut. Selepas itu, satukan hasil penyiasatanmu di meja penyiasat.',conclusion='Perbezaan kegiatan ekonomi, pengasingan tempat tinggal dan perbezaan fahaman politik ialah tiga sebab pengenalan Rukun Negara. Kini terokai matlamat dan prinsip yang mengukuhkan perpaduan.',activities=m1),
dict(id=2,title='Lima Prinsip, Satu Negara',era='GALERI MASA · 1970',tagline='Temui asas yang menyatukan kita.',introduction='Ikuti laluan galeri imaginatif. Temui lima matlamat, kemudian lengkapkan cabaran bagi setiap prinsip Rukun Negara.',conclusion='Kamu memahami lima matlamat dan lima prinsip Rukun Negara. Bawa bekalan ini ke Malaysia masa kini dan tunjukkan peranannya melalui tindakan.',activities=m2),
dict(id=3,title='Duta Perpaduan',era='MALAYSIA · MASA KINI',tagline='Sejarah menjadi tindakan.',introduction='Kembali ke komuniti hari ini. Bantu jiran, buat keputusan dan amalkan peranan Rukun Negara dalam enam situasi kehidupan.',conclusion='Sejarah memberi kita pengajaran. Rukun Negara membimbing masyarakat menghormati kepelbagaian, mencintai negara, mematuhi undang-undang, bersatu padu, berbudi pekerti dan membina jati diri.',activities=m3)])
Path('public/content/game.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
print('16 activities written from verified textbook pages 36–46.')
