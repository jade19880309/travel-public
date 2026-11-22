/* =====================================================================
   建議行程：依訂單（航班、住宿、交通、門票）＋偏好，由 Claude 排出每日大綱＋細項；
   可單日重排、一句話修改，存在雲端；可匯出 A4 PDF 列印存檔
   ===================================================================== */
const PL={busy:'',err:'',ctl:null,ask:{},conf:false,edit:'',dl:null};
SUB.splice(SUB.length-1,0,['plan','行程']);
const PACE=['輕鬆（每天 2–3 個點）','適中','緊湊（想多跑一些）'];
const addD=(x,n)=>{const t=pd(x);t.setDate(t.getDate()+n);return t.toLocaleDateString('sv-SE')};
const tDays=t=>{const a=[];if(!t.start)return a;const z=t.end||t.start;for(let x=t.start,i=0;x<=z&&i<40;x=addD(x,1),i++)a.push(x);return a};
const wkd=x=>'週'+WD[pd(x).getDay()];
const mapU=q=>'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(q);
function plOf(tid){if(!db.plans||typeof db.plans!='object')db.plans={};return db.plans[tid]||(db.plans[tid]={prefs:{},plan:null})}

/* 同行者：依成員生日自動整理 */
function whoAuto(t){const ms=people(t.id).map(M).filter(Boolean),on=t.start||new Date().toLocaleDateString('sv-SE');if(!ms.length)return '';
 const ag=ms.map(m=>m.dob?parseInt(ageAt(m.dob,on)):null),kid=ag.filter(a=>a!=null&&a<18),old=ag.filter(a=>a!=null&&a>=65);
 return `共 ${ms.length} 人`+(kid.length?`，小孩 ${kid.length} 位（${kid.sort((a,b)=>a-b).join('、')} 歲）`:'')+(old.length?`，65 歲以上 ${old.length} 位`:'')}
/* 每晚住宿（依目前勾選採用的飯店／露營車／郵輪） */
function nightStay(t){const H=db.ht.filter(h=>h.trip==t.id&&okH(h)).concat(CAMP.filter(c=>c.trip==t.id&&campOn(c))),m={};
 tDays(t).forEach(x=>{const on=H.filter(h=>h.cin<=x&&x<h.cout);if(on.length){const h=on[0];m[x]={name:h.zh||h.en,en:h.en||'',area:hArea(h)||h.area||'',addr:h.addr||''}}});return m}
function planCtx(t){const P=plOf(t.id).prefs||{},ns=nightStay(t);
 const fl=db.fl.filter(f=>f.trip==t.id&&okF(f)).flatMap(f=>f.segs.filter(s=>s.dir!='預期不飛').map(s=>({航段:s.dir,航班:(s.airline||f.airline||'')+' '+s.no,日期:s.date,起飛:s.dep,抵達:s.arr,從:s.from,到:s.to})));
 const tr=[...db.tr,...db.ot].filter(x=>x.trip==t.id&&okT(x)).map(x=>({類型:x.type||'',名稱:x.title||x.company||'',日期:x.date||'',時間:[x.dep,x.arr].filter(Boolean).join('→'),地點:[x.from,x.to].filter(Boolean).join('→'),重點:(x.lines||[]).slice(0,6)}));
 return `旅程：${t.name.replace(/^\d{6}/,'')}（${t.start} 到 ${t.end}，共 ${tDays(t).length} 天）
同行者：${P.who||whoAuto(t)||'未填'}
步調：${P.pace||'適中'}
想去／必去：${P.must||'（沒有指定）'}
不想去／要避開：${P.avoid||'（沒有）'}
飲食：${P.food||'（沒有特別要求）'}
其他要求：${P.note||'（沒有）'}
已訂航班：${fl.length?JSON.stringify(fl):'（沒有）'}
每晚住宿：${Object.keys(ns).length?JSON.stringify(ns):'（還沒訂住宿，請依旅程名稱與偏好假設合理的住宿區域，並在 tips 提醒建議住哪一區）'}
已訂交通／門票／餐廳：${tr.length?JSON.stringify(tr):'（沒有）'}`}
const PLAN_FMT=`回傳 JSON（只回傳 JSON，全部用繁體中文）：
{"title":"行程標題","summary":"兩三句話說明整體安排","tips":["交通卡、預約、天氣、注意事項等實用提醒，3–6 點"],
 "days":[{"date":"YYYY-MM-DD","title":"當天主題（短）","area":"主要區域","hotel":"當晚住宿名稱",
   "items":[{"time":"09:00","title":"地點或活動名稱","detail":"做什麼、看什麼、建議停留多久、小提醒（1–2 句）","move":"從上一個點怎麼過去、約多久","q":"Google 地圖搜尋字（名稱＋城市）","booked":false,"cost":"大約費用（可空）"}]}]}`;
const PLAN_RULES=`排行程規則：
- 每一天都要有（從出發日到回程日），items 依時間排序，包含早餐以外的午餐、晚餐建議。
- 「已訂」的航班、交通、門票、餐廳一定要排在正確的日期與時間，booked 設為 true，不能改動。
- 抵達日：落地後約 1.5 小時（入境、領行李）才開始活動，第一站通常是先到住宿寄放行李；回程日：國際線起飛前 2.5 小時要到機場。
- 景點盡量排在當晚住宿附近或順路，避免來回折返；換住宿的那天要排移動。
- 依同行者調整：有小孩或長輩就放慢步調、安排休息，避免太長的步行。
- 不要編造不存在的地方；不確定營業時間的，在 detail 提醒「出發前確認」。`;

