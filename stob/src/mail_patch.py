"""確認信模板修改（2026-11-24）：TOB（travel-private/index.html）與偏航（detour.py）共用同一份精準字串取代。
PAIRS 的每一組 (舊字串, 新字串) 在目標檔裡都必須剛好出現一次。
①特殊需求新增「連續訂單併房」 ②主旨入住日期多筆時用「–」連成區間 ③飯店訂單內容加入「每日總房間數」
"""

MERGE_CHIP = (
    "  {id:'merge',g:'房間',zh:'連續訂單併房（不換房）',t:{"
    "en:'As we have consecutive bookings, would it be possible to merge them so that we can stay in the same room(s) throughout without changing rooms?',"
    "ja:'ご予約が連続しておりますので、お部屋を移動せずに同じお部屋に連泊できるよう、ご予約をまとめていただくことは可能でしょうか。',"
    "ko:'예약이 연속되어 있으므로, 객실을 옮기지 않고 같은 객실에서 계속 투숙할 수 있도록 예약을 합쳐 주실 수 있을까요?',"
    "zht:'因為我們是連續訂房，請問可以併房（合併訂單），讓我們連續入住同一間房、不用換房嗎？',"
    "zhs:'因为我们是连续订房，请问可以并房（合并订单），让我们连续入住同一间房、不用换房吗？'}},\n"
)

ROOMS_FN = r"""const mAddD=(s,n)=>{const [y,m,d]=s.split('-').map(Number),t=new Date(y,m-1,d+n);return t.getFullYear()+'-'+String(t.getMonth()+1).padStart(2,'0')+'-'+String(t.getDate()).padStart(2,'0')};
/* 每日總房間數：把勾選的訂單逐晚加總，連續且房數相同的日子併成一段 */
function dRooms(hs,L){const B=LB[L],c=CL(L),cnt={};
 hs.forEach(h=>{if(!h.cin||!h.cout||h.cout<=h.cin)return;const n=(h.rooms||[]).length;for(let d=h.cin,i=0;d<h.cout&&i<400;d=mAddD(d,1),i++)cnt[d]=(cnt[d]||0)+n});
 const ds=Object.keys(cnt).sort();if(!ds.length)return [];
 const sh=s=>mDate(s,L,1).replace(/ \d{4}$/,''),runs=[];
 ds.forEach(d=>{const r=runs[runs.length-1];if(r&&r.n==cnt[d]&&mAddD(r.b,1)==d)r.b=d;else runs.push({a:d,b:d,n:cnt[d]})});
 const bl=L=='ja'||isZh(L)?'・':'- ';
 return ['',`${B.dr}${c}`.trim(),...runs.map(r=>`${bl}${r.a==r.b?sh(r.a):sh(r.a)+'–'+sh(r.b)}${c}${B.rms(r.n)}`)]}
"""

DATES_FN = r"""/* 主旨的入住日期：多個日期用「–」連成區間（首日–末日），避免訂單多時標題太長 */
const mDates=v=>mOn(v).map(x=>{if(v.kind=='hotel')return x.cin;if(v.kind=='car'){const q=pLine(x.lines,'取車');return q&&q.d||x.date}return x.date}).filter(Boolean).sort();
function mDateTxt(v,L){const a=mDates(v);if(!a.length)return '';const f=a[0],l=a[a.length-1];if(f==l)return mDate(f,L,1);
 let x=mDate(f,L,1);if(L=='en'&&f.slice(0,4)==l.slice(0,4))x=x.replace(/ \d{4}$/,'');return x+'–'+mDate(l,L,1)}
"""

PAIRS = [
    # ① 特殊需求：連續訂單併房（放在「房間」群組，相鄰房之後、床型之前）
    ("  {id:'bed',g:'房間',zh:'床型',p:'bed',", MERGE_CHIP + "  {id:'bed',g:'房間',zh:'床型',p:'bed',"),
    # ③ 每日總房間數：標籤（五種語言）
    ("rn:'Name on reservation'}", "rn:'Name on reservation',dr:'Total rooms per day',rms:n=>n==1?'1 room':`${n} rooms`}"),
    ("rn:'予約者名'}", "rn:'予約者名',dr:'日ごとの合計部屋数',rms:n=>`${n}室`}"),
    ("rn:'예약자'}", "rn:'예약자',dr:'일별 총 객실 수',rms:n=>`${n}실`}"),
    ("rn:'預約人'}", "rn:'預約人',dr:'每日總房間數',rms:n=>`${n} 間`}"),
    ("rn:'预约人'}", "rn:'预约人',dr:'每日总房间数',rms:n=>`${n} 间`}"),
    # ③ 每日總房間數：加在飯店訂單內容最後
    ("function dHotel(v,L){", ROOMS_FN + "function dHotel(v,L){"),
    (" return o}\nconst pLine=", " o.push(...dRooms(hs,L));return o}\nconst pLine="),
    # ② 主旨入住日期區間
    ("const mFirstDate=v=>", DATES_FN + "const mFirstDate=v=>"),
    ("fd=mFirstDate(v),ds=mDate(fd,L,1);", "ds=mDateTxt(v,L);"),
]


def apply(text, label=''):
    for old, new in PAIRS:
        n = text.count(old)
        if n != 1:
            raise SystemExit('%s: 對不到或不只一處(%d)：%s' % (label, n, old[:70]))
        text = text.replace(old, new, 1)
    return text
