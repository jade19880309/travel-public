"""確認信新增語言：泰文 th、越南文 vi、印尼文 id（2026-11-24）。
由 mail_patch.apply() 一併套用到 TOB 與偏航。每組 (舊字串, 新字串) 在目標檔裡必須剛好出現一次。
預設需求的翻譯放在獨立的 PRX 表（依需求 id），不動原本 PRE 的各行。
"""

DATE_CONSTS = r"""const THM=['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'],THW=['อาทิตย์','จันทร์','อังคาร','พุธ','พฤหัสบดี','ศุกร์','เสาร์'],VIW=['Chủ nhật','Thứ Hai','Thứ Ba','Thứ Tư','Thứ Năm','Thứ Sáu','Thứ Bảy'],IDM=['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'],IDW=['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
"""

DATE_RET = r"""
 if(L=='th')return short?`${dd} ${THM[m-1]} ${y}`:`วัน${THW[w]}ที่ ${dd} ${THM[m-1]} ${y}`;
 if(L=='vi')return short?`${dd}/${m}/${y}`:`${VIW[w]}, ${dd}/${m}/${y}`;
 if(L=='id')return short?`${dd} ${IDM[m-1]} ${y}`:`${IDW[w]}, ${dd} ${IDM[m-1]} ${y}`;
 if(L=='ja')return short?"""

LB_EXTRA = r"""Object.assign(LB,{
 th:{hotel:'โรงแรม',co:'บริษัท',site:'จองผ่าน',direct:'เว็บไซต์ทางการ',no:'เลขที่การจอง',code:'รหัสการจอง',cin:'เช็คอิน',cout:'เช็คเอาท์',nt:n=>`${n} คืน`,room:i=>`ห้อง ${i}`,guest:'ชื่อผู้เข้าพัก',gs:n=>`${n} ท่าน`,bf1:'รวมอาหารเช้า',bf0:'ไม่รวมอาหารเช้า',ord:i=>`การจอง ${i}`,pick:'รับรถ',ret:'คืนรถ',date:'วันที่',time:'เวลา',pax:'จำนวนคน',ppl:n=>`${n} ท่าน`,rn:'ชื่อผู้จอง',dr:'จำนวนห้องรวมต่อวัน',rms:n=>`${n} ห้อง`},
 vi:{hotel:'Khách sạn',co:'Công ty',site:'Đặt qua',direct:'Website chính thức',no:'Mã đặt chỗ',code:'Mã đặt chỗ',cin:'Nhận phòng',cout:'Trả phòng',nt:n=>`${n} đêm`,room:i=>`Phòng ${i}`,guest:'Tên khách',gs:n=>`${n} khách`,bf1:'gồm bữa sáng',bf0:'không gồm bữa sáng',ord:i=>`Đặt chỗ ${i}`,pick:'Nhận xe',ret:'Trả xe',date:'Ngày',time:'Giờ',pax:'Số người',ppl:n=>`${n} người`,rn:'Tên người đặt',dr:'Tổng số phòng mỗi ngày',rms:n=>`${n} phòng`},
 id:{hotel:'Hotel',co:'Perusahaan',site:'Dipesan melalui',direct:'Situs resmi',no:'No. Pemesanan',code:'Kode reservasi',cin:'Check-in',cout:'Check-out',nt:n=>`${n} malam`,room:i=>`Kamar ${i}`,guest:'Nama tamu',gs:n=>`${n} tamu`,bf1:'termasuk sarapan',bf0:'tidak termasuk sarapan',ord:i=>`Pemesanan ${i}`,pick:'Pengambilan',ret:'Pengembalian',date:'Tanggal',time:'Waktu',pax:'Jumlah orang',ppl:n=>`${n} orang`,rn:'Nama pemesan',dr:'Total kamar per hari',rms:n=>`${n} kamar`}});
const siteN=(p,L)=>"""