function plSave(){cloudSave()}
function plPref(tid,k,v){const P=plOf(tid);P.prefs=P.prefs||{};P.prefs[k]=v;clearTimeout(PL.pt);PL.pt=setTimeout(plSave,800)}
function plErr(e){return errTxt(e)}
async function plGen(){const tid=oneT(),t=T(tid);if(!tid||PL.busy||!CLD.sample)return;PL.busy='all';PL.err='';PL.conf=false;render();
 try{PL.ctl=new AbortController();const r=obj(await CLD.sample.json(`你是專業的旅遊行程規劃師。請依下面的資料，排出這趟旅程每天的建議行程。\n\n${planCtx(t)}\n\n${PLAN_RULES}\n\n${PLAN_FMT}`,{signal:PL.ctl.signal,cache:false}));
  if(!arr(r.days).length)throw {code:'invalid_json'};plOf(tid).plan=plNorm(r,t);plOf(tid).at=Date.now();plSave()}
 catch(e){PL.err=plErr(e)}PL.busy='';PL.ctl=null;render()}
function plNorm(r,t){const ns=nightStay(t),days=arr(r.days).map(d0=>({date:String(d0.date||''),title:String(d0.title||''),area:String(d0.area||''),hotel:String(d0.hotel||''),items:arr(d0.items).map(i=>({time:String(i.time||''),title:String(i.title||''),detail:String(i.detail||''),move:String(i.move||''),q:String(i.q||i.title||''),booked:!!i.booked,cost:String(i.cost||'')}))}));
 days.forEach(x=>{if(ns[x.date])x.hotel=ns[x.date].name});const td=tDays(t),days2=td.length?days.filter(x=>td.includes(x.date)):days;days.length=0;days.push(...days2);days.sort((a,b)=>a.date.localeCompare(b.date));
 return {title:String(r.title||''),summary:String(r.summary||''),tips:arr(r.tips).map(String),days}}
async function plDay(i){const tid=oneT(),t=T(tid),P=plOf(tid),cur=P.plan&&P.plan.days[i];if(!cur||PL.busy)return;const ask=String(PL.ask[i]||'').trim();PL.busy='d'+i;PL.err='';render();
 const others=P.plan.days.map((x,j)=>j==i?'':`${x.date} ${x.title}：${x.items.map(y=>y.title).join('、')}`).filter(Boolean).join('\n');
 try{PL.ctl=new AbortController();const r=obj(await CLD.sample.json(`你是專業的旅遊行程規劃師。請重新安排 ${cur.date} 這一天的行程，${ask?'使用者的要求：'+ask:'給一個不同的建議（換掉大部分非已訂的點）'}。\n\n${planCtx(t)}\n\n其他天已經安排（不要重複這些地點）：\n${others}\n\n這一天目前的安排：${JSON.stringify(cur)}\n\n${PLAN_RULES}\n\n只回傳這一天，JSON 格式：{"date":"${cur.date}","title":"","area":"","hotel":"","items":[{"time":"","title":"","detail":"","move":"","q":"","booked":false,"cost":""}]}`,{signal:PL.ctl.signal,cache:false}));
  const nd=plNorm({days:[r]},t).days[0];if(!nd||!nd.items.length)throw {code:'invalid_json'};nd.date=cur.date;P.plan.days[i]=nd;PL.ask[i]='';plSave()}
 catch(e){PL.err=plErr(e)}PL.busy='';PL.ctl=null;render()}
async function plEdit(){const tid=oneT(),t=T(tid),P=plOf(tid),q=String(PL.edit||'').trim();if(!q||!P.plan||PL.busy)return;PL.busy='edit';PL.err='';render();
 try{PL.ctl=new AbortController();const r=obj(await CLD.sample.json(`你是專業的旅遊行程規劃師。使用者想修改已排好的行程：「${q}」\n\n${planCtx(t)}\n\n目前行程：${JSON.stringify(P.plan.days)}\n\n${PLAN_RULES}\n\n只回傳有變動的天（整天完整內容），JSON：{"summary":"一句話說明改了什麼","days":[{"date":"","title":"","area":"","hotel":"","items":[…]}]}`,{signal:PL.ctl.signal,cache:false}));
  const nd=plNorm({days:r.days},t).days;if(!nd.length)throw {code:'invalid_json'};nd.forEach(x=>{const j=P.plan.days.findIndex(y=>y.date==x.date);if(j>=0)P.plan.days[j]=x;else P.plan.days.push(x)});P.plan.days.sort((a,b)=>a.date.localeCompare(b.date));
  PL.edit='';plSave();tip(r.summary?String(r.summary).slice(0,40):'已修改')}
 catch(e){PL.err=plErr(e)}PL.busy='';PL.ctl=null;render()}
function plStop(){if(PL.ctl)PL.ctl.abort()}

/* ---------- 畫面 ---------- */
function vPlan(){const head=`<h2 class="sr">🗺 建議行程</h2>${tbar()}`;const tid=oneT();
 if(!tid){const L=[...liveT()].sort((a,b)=>(a.start||'').localeCompare(b.start||''));return head+`<div class="${CC}"><div class="font-bold mb-2">選擇要排行程的旅程</div>${L.map(t=>`<button type="button" class="adli w-full text-left" onclick="S.trip='${t.id}';render()"><span><b>${tIc(t.name)}${esc(t.name.replace(/^\d{6}/,''))}</b><br><span class="text-sm text-stone-500">${rng(t)}</span></span><span>›</span></button>`).join('')||'<div class="text-sm text-stone-500">還沒有即將出發的旅程，按右下角「上傳訂單」，或到「管理」建立旅程。</div>'}</div>`}
 const t=T(tid),P=plOf(tid),pr=P.prefs||{},pl=P.plan,noAi=!CLD.sample,b=PL.busy;
 const fld=(k,l,ph,v)=>`<div class="kvl mt-2">${l}</div><input class="${IN}" value="${esc(v!=null?v:pr[k]||'')}" placeholder="${esc(ph)}" oninput="plPref('${tid}','${k}',this.value)">`;
 const prefs=`<details class="${CC}" ${pl?'':'open'}><summary class="cursor-pointer font-bold">⚙️ 偏好設定${pl?'<span class="text-sm font-normal text-stone-500 ml-2">修改後可重新產生</span>':''}</summary>
  ${fld('who','同行者','例如：大人 2、小孩 2（6、9 歲）',pr.who||whoAuto(t))}
  <div class="kvl mt-2">步調</div><select class="${IN}" onchange="plPref('${tid}','pace',this.value)">${PACE.map(x=>`<option ${(pr.pace||'適中')==x?'selected':''}>${x}</option>`).join('')}</select>
  ${fld('must','想去／必去','例如：迪士尼、築地、看夜景')}${fld('avoid','不想去／要避開','例如：太多走路、爬山')}${fld('food','飲食','例如：想吃燒肉、不吃生食')}${fld('note','其他要求','例如：每天下午回飯店休息、預算中等')}
  <div class="text-xs text-stone-500 mt-2">已訂的航班、住宿、交通、門票會自動放進行程，不用另外填。</div></details>`;
 const gen=`<div class="flex gap-2 items-center flex-wrap mb-3">${pl?(PL.conf?`<button type="button" class="adyes" onclick="plGen()">確定重新產生整份</button><button type="button" class="${BT}" onclick="PL.conf=false;render()">取消</button>`:`<button type="button" class="${BT}" ${b||noAi?'disabled':''} onclick="PL.conf=true;render()">↻ 重新產生整份</button><button type="button" class="${BP}" ${PL.dl?'disabled':''} onclick="plPdf()">${PL.dl?'製作 PDF 中…':'📄 下載 PDF'}</button>${PL.delc?`<button type="button" class="adyes" onclick="plDel()">確定刪除整份行程</button><button type="button" class="${BT}" onclick="PL.delc=false;render()">取消</button>`:`<button type="button" class="${BD}" ${b?'disabled':''} onclick="PL.delc=true;render()">🗑 刪除行程</button>`}`):`<button type="button" class="${BP}" ${b||noAi?'disabled':''} onclick="plGen()">${b=='all'?'排行程中…':'✨ 產生建議行程'}</button>`}${b?`<button type="button" class="${BT}" onclick="plStop()">停止</button><span class="text-sm text-stone-500">${b=='all'?'整份行程約需 1–2 分鐘':'處理中…'}</span>`:''}</div>
  ${noAi&&CLD.st!='load'?'<div class="text-sm text-red-700 mb-2">這個畫面目前無法使用 Claude（需在 Claude 中開啟並允許使用）。</div>':''}${PL.err?`<div class="text-sm text-red-700 mb-2">${esc(PL.err)}</div>`:''}`;
 const pub=`<div class="${CC} plpub"><div class="min-w-0"><div class="font-bold">🌐 發佈成網頁</div><div class="text-sm text-stone-500">把${pl?'行程、':''}航班、住宿、交通時間做成網頁，下載成網頁檔後用 LINE 傳給同行的人，對方不用 Claude 帳號就能打開。</div><div class="text-xs text-stone-500 mt-1">🔒 不含個資：不放姓名、PNR、訂單編號、取票代碼和護照資料。</div></div><div class="plpubb"><button type="button" class="${BP}" ${PL.pub?'disabled':''} onclick="plPub()">${PL.pub?'製作中…':'⬇️ 下載網頁檔'}</button></div>
</div>`;
 if(!pl)return head+prefs+gen+pub;
 const outline=`<div class="${CC} plo"><div class="font-bold text-lg">${esc(pl.title||t.name.replace(/^\d{6}/,''))}</div>${pl.summary?`<p class="text-sm text-stone-600 mt-1">${esc(pl.summary)}</p>`:''}
  <div class="plol">${pl.days.map((x,i)=>`<button type="button" class="plor" onclick="document.getElementById('pld${i}').open=true;document.getElementById('pld${i}').scrollIntoView({behavior:'smooth',block:'start'})"><span class="plod"><b>D${i+1}</b>${d(x.date).slice(5)}<small>${wkd(x.date)}</small></span><span class="plot"><b>${esc(x.title)}</b><small>${esc(x.items.map(y=>y.title).join(' → '))}</small></span></button>`).join('')}</div>
  ${pl.tips.length?`<details class="mt-2"><summary class="cursor-pointer text-sm font-medium">💡 實用提醒（${pl.tips.length}）</summary><ul class="list-disc pl-5 text-sm text-stone-600 space-y-0.5 mt-1">${pl.tips.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></details>`:''}</div>`;
 const day=(x,i)=>`<details class="${CC} pld" id="pld${i}"><summary class="cursor-pointer"><div class="pldh"><span class="pldn">D${i+1}</span><div class="min-w-0"><div class="font-bold">${d(x.date).slice(5)}（${wkd(x.date)}）${esc(x.title)}</div><div class="text-sm text-stone-500">${[x.area,x.hotel?'🏨 '+x.hotel:''].filter(Boolean).map(esc).join('・')}</div></div></div></summary>
  <div class="pli">${x.items.map((y,j)=>`<div class="plit${y.booked?' bk':''}">${y.move?`<div class="plmv">↓ ${esc(y.move)}</div>`:''}<div class="plrow"><span class="pltm">${esc(y.time)}</span><div class="min-w-0 flex-1"><div class="font-medium">${esc(y.title)}${y.booked?'<span class="plbk">已預訂</span>':''}</div>${y.detail?`<div class="text-sm text-stone-600">${esc(y.detail)}</div>`:''}${y.cost?`<div class="text-xs text-stone-500">💴 ${esc(y.cost)}</div>`:''}</div>${y.q?`<a class="plmap" href="${esc(mapU(y.q))}" target="_blank" rel="noopener" aria-label="地圖">📍</a>`:''}${PL.idel==i+'-'+j?`<button type="button" class="adyes plx2" onclick="plItemDel(${i},${j})">刪除</button>`:`<button type="button" class="plx" aria-label="刪除這個項目" onclick="PL.idel='${i}-${j}';render()">✕</button>`}</div></div>`).join('')}</div>
  <div class="plre"><input class="${IN}" placeholder="想怎麼改這天？（可不填）" value="${esc(PL.ask[i]||'')}" oninput="PL.ask[${i}]=this.value"><button type="button" class="${BT}" ${b||noAi?'disabled':''} onclick="plDay(${i})">${b=='d'+i?'重排中…':'↻ 換一個建議'}</button></div></details>`;
 const edit=`<div class="${CC}"><div class="font-bold">💬 用一句話修改行程</div><textarea class="${IN} adta mt-2" rows="2" placeholder="例如：第三天改去迪士尼、每天晚餐都排燒肉、最後一天早上留給購物" oninput="PL.edit=this.value">${esc(PL.edit)}</textarea><div class="mt-2"><button type="button" class="${BP}" ${b||noAi?'disabled':''} onclick="plEdit()">${b=='edit'?'修改中…':'送出'}</button></div></div>`;
 return head+gen+outline+pl.days.map(day).join('')+pub+edit+prefs}
VIEWS.plan=vPlan;

/* ---------- PDF：用 canvas 直接畫文字（各瀏覽器都可用）→ A4 JPEG 頁 → 自製 PDF ---------- */
function pdfBuild(pages){/* pages: [{jpg:Uint8Array,w,h}]，A4 595×842pt */
 const enc=new TextEncoder(),parts=[],offs=[];let len=0;const put=b=>{if(typeof b=='string')b=enc.encode(b);parts.push(b);len+=b.length};
 put('%PDF-1.4\n');const n=pages.length,obj=(i,body)=>{offs[i]=len;put(i+' 0 obj\n');body();put('\nendobj\n')};
 obj(1,()=>put('<< /Type /Catalog /Pages 2 0 R >>'));
 obj(2,()=>put('<< /Type /Pages /Count '+n+' /Kids ['+pages.map((p,i)=>(3+i*3)+' 0 R').join(' ')+'] >>'));
 pages.forEach((p,i)=>{const pg=3+i*3,ct=pg+1,im=pg+2,cmd='q 595 0 0 842 0 0 cm /Im0 Do Q';
  obj(pg,()=>put('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /XObject << /Im0 '+im+' 0 R >> >> /Contents '+ct+' 0 R >>'));
  obj(ct,()=>put('<< /Length '+cmd.length+' >>\nstream\n'+cmd+'\nendstream'));
  obj(im,()=>{put('<< /Type /XObject /Subtype /Image /Width '+p.w+' /Height '+p.h+' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length '+p.jpg.length+' >>\nstream\n');put(p.jpg);put('\nendstream')})});
 const xo=len,tot=3+n*3;put('xref\n0 '+tot+'\n0000000000 65535 f \n');for(let i=1;i<tot;i++)put(String(offs[i]).padStart(10,'0')+' 00000 n \n');
 put('trailer\n<< /Size '+tot+' /Root 1 0 R >>\nstartxref\n'+xo+'\n%%EOF');return new Blob(parts,{type:'application/pdf'})}
function plPages(t,pl){const PW=1240,PH=1754,M=96,CW=PW-2*M,FF='"PingFang TC","Heiti TC","Noto Sans CJK TC","Noto Sans TC","Microsoft JhengHei",sans-serif',GOLD='#146C72';
 const pages=[];let c,x,y;
 const newPg=()=>{c=document.createElement('canvas');c.width=PW;c.height=PH;x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,PW,PH);x.textBaseline='top';pages.push(c);y=M};
 const font=(sz,w)=>{x.font=(w||400)+' '+sz+'px '+FF};
 const wrap=(t,w)=>{const out=[];String(t||'').split('\n').forEach(par=>{let ln='';for(const ch of [...par]){if(x.measureText(ln+ch).width>w&&ln){out.push(ln);ln=ch.trim()?ch:''}else ln+=ch}out.push(ln)});return out};
 const lines=(t,sz,w,wt)=>{font(sz,wt);return wrap(t,w)};
 const fits=h=>y+h<=PH-M-30;
 const text=(t,px,sz,w,col,wt,lh)=>{font(sz,wt);x.fillStyle=col||'#222';const L=wrap(t,w);L.forEach(l=>{if(!fits(sz*(lh||1.5))){newPg()}x.fillText(l,px,y);y+=sz*(lh||1.5)});return L.length};
 const hr=(col,wd)=>{x.fillStyle=col||'#DCE6E6';x.fillRect(M,y,CW,wd||2)};
 const head=t=>{if(!fits(220))newPg();y+=18;text(t,M,30,CW,'#14363A',700);y+=4;hr(GOLD,4);y+=16};
 const rr=(px,py,w,h,r,col)=>{x.fillStyle=col;x.beginPath();x.moveTo(px+r,py);x.arcTo(px+w,py,px+w,py+h,r);x.arcTo(px+w,py+h,px,py+h,r);x.arcTo(px,py+h,px,py,r);x.arcTo(px,py,px+w,py,r);x.closePath();x.fill()};
 const P=plOf(t.id).prefs||{},ns=nightStay(t),hs=[...new Map(Object.values(ns).map(h=>[h.name,h])).values()];
 newPg();y=M+20;
 text('建議行程',M,26,CW,GOLD,700);y+=6;text(pl.title||t.name.replace(/^\d{6}/,''),M,58,CW,'#1c1c1c',800,1.3);y+=10;
 text(`${d(t.start)}（${wkd(t.start)}）– ${d(t.end)}（${wkd(t.end)}）・${tDays(t).length} 天`,M,28,CW,'#555');
 const who=P.who||whoAuto(t);if(who)text(who,M,28,CW,'#555');
 if(pl.summary){y+=14;text(pl.summary,M,28,CW,'#333')}
 const TD=tripData(t),kvp=(l,v,px,w)=>{if(!v)return;font(22);x.fillStyle='#777';if(!fits(36))newPg();x.fillText(l,px,y);font(24,700);x.fillStyle='#222';x.textAlign='right';x.fillText(v,px+w,y);x.textAlign='left';y+=36};
 if(TD.segs.length){head('航班資訊');TD.segs.forEach(({s,air,L})=>{if(!fits(220))newPg();
   text(`${s.dir||'航班'}・${wkF(s.date)}`,M,22,CW,GOLD,700);text(`${air} ${s.no}`,M,30,CW,'#1c1c1c',700,1.35);
   font(40,800);x.fillStyle='#222';x.fillText(s.dep||'—',M,y);x.textAlign='right';x.fillText(s.arr||'—',M+CW,y);x.textAlign='left';y+=52;font(22);x.fillStyle='#666';x.fillText(s.from||'',M,y);x.textAlign='right';x.fillText(s.to||'',M+CW,y);x.textAlign='left';y+=40;
   L.forEach(f=>{TD.pnrs(f).forEach(([p,ids])=>{kvp('訂位代碼 PNR',p,M,CW);text('旅客：'+whoN(ids),M,22,CW,'#444')});kvp('訂單編號',f.orderNo,M,CW)});y+=8;hr();y+=14})}
 if(TD.hg.length){head('飯店資訊');TD.hg.forEach(L=>{const h=L[0];if(!fits(220))newPg();
   text(`${wkF(h.cin)} → ${wkF(h.cout)}・${nights(h)} 晚`,M,22,CW,GOLD,700);text(h.zh||h.en,M,30,CW,'#1c1c1c',700,1.35);if(h.ori&&h.ori!=h.zh)text(h.ori,M,22,CW,'#666');if(h.en&&h.en!=h.zh)text(h.en,M,22,CW,'#666');if(h.addr)text('地址：'+h.addr,M,22,CW,'#444');
   L.forEach(o=>{kvp('訂單編號',o.orderNo,M,CW);o.rooms.forEach((r,ri)=>text(`${r.type||'房間 '+(ri+1)}${r.bf?'・含早餐':''}${r.members.length?'：'+whoN(r.members):''}`,M,22,CW,'#333'));if(o.cancelBy)text('免費取消至 '+d(o.cancelBy),M,22,CW,'#b4471f');if(!o.paid&&o.payDate)text('付款日 '+d(o.payDate),M,22,CW,'#b4471f')});y+=8;hr();y+=14})}
 if(TD.tr.length){head('交通與票券');TD.tr.forEach(o=>{if(!fits(160))newPg();const ttl=o.title||[o.type,o.company].filter(Boolean).join(' ');
   text(`${o.type||'訂單'}・${wkF(o.date)}${o.dep?' '+o.dep:''}`,M,22,CW,GOLD,700);text(ttl,M,28,CW,'#1c1c1c',700,1.35);if(o.from||o.to)text(`${o.from||'—'} → ${o.to||'—'}${o.arr?'（抵達 '+o.arr+'）':''}`,M,22,CW,'#444');
   kvp('代碼',o.code,M,CW);kvp('訂單編號',o.orderNo,M,CW);(o.lines||[]).forEach(l=>text('・'+l,M,22,CW,'#444'));y+=8;hr();y+=14})}
 head('每日行程');
 pl.days.forEach((dy,i)=>{if(!fits(420))newPg();else y+=18;
  const sub=[dy.area,dy.hotel?'住宿：'+dy.hotel:''].filter(Boolean).join('・'),tl=lines(`${d(dy.date)}（${wkd(dy.date)}）${dy.title}`,30,CW-150,700),sl=sub?lines(sub,23,CW-150):[],bh=24+tl.length*42+sl.length*34+20;
  rr(M,y,CW,bh,18,'#E6F0F0');rr(M+22,y+bh/2-26,96,52,26,GOLD);font(27,800);x.fillStyle='#fff';x.textAlign='center';x.fillText('D'+(i+1),M+70,y+bh/2-16);x.textAlign='left';
  const y0=y;y+=24;text(tl.join(''),M+140,30,CW-150,'#222',700,1.4);if(sub)text(sub,M+140,23,CW-150,'#666');y=y0+bh+12;
  if(dy.items.length){text('大綱',M,22,CW,GOLD,700);text(dy.items.map(z=>(z.time?z.time+' ':'')+z.title).join('  →  '),M,24,CW,'#333');y+=6;hr('#DCE6E6');y+=14}
  dy.items.forEach(z=>{const BW=CW-130,L=[lines(z.title+(z.booked?'　［已預訂］':''),26,BW,700),z.detail?lines(z.detail,24,BW):[],z.cost?lines('費用：'+z.cost,22,BW):[],z.q?lines('地圖搜尋：'+z.q,22,BW):[]],h=(z.move?36:0)+L[0].length*38+(L[1].length+L[2].length+L[3].length)*34+26;
   if(!fits(Math.min(h,400)))newPg();
   if(z.move){text('↓ '+z.move,M+130,22,BW,'#888')}
   const y1=y;if(z.booked){rr(M,y1-4,104,40,10,GOLD)}font(26,700);x.fillStyle=z.booked?'#fff':GOLD;x.textAlign=z.booked?'center':'left';x.fillText(z.time||'',z.booked?M+52:M,y1);x.textAlign='left';
   text(z.title+(z.booked?'　［已預訂］':''),M+130,26,BW,'#1c1c1c',700,1.45);if(z.detail)text(z.detail,M+130,24,BW,'#333');if(z.cost)text('費用：'+z.cost,M+130,22,BW,'#666');if(z.q)text('地圖搜尋：'+z.q,M+130,22,BW,'#888');
   y+=10;hr('#E8EFEF');y+=12})});
 if(pl.tips.length){head('注意事項・小提醒');pl.tips.forEach(tp=>{const L=lines(tp,25,CW-30);if(!fits(L.length*38))newPg();font(25);x.fillStyle=GOLD;x.fillText('•',M,y);text(tp,M+30,25,CW-30,'#333')})}
 pages.forEach((p,i)=>{const g=p.getContext('2d');g.font='400 20px '+FF;g.fillStyle='#999';g.textAlign='center';g.textBaseline='alphabetic';g.fillText((i+1)+' / '+pages.length,PW/2,PH-44);g.textAlign='left';g.fillText(t.name.replace(/^\d{6}/,'')+'・建議行程',M,PH-44)});
 return pages}