FR_EXTRA = r"""Object.assign(FR,{
 th:{hi:(n,k)=>k=='hotel'?'เรียน ฝ่ายสำรองห้องพัก':`เรียน ทีมงาน ${n}`,in:'ขอยืนยันรายละเอียดการจองดังต่อไปนี้ค่ะ/ครับ',hd:'รายละเอียดการจอง:',rq:'และขอความช่วยเหลือเพิ่มเติมดังนี้:',ask:'รบกวนช่วยยืนยันข้อมูลข้างต้นด้วยค่ะ/ครับ',end:{hotel:'ขอบคุณมากค่ะ/ครับ รอเข้าพักกับทางโรงแรมนะคะ/ครับ',car:'ขอบคุณมากค่ะ/ครับ แล้วพบกันนะคะ/ครับ',tix:'ขอบคุณมากค่ะ/ครับ รอเยี่ยมชมนะคะ/ครับ'},bye:s=>`ขอแสดงความนับถือ\n${s}`,
  sub:(no,dt)=>`ขอยืนยันการจอง${no?' – เลขที่การจอง '+no:''}${dt?' – '+dt:''}`,dk:{hotel:'เช็คอิน ',car:'รับรถ ',tix:''}},
 vi:{hi:(n,k)=>k=='hotel'?'Kính gửi Bộ phận Đặt phòng,':`Kính gửi ${n},`,in:'Tôi xin xác nhận lại đặt chỗ sau:',hd:'Thông tin đặt chỗ:',rq:'Chúng tôi cũng xin gửi một số yêu cầu sau:',ask:'Rất mong quý vị xác nhận giúp thông tin trên.',end:{hotel:'Xin chân thành cảm ơn. Chúng tôi rất mong được đến lưu trú.',car:'Xin chân thành cảm ơn. Hẹn gặp quý vị.',tix:'Xin chân thành cảm ơn. Chúng tôi rất mong được ghé thăm.'},bye:s=>`Trân trọng,\n${s}`,
  sub:(no,dt)=>`Xác nhận đặt chỗ${no?' – Mã đặt chỗ '+no:''}${dt?' – '+dt:''}`,dk:{hotel:'Nhận phòng ',car:'Nhận xe ',tix:''}},
 id:{hi:(n,k)=>k=='hotel'?'Yth. Tim Reservasi,':`Yth. Tim ${n},`,in:'Saya menulis untuk mengonfirmasi ulang reservasi berikut.',hd:'Detail reservasi:',rq:'Kami juga ingin mengajukan permintaan berikut:',ask:'Mohon bantuannya untuk mengonfirmasi hal di atas.',end:{hotel:'Terima kasih banyak. Kami menantikan untuk menginap di tempat Anda.',car:'Terima kasih banyak. Sampai jumpa.',tix:'Terima kasih banyak. Kami menantikan kunjungan kami.'},bye:s=>`Hormat kami,\n${s}`,
  sub:(no,dt)=>`Konfirmasi Ulang Reservasi${no?' – No. Pemesanan '+no:''}${dt?' – '+dt:''}`,dk:{hotel:'Check-in ',car:'Pengambilan ',tix:''}}});
function mMail(v,L,signer){"""