function pdfView(urls,name){let e=document.getElementById('pdfv');if(!e){e=document.createElement('div');e.id='pdfv';e.className='pdfv';document.body.appendChild(e)}
 e.innerHTML=`<div class="pdfvh"><span>無法直接下載，長按每頁圖片可儲存或分享</span><button type="button" onclick="document.getElementById('pdfv').remove()">關閉</button></div><div class="pdfvb">${urls.map((u,i)=>`<img src="${u}" alt="${esc(name)} 第 ${i+1} 頁">`).join('')}</div>`}
async function plPdf(){const tid=oneT(),t=T(tid),pl=plOf(tid).plan;if(!pl||PL.dl)return;PL.dl=1;render();let stage='layout',pages=[];
 try{await new Promise(r=>setTimeout(r,30));pages=plPages(t,pl);stage='encode';
  const out=[];for(const c of pages){const b=await toBlob(c,'image/jpeg',.85);if(!b)throw {code:'encode'};out.push({jpg:new Uint8Array(await b.arrayBuffer()),w:c.width,h:c.height})}
  const pdf=pdfBuild(out),name=t.name.replace(/^\d{6}/,'')+'-建議行程.pdf';stage='save';
  let dls=null;try{dls=await claude.use('downloads')}catch(e){}
  if(!dls){pdfView(pages.map(c=>c.toDataURL('image/jpeg',.85)),name);throw {code:'shown'}}
  try{await dls.save({filename:name,data:pdf});tip('PDF 已儲存')}
  catch(e){const k=e&&e.code;if(k=='declined')throw e;pdfView(pages.map(c=>c.toDataURL('image/jpeg',.85)),name);throw {code:'shown',why:k}}}
 catch(e){const k=e&&e.code;if(k!='declined'&&k!='shown')tip('PDF 製作失敗（'+stage+(k?'・'+k:'')+'），請再試一次');if(k=='shown')tip('這個畫面無法下載，已改成圖片顯示'+(e.why?'（'+e.why+'）':''))}
 PL.dl=null;render()}

/* ---------- 刪除建議行程／單一項目 ---------- */
function plDel(){const tid=oneT();if(!tid)return;plOf(tid).plan=null;PL.delc=false;PL.ask={};plSave();render();tip('已刪除建議行程')}
function plItemDel(i,j){const pl=plOf(oneT()).plan;if(!pl||!pl.days[i])return;pl.days[i].items.splice(j,1);PL.idel='';plSave();render()}

/* ---------- 一鍵發佈成網頁：產生獨立 HTML（不需 Claude，可離線、可放 GitHub Pages） ---------- */
/* 共用：整理一趟旅程要輸出的航班、住宿、交通（只取已採用、未取消） */
function tripData(t){const live=x=>x.status!='已取消';
 const fl=db.fl.filter(f=>f.trip==t.id&&live(f)&&okF(f)),ht=db.ht.filter(h=>h.trip==t.id&&live(h)&&okH(h)).sort(hSort);
 const tr=[...db.tr,...db.ot].filter(x=>x.trip==t.id&&live(x)&&okT(x)).sort((a,b)=>trKey(a).localeCompare(trKey(b)));
 const sm=new Map();fl.forEach(f=>f.segs.filter(s=>s.dir!='預期不飛').forEach(s=>{const k=[s.date,s.dep,s.no].join('|');if(!sm.has(k))sm.set(k,{s,air:s.airline||f.airline||'',L:[]});sm.get(k).L.push(f)}));
 const segs=[...sm.values()].sort((a,b)=>((a.s.date||'')+(a.s.dep||'')).localeCompare((b.s.date||'')+(b.s.dep||'')));
 const pnrs=f=>{const by=new Map();Object.keys(f.pax).filter(M).forEach(i=>{const p=(f.pp&&f.pp[i])||{},k=p.pnr||f.pnr||'';if(!by.has(k))by.set(k,[]);by.get(k).push(i)});return [...by]};
 return {segs,hg:grp(ht,hKey),tr,pnrs}}