PRX = r"""/* 泰文、越南文、印尼文的預設需求翻譯（依需求 id；用法同 PRE 的 t） */
const BTX={twin:{th:'ทวิน (เตียงเดี่ยวสองเตียง)',vi:'hai giường đơn',id:'dua tempat tidur terpisah (twin)'},dbl:{th:'ดับเบิล (เตียงใหญ่หนึ่งเตียง)',vi:'một giường đôi',id:'satu tempat tidur ganda'}};
const PRX={
 arr:{th:v=>`คาดว่าจะถึงประมาณ ${v} น.`,vi:v=>`Chúng tôi dự kiến đến khoảng ${v}.`,id:v=>`Kami perkirakan tiba sekitar pukul ${v}.`},
 flt:{th:v=>`เราเดินทางด้วยเที่ยวบิน ${v[0]}${v[1]?' (กำหนดถึงเวลา '+v[1]+' น.)':''} จึงจะเช็คอินล่าช้า กรุณาเก็บห้องพักไว้ให้เราด้วย`,vi:v=>`Chúng tôi đi chuyến bay ${v[0]}${v[1]?' (dự kiến hạ cánh lúc '+v[1]+')':''} nên sẽ nhận phòng muộn. Xin vui lòng giữ phòng cho chúng tôi.`,id:v=>`Kami menumpang penerbangan ${v[0]}${v[1]?' (dijadwalkan tiba pukul '+v[1]+')':''}, sehingga akan check-in terlambat. Mohon tetap simpankan kamar untuk kami.`},
 late:{th:'เราอาจเดินทางถึงล่าช้า กรุณาเก็บห้องพักไว้ให้เราด้วย',vi:'Chúng tôi có thể đến muộn, xin vui lòng giữ phòng cho chúng tôi.',id:'Kami mungkin tiba terlambat, mohon tetap simpankan kamar untuk kami.'},
 nosmk:{th:'หากเป็นไปได้ ขอห้องปลอดบุหรี่',vi:'Nếu có thể, chúng tôi muốn phòng không hút thuốc.',id:'Jika memungkinkan, kami mohon kamar bebas rokok.'},
 high:{th:'หากมีห้องว่าง ขอห้องชั้นสูง',vi:'Nếu còn phòng, chúng tôi muốn phòng ở tầng cao.',id:'Jika tersedia, kami mohon kamar di lantai yang lebih tinggi.'},
 adj:{th:'เราเดินทางมาด้วยกันเป็นกลุ่ม จึงขอห้องที่อยู่ติดกันหรืออยู่ชั้นเดียวกัน',vi:'Vì đi cùng nhóm, chúng tôi mong được xếp các phòng liền kề hoặc cùng tầng.',id:'Karena kami bepergian bersama, kami mohon kamar yang bersebelahan atau di lantai yang sama.'},
 merge:{th:'เนื่องจากเราจองต่อเนื่องกัน ขอสอบถามว่าสามารถรวมการจองให้เราพักห้องเดิมตลอดช่วงที่เข้าพัก โดยไม่ต้องย้ายห้อง ได้หรือไม่',vi:'Vì chúng tôi đặt phòng liên tiếp, xin hỏi khách sạn có thể gộp các đặt phòng để chúng tôi ở cùng một phòng suốt thời gian lưu trú mà không phải đổi phòng được không?',id:'Karena pemesanan kami berurutan, apakah memungkinkan untuk menggabungkan pemesanan agar kami dapat menginap di kamar yang sama selama masa menginap tanpa berpindah kamar?'},
 bed:{th:v=>`ขอเป็นเตียง${BTX[v].th}`,vi:v=>`Chúng tôi muốn ${BTX[v].vi}.`,id:v=>`Kami lebih memilih ${BTX[v].id}.`},
 kids:{th:v=>`เราเดินทางมากับเด็กอายุ ${v} กรุณาแจ้งหากมีค่าใช้จ่ายเพิ่มเติม`,vi:v=>`Chúng tôi đi cùng trẻ em ${v}. Vui lòng cho biết nếu có phụ phí.`,id:v=>`Kami bepergian bersama anak-anak berusia ${v}. Mohon informasikan jika ada biaya tambahan.`},
 crib:{th:'ขอเตียงเด็กอ่อนได้หรือไม่',vi:'Khách sạn có thể cung cấp cũi cho em bé được không?',id:'Apakah Anda dapat menyediakan tempat tidur bayi?'},
 xbed:{th:'สามารถเสริมเตียงได้หรือไม่ หากมีค่าใช้จ่าย กรุณาแจ้งให้ทราบ',vi:'Có thể kê thêm giường không? Nếu có phụ phí, xin vui lòng cho biết.',id:'Apakah memungkinkan menambah tempat tidur ekstra? Mohon informasikan biayanya, jika ada.'},
 bagin:{th:'เราอาจถึงก่อนเวลาเช็คอิน ขอฝากสัมภาระไว้ที่เคาน์เตอร์ได้หรือไม่',vi:'Chúng tôi có thể đến trước giờ nhận phòng. Chúng tôi có thể gửi hành lý tại quầy lễ tân được không?',id:'Kami mungkin tiba sebelum jam check-in. Bolehkah kami menitipkan bagasi di meja resepsionis?'},
 bagout:{th:'หลังเช็คเอาท์ ขอฝากสัมภาระไว้ที่โรงแรมได้หรือไม่',vi:'Sau khi trả phòng, chúng tôi có thể gửi hành lý lại khách sạn được không?',id:'Bolehkah kami menitipkan bagasi di hotel setelah check-out?'},
 bagmid:{th:v=>`หลังเช็คเอาท์วันที่ ${v[0]} เราจะกลับมาพักอีกครั้งตั้งแต่วันที่ ${v[1]} ขอฝากสัมภาระไว้ที่โรงแรมในช่วงระหว่างนั้นได้หรือไม่`,vi:v=>`Sau khi trả phòng ngày ${v[0]}, chúng tôi sẽ quay lại lưu trú từ ngày ${v[1]}. Chúng tôi có thể gửi hành lý tại khách sạn trong thời gian giữa hai lần ở được không?`,id:v=>`Setelah check-out pada ${v[0]}, kami akan menginap lagi mulai ${v[1]}. Bolehkah kami menitipkan bagasi di hotel selama jeda tersebut?`},
 parcel:{th:'เราอาจส่งพัสดุมาที่โรงแรมก่อนวันเข้าพัก โดยระบุชื่อผู้จอง ขอรบกวนรับและเก็บรักษาไว้จนกว่าเราจะเช็คอินได้หรือไม่',vi:'Chúng tôi có thể gửi một bưu kiện đến khách sạn trước ngày đến, ghi tên người đặt phòng. Khách sạn có thể nhận và giữ giúp đến khi chúng tôi nhận phòng được không?',id:'Kami mungkin mengirim paket ke hotel sebelum kedatangan kami, atas nama pemesan. Mohon bantuannya untuk menerima dan menyimpannya hingga kami check-in.'},
 park:{th:'เราจะเดินทางด้วยรถยนต์ มีที่จอดรถหรือไม่ และมีค่าบริการเท่าไร',vi:'Chúng tôi sẽ đi bằng ô tô. Khách sạn có chỗ đậu xe không và phí là bao nhiêu?',id:'Kami akan datang dengan mobil. Apakah tersedia tempat parkir, dan berapa biayanya?'},
 shut:{th:'โรงแรมมีบริการรถรับ-ส่งสนามบินหรือไม่ กรุณาแจ้งรายละเอียดและค่าบริการ',vi:'Khách sạn có dịch vụ đưa đón sân bay không? Xin vui lòng cho biết chi tiết và chi phí.',id:'Apakah Anda menyediakan layanan antar-jemput bandara? Mohon informasikan detail dan biayanya.'},
 bfq:{th:'กรุณายืนยันว่ารวมอาหารเช้าหรือไม่',vi:'Xin vui lòng xác nhận giá phòng có bao gồm bữa sáng hay không.',id:'Mohon konfirmasi apakah sarapan sudah termasuk.'},
 ptime:{th:v=>`เราวางแผนจะมารับรถประมาณ ${v} น.`,vi:v=>`Chúng tôi dự kiến nhận xe vào khoảng ${v}.`,id:v=>`Kami berencana mengambil mobil sekitar pukul ${v}.`},
 rtime:{th:v=>`เราวางแผนจะคืนรถประมาณ ${v} น.`,vi:v=>`Chúng tôi dự kiến trả xe vào khoảng ${v}.`,id:v=>`Kami berencana mengembalikan mobil sekitar pukul ${v}.`},
 seat:{th:v=>`ขอคาร์ซีทสำหรับเด็กอายุ ${v}`,vi:v=>`Chúng tôi cần ghế ngồi ô tô cho trẻ em ${v}.`,id:v=>`Kami membutuhkan kursi anak untuk anak berusia ${v}.`},
 drv:{th:v=>`ขอเพิ่มผู้ขับขี่อีก ${v} ท่าน`,vi:v=>`Chúng tôi muốn thêm ${v} tài xế.`,id:v=>`Kami ingin menambah ${v} pengemudi.`},
 lic:{th:'เราถือใบขับขี่ไต้หวัน กรุณาแจ้งเอกสารที่ต้องใช้ตอนรับรถ (เช่น ใบขับขี่ ฉบับแปล หรือใบขับขี่สากล)',vi:'Chúng tôi có giấy phép lái xe Đài Loan. Xin vui lòng cho biết cần chuẩn bị giấy tờ nào khi nhận xe (bằng lái, bản dịch hoặc giấy phép lái xe quốc tế).',id:'Kami memiliki SIM Taiwan. Mohon informasikan dokumen yang diperlukan saat pengambilan (misalnya SIM, terjemahan, atau SIM Internasional).'},
 etc:{th:'ขอเช่าบัตร ETC สำหรับจ่ายค่าทางด่วน',vi:'Chúng tôi muốn thuê thẻ ETC để đi đường thu phí.',id:'Kami ingin menyewa kartu ETC untuk jalan tol.'},
 ins:{th:'กรุณายืนยันความคุ้มครองประกันภัยที่รวมอยู่ในราคา',vi:'Xin vui lòng xác nhận các loại bảo hiểm được bao gồm.',id:'Mohon konfirmasi cakupan asuransi yang sudah termasuk.'},
 ptx:{th:'มีรถรับ-ส่งจากสถานีหรือสนามบินไปยังสาขาหรือไม่',vi:'Có dịch vụ đưa đón từ nhà ga hoặc sân bay đến văn phòng không?',id:'Apakah ada antar-jemput dari stasiun atau bandara ke kantor Anda?'},
 dt:{th:'กรุณายืนยันวันที่และเวลาของการจอง',vi:'Xin vui lòng xác nhận ngày và giờ đặt chỗ của chúng tôi.',id:'Mohon konfirmasi tanggal dan jam pemesanan kami.'},
 kidt:{th:v=>`เรามีเด็กอายุ ${v} กรุณายืนยันว่าใช้ตั๋วประเภทใด`,vi:v=>`Chúng tôi có trẻ em ${v}. Xin vui lòng cho biết loại vé áp dụng.`,id:v=>`Kami membawa anak berusia ${v}. Mohon konfirmasi jenis tiket yang berlaku.`},
 snr:{th:'มีส่วนลดสำหรับผู้สูงอายุหรือไม่',vi:'Có giảm giá cho người cao tuổi không?',id:'Apakah ada diskon untuk lansia?'},
 get:{th:'กรุณาแจ้งวิธีและสถานที่รับตั๋ว',vi:'Xin vui lòng cho biết cách thức và địa điểm nhận vé.',id:'Mohon informasikan cara dan lokasi pengambilan tiket.'},
 strl:{th:'นำรถเข็นเด็กเข้าไปได้หรือไม่',vi:'Chúng tôi có thể mang theo xe đẩy em bé không?',id:'Bolehkah kami membawa kereta dorong bayi?'},
 kchr:{th:'ขอเก้าอี้สำหรับเด็กได้หรือไม่',vi:'Xin vui lòng chuẩn bị ghế dành cho trẻ em.',id:'Mohon siapkan kursi anak.'}};
const ageArr="""