const whoN=ids=>ids.map(M).filter(Boolean).map(m=>m.zh||[m.last,m.first].filter(Boolean).join(' ')).join('、');
const wkF=x=>x?`${d(x)}（${wkd(x)}）`:'';

/* 隨機配色：每次發佈挑一個色相，自動算出淺色／深色兩套 */
function pubPalette(){const H=[192,205,220,245,265,285,330,350,12,28,95,140,160,175][Math.floor(Math.random()*14)],c=(H+150+Math.floor(Math.random()*60))%360;
 const h=(hh,s,l)=>`hsl(${hh} ${s}% ${l}%)`;
 return {name:H,light:{bg:h(H,30,96),card:'#fff',ink:h(H,25,13),mut:h(H,12,40),line:h(H,22,88),acc:h(H,58,32),hd:h(H,52,20),hdt:h(H,30,92),hdm:h(H,25,78),tag:h(c,78,62),tagt:h(c,60,15)},
  dark:{bg:h(H,22,8),card:h(H,18,12),ink:h(H,15,93),mut:h(H,10,66),line:h(H,15,20),acc:h(H,55,66),hd:h(H,40,16),hdt:h(H,25,92),hdm:h(H,18,72),tag:h(c,70,64),tagt:h(c,60,12)}}}

function pubParts(t,safe){const e=esc,pl=plOf(t.id).plan,ns=nightStay(t),nm=t.name.replace(/^\d{6}/,''),ppl=people(t.id).map(M).filter(Boolean),{segs,hg,tr,pnrs}=tripData(t),C=pubPalette();
 const kv=(l,v)=>v&&!(safe&&/PNR|訂單編號|代碼/.test(l))?`<div class="kv"><span>${e(l)}</span><b>${e(v)}</b></div>`:'';
 const days=tDays(t),dayOf=x=>days.indexOf(x)+1;
 /* 1. 航班 */
 const flH=segs.map(({s,air,L})=>`<article class="card"><div class="ch"><span class="tag">${e(s.dir||'航班')}</span><span class="dt">${wkF(s.date)}</span></div><h3>${e(air)} ${e(s.no)}</h3>
  <div class="fly"><div><b>${e(s.dep||'—')}</b><small>${e(s.from)}</small></div><i aria-hidden="true">✈</i><div class="r"><b>${e(s.arr||'—')}</b><small>${e(s.to)}</small></div></div>
  ${L.map(f=>`<div class="sub">${pnrs(f).map(([p,ids])=>kv('訂位代碼 PNR',p)+`<div class="ppl">👤 ${e(whoN(ids))}</div>`).join('')}${kv('訂單編號',f.orderNo)}</div>`).join('')}</article>`).join('');
 /* 2. 飯店 */
 const htH=hg.map(L=>{const h=L[0],q=h.en||h.zh;return `<article class="card"><div class="ch"><span class="tag">${nights(h)} 晚</span><span class="dt">${wkF(h.cin)} → ${wkF(h.cout)}</span></div><h3>${e(h.zh||h.en)}</h3>${h.ori&&h.ori!=h.zh?`<div class="mut">${e(h.ori)}</div>`:''}${h.en&&h.en!=h.zh?`<div class="mut">${e(h.en)}</div>`:''}
  ${h.addr?`<div class="addr">📍 ${e(h.addr)}</div>`:''}<a class="btn" href="${e(h.map||mapU(q))}" target="_blank" rel="noopener">在 Google 地圖開啟</a>
  ${L.map(x=>`<div class="sub">${kv('訂單編號',x.orderNo)}${x.rooms.map((r,i)=>`<div class="room"><b>${e(r.type||'房間 '+(i+1))}</b>${r.bf?'・含早餐':''}${r.members.length?`<div class="ppl">👤 ${e(whoN(r.members))}</div>`:''}</div>`).join('')}${x.cancelBy?`<div class="warn">免費取消至 ${e(d(x.cancelBy))}</div>`:''}${!x.paid&&x.payDate?`<div class="warn">付款日 ${e(d(x.payDate))}</div>`:''}</div>`).join('')}</article>`}).join('');
 const trH=tr.map(x=>{const ttl=x.title||[x.type,x.company].filter(Boolean).join(' ');return `<article class="card"><div class="ch"><span class="tag">${e(x.type||'訂單')}</span><span class="dt">${wkF(x.date)}${x.dep?' '+e(x.dep):''}</span></div><h3>${e(ttl)}</h3>${x.title&&x.company?`<div class="mut">${e(x.company)}</div>`:''}
  ${x.from||x.to?`<div class="route">${e(x.from||'—')} → ${e(x.to||'—')}${x.arr?`<small>抵達 ${e(x.arr)}</small>`:''}</div>`:''}${kv('代碼',x.code)}${kv('訂單編號',x.orderNo)}
  ${(x.lines||[]).length?`<ul>${x.lines.map(l=>`<li>${e(l)}</li>`).join('')}</ul>`:''}${Object.keys(x.pax||{}).filter(M).length?`<div class="ppl">👤 ${e(whoN(Object.keys(x.pax).filter(M)))}</div>`:''}</article>`}).join('');
 /* 3. 每日行程：每天先大綱、再細節；預設折疊 */
 const dayL=pl?pl.days:days.map(x=>({date:x,title:ns[x]?ns[x].area||'':'',area:'',hotel:ns[x]?ns[x].name:'',items:[]}));
 const planH=`${pl&&pl.summary?`<p class="lead">${e(pl.summary)}</p>`:''}${dayL.map((x,i)=>`<details class="day" id="d${dayOf(x.date)||i+1}" data-date="${e(x.date)}"><summary><span class="dn">D${dayOf(x.date)||i+1}</span><span class="dsm"><b>${wkF(x.date)}${x.title?' '+e(x.title):''}</b>${x.items.length?`<span class="ol">${x.items.map(y=>e(y.title)).join('<i>→</i>')}</span>`:''}<small>${[x.area,x.hotel?'🏨 '+x.hotel:''].filter(Boolean).map(e).join('・')}</small></span><span class="chev" aria-hidden="true"></span></summary>
  <div class="dbody">${x.items.map(y=>`${y.move?`<div class="mv">↓ ${e(y.move)}</div>`:''}<div class="it${y.booked?' bk':''}"><span class="tm">${e(y.time)}</span><div><b>${e(y.title)}</b>${y.booked?'<em>已預訂</em>':''}${y.detail?`<p>${e(y.detail)}</p>`:''}${y.cost?`<small>💴 ${e(y.cost)}</small>`:''}</div>${y.q?`<a class="pin" href="${e(mapU(y.q))}" target="_blank" rel="noopener" aria-label="${e(y.title)} 地圖">📍</a>`:''}</div>`).join('')||'<p class="mut">這天還沒有安排細節。</p>'}</div></details>`).join('')}`;
 /* 4. 注意事項 */
 const tips=pl?pl.tips:[];const tipH=tips.length?`<article class="card"><ul class="tips">${tips.map(x=>`<li>${e(x)}</li>`).join('')}</ul></article>`:'';
 const secs=[['fl','✈️','航班資訊',flH,segs.length+' 段'],['ht','🏨','飯店資訊',htH,hg.length+' 間'],['tr','🚃','交通與票券',trH,tr.length+' 筆'],['plan','🗓','每日行程',planH,dayL.length+' 天'],['tips','💡','注意事項・小提醒',tipH,tips.length+' 則']].filter(s=>s[3]);
 /* 導覽儀表板 */
 const out=segs.find(x=>x.s.dir=='去程')||segs[0],back=[...segs].reverse().find(x=>x.s.dir=='回程')||(segs.length>1?segs[segs.length-1]:null);
 const fx=x=>x?`<b>${e(d(x.s.date).slice(5))} ${e(x.s.no)}</b><small>${e(x.s.dep||'')} ${e(apc(x.s.from)||x.s.from)} → ${e(apc(x.s.to)||x.s.to)}</small>`:'<small>—</small>';
 const nightsN=hg.reduce((a,L)=>a+nights(L[0]),0);
 const dash=`<nav class="jump" aria-label="各區">${secs.map(([k,ic,l,,c])=>`<a href="#${k}"><span>${ic}</span>${l}<small>${c}</small></a>`).join('')}</nav>`;
 const V=o=>Object.entries(o).map(([k,v])=>`--${k}:${v}`).join(';');
 const body=`<header><div class="w"><span class="brand">STOB</span><h1>${e(pl&&pl.title||nm)}</h1><p>${wkF(t.start)} – ${wkF(t.end)}・${days.length} 天</p>${ppl.length?`<p class="ppl">${e(whoN(ppl.map(m=>m.id)))}</p>`:''}</div></header>
<main>${dash}${secs.map(([k,ic,l,h])=>`<section id="${k}"><h2><span aria-hidden="true">${ic}</span>${l}</h2>${h}</section>`).join('')}</main>
<footer>更新於 ${d(new Date().toLocaleDateString('sv-SE'))}・由 STOB 旅遊訂單產生<br><button type="button" data-act="open">全部展開</button><button type="button" data-act="print">列印</button></footer>`;
 const pb=safe?body.replace(/<(p|div) class="ppl">[^<]*<\/\1>/g,'').replace(/<div class="sub"><\/div>/g,''):body;
 return {C,nm,title:(pl&&pl.title)||nm,short:pubShort(nm),body:pb}}