LOCAL = (
    "if(x.cur=='THB'||/泰國|泰国|曼谷|清邁|清迈|普吉|芭達雅|芭提雅|Thailand|Bangkok/i.test(t+' '+s))return 'th';"
    "if(x.cur=='VND'||/越南|河內|河内|胡志明|峴港|岘港|Vietnam/i.test(t+' '+s))return 'vi';"
    "if(x.cur=='IDR'||/印尼|峇里|巴厘|雅加達|雅加达|Indonesia|Bali|Jakarta/i.test(t+' '+s))return 'id';\n"
    " if(x.cur=='CNY')return 'zhs';"
)

PAIRS = [
    ("const MLN={ja:'日文',ko:'韓文',zhs:'簡體中文',zht:'繁體中文',en:'英文'};",
     "const MLN={ja:'日文',ko:'韓文',th:'泰文',vi:'越南文',id:'印尼文',zhs:'簡體中文',zht:'繁體中文',en:'英文'};"),
    ("const CL=L=>(L=='en'||L=='ko')?", "const CL=L=>/^(en|ko|th|vi|id)$/.test(L)?"),
    ("const PR=(L,s)=>(L=='en'||L=='ko')?", "const PR=(L,s)=>/^(en|ko|th|vi|id)$/.test(L)?"),
    # 當地語言自動判斷
    ("\n if(x.cur=='CNY')return 'zhs';", "\n " + LOCAL),
    # 日期
    ("function mDate(s,L,short){", DATE_CONSTS + "function mDate(s,L,short){"),
    ("\n if(L=='ja')return short?", DATE_RET),
    # 飯店名稱：泰文用原文優先；越南、印尼用英文（拉丁字母）優先
    ("return L=='en'?(e||z):L=='ja'?", "return L=='th'?(o||e||z):(L=='vi'||L=='id')?(e||o||z):L=='en'?(e||z):L=='ja'?"),
    # 標籤、信件框架
    ("const siteN=(p,L)=>", LB_EXTRA),
    ("function mMail(v,L,signer){", FR_EXTRA),
    ("nos.slice(0,3).join(L=='en'||L=='ko'?', ':'、')", "nos.slice(0,3).join(/^(en|ko|th|vi|id)$/.test(L)?', ':'、')"),
    # 兒童年齡
    ("const AGE=(a,L)=>L=='en'?",
     "const AGE=(a,L)=>L=='th'?a.map(x=>x+' ขวบ').join(' และ '):L=='vi'?(a.length>1?a.slice(0,-1).join(', ')+' và '+a[a.length-1]:a[0])+' tuổi':L=='id'?(a.length>1?a.slice(0,-1).join(', ')+' dan '+a[a.length-1]:a[0])+' tahun':L=='en'?"),
    # 預設需求翻譯
    ("const ageArr=", PRX),
    ("const val=o[p.id],f=p.t[L];", "const val=o[p.id],f=p.t[L]||(PRX[p.id]||{})[L];if(!f)return '';"),
    ("mDate(x,L,1).replace(/ \\d{4}$/,'')", "mDate(x,L,1).replace(/[ \\/]\\d{4}$/,'')"),
]