const pubShort=nm=>{nm=String(nm||'行程').replace(/\s+/g,'');return nm.length<=4?nm+'行程':nm.slice(0,6)};
const PUB_ACT="document.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('[data-act]');if(!b)return;document.querySelectorAll('details.day').forEach(function(x){x.open=true});if(b.getAttribute('data-act')=='print')print()});";
/* 主畫面圖示：用網頁的配色＋旅程名稱前兩字（檢視頁 v.js 也用同樣畫法） */
function pubIcon(P){try{const c=document.createElement('canvas');c.width=c.height=180;const x=c.getContext('2d');x.fillStyle=P.C.light.hd;x.fillRect(0,0,180,180);x.fillStyle=P.C.light.tag;x.fillRect(0,150,180,30);
 x.fillStyle='#fff';x.textAlign='center';x.textBaseline='middle';x.font='700 64px "PingFang TC","Noto Sans TC",sans-serif';x.fillText([...String(P.nm||'行程')].slice(0,2).join(''),90,80);
 x.fillStyle=P.C.light.tagt;x.font='700 16px sans-serif';x.fillText('STOB',90,165);return c.toDataURL('image/png')}catch(e){return ''}}
function pubDoc(P,icon){const e=esc,V=o=>Object.entries(o).map(([k,v])=>`--${k}:${v}`).join(';');
 return `<!DOCTYPE html><html lang="zh-Hant"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="robots" content="noindex,nofollow">
<meta name="apple-mobile-web-app-capable" content="yes"><meta name="mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-status-bar-style" content="black-translucent"><meta name="apple-mobile-web-app-title" content="${e(P.short)}">${icon?`<link rel="apple-touch-icon" href="${icon}"><link rel="icon" href="${icon}">`:''}
<meta name="theme-color" content="${P.C.light.hd}"><title>${e(P.title)}｜行程</title>
<style>:root{${V(P.C.light)}}@media (prefers-color-scheme:dark){:root{${V(P.C.dark)}}}
${PUB_CSS}
</style></head><body>${P.body}<script>${PUB_ACT}<\/script></body></html>`}
function pubHtml(t){const P=pubParts(t,true);return pubDoc(P,pubIcon(P))}


async function plPub(){const tid=oneT(),t=T(tid);if(!tid||PL.pub)return;PL.pub=1;render();
 try{const html=pubHtml(t),name=t.name.replace(/^\d{6}/,'')+'-行程網頁.html';let dls=null;try{dls=await claude.use('downloads')}catch(e){}
  if(!dls){cpText(html,'無法下載，已複製網頁原始碼');throw {code:'shown'}}
  await dls.save({filename:name,data:html});tip('網頁檔已儲存，可以直接傳給同行的人')}
 catch(e){const k=e&&e.code;if(k&&k!='declined'&&k!='shown'){try{cpText(pubHtml(t),'無法下載，已複製網頁原始碼')}catch(_){tip('發佈失敗（'+k+'）')}}}
 PL.pub=null;render()}
