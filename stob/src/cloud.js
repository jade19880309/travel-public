/* =====================================================================
   TOB 分享版：每個人的資料存在自己的雲端空間（data/users/<id>），
   上傳訂單截圖／PDF／確認信文字 → Claude 讀取 → 確認後存入
   ===================================================================== */
const CLD={db:null,user:null,uid:'',st:'load',msg:'',q:Promise.resolve(),timer:null,sample:null,lim:null,noWrite:false};
const ADS={tab:'trip',files:[],text:'',note:'',busy:false,ctl:null,res:null,err:'',edit:'',del:'',tf:null,mf:null,ai:'',aiRes:null,imp:'',impOk:false};
const KIND={fl:['✈️','機票'],ht:['🏨','飯店'],tr:['🚃','交通'],ot:['🎫','其他']};
const COLL=['fl','ht','tr','ot'];

/* ---------- 資料整理 ---------- */
function famCalc(){const m=new Map();db.members.forEach(x=>{const g=String(x.grp||'').trim();if(g){if(!m.has(g))m.set(g,[]);m.get(g).push(x.id)}});FAM=[...m]}
function campCalc(){CAMP=db.tr.filter(x=>x.camp&&x.camp.cin&&x.camp.cout).map(x=>{const k=campKind(x);return{id:'camp-'+x.id,ref:x.id,trip:x.trip,zh:x.camp.zh||x.title||k,area:x.camp.area||(k=='郵輪'?'郵輪':'移動住宿'),cin:x.camp.cin,cout:x.camp.cout,kind:k,ico:k=='郵輪'?'🚢':'🚐'}})}
const arr=v=>Array.isArray(v)?v:[];
const obj=v=>v&&typeof v=='object'&&!Array.isArray(v)?v:{};
const num=v=>{if(v===''||v==null)return '';const n=+String(v).replace(/[^\d.\-]/g,'');return isFinite(n)&&String(v).trim()!==''?n:''};
function normDb(o){o=obj(o);const b={members:arr(o.members),trips:arr(o.trips),fl:arr(o.fl),ht:arr(o.ht),tr:arr(o.tr),ot:arr(o.ot),imgs:arr(o.imgs),plans:obj(o.plans),rates:{...RATES0,...obj(o.rates)}};
 b.trips.forEach(t=>{t.curs=arr(t.curs)});
 b.fl.forEach(f=>{f.segs=arr(f.segs);f.pax=obj(f.pax);f.pp=obj(f.pp);f.status=f.status||'已確認';f.cur=f.cur||'TWD'});
 b.ht.forEach(h=>{h.rooms=arr(h.rooms);if(!h.rooms.length)h.rooms=[{type:'',beds:'',bf:false,price:'',members:[],note:''}];h.rooms.forEach(r=>{r.members=arr(r.members);if(r.price==null)r.price=''});h.status=h.status||'已確認';h.cur=h.cur||'TWD'});
 [...b.tr,...b.ot].forEach(x=>{x.pax=obj(x.pax);x.lines=arr(x.lines);if(!arr(x.pays).length)delete x.pays;x.status=x.status||'已確認';x.cur=x.cur||'TWD';delete x.slim});
 return b}
function applyDb(o){db=normDb(o);famCalc();campCalc()}

/* ---------- 雲端讀寫 ---------- */
const PART=60000;
const uref=k=>CLD.db.collection('data/users/'+CLD.uid).doc(k);
function cloudBadge(){const m={load:'讀取中…',ok:'',save:'儲存中…',err:'⚠ 未儲存',off:'⚠ 未登入'}[CLD.st]||'';return m?`<span class="cldb ${CLD.st}">${m}</span>`:''}
function badgeUpd(){const e=document.querySelector('.cldb');if(e||CLD.st!='ok')render()}
function cloudSave(){famCalc();campCalc();if(!CLD.db||!CLD.uid){CLD.st='off';return}CLD.st='save';badgeUpd();clearTimeout(CLD.timer);CLD.timer=setTimeout(cloudFlush,500)}
function cloudFlush(){const js=JSON.stringify(db),parts=[];for(let i=0;i<js.length;i+=PART)parts.push(js.slice(i,i+PART));if(!parts.length)parts.push('{}');
 CLD.q=CLD.q.then(async()=>{for(let i=1;i<parts.length;i++)await uref('tob_p'+i).set({s:parts[i]});await uref('tob').set({v:1,n:parts.length,t:Date.now(),s:parts[0]});CLD.st='ok';CLD.noWrite=false;render()})
 .catch(e=>{CLD.st='err';CLD.noWrite=e&&e.code=='invalid_argument';CLD.msg=e&&e.code=='quota_exceeded'?'雲端空間已滿，請刪除一些截圖或訂單。':CLD.noWrite?'你目前沒有儲存權限：請分享這個頁面的人把你設為「編輯者」。':'儲存失敗，請確認網路後再試一次（任何修改都會自動重試）。';render();tip(CLD.msg)})}
async function cloudLoad(){const s=await uref('tob').get();if(!s.exists){applyDb({});return}const o=s.data()||{};let js=String(o.s||'');
 for(let i=1;i<(+o.n||1);i++){const p=await uref('tob_p'+i).get();js+=p.exists?String((p.data()||{}).s||''):''}
 try{applyDb(JSON.parse(js||'{}'))}catch(e){applyDb({});CLD.msg='雲端資料無法讀取'}
 for(const k of db.imgs){try{const p=await uref('img_'+ikey(k)).get();if(p.exists)ORDIMG[k]=String((p.data()||{}).d||'')}catch(e){}}}
const ikey=k=>String(k).replace(/[^A-Za-z0-9_\-.~:@+]/g,'_').slice(0,150)||'x';
async function imgSave(k,dataUrl){if(!CLD.db||!k||!dataUrl)return;ORDIMG[k]=dataUrl;if(!db.imgs.includes(k))db.imgs.push(k);
 CLD.q=CLD.q.then(()=>uref('img_'+ikey(k)).set({k,d:dataUrl})).catch(()=>{delete ORDIMG[k];db.imgs=db.imgs.filter(x=>x!=k)})}
function imgDel(k){if(!k||!db.imgs.includes(k))return;delete ORDIMG[k];db.imgs=db.imgs.filter(x=>x!=k);if(CLD.db)CLD.q=CLD.q.then(()=>uref('img_'+ikey(k)).delete()).catch(()=>{})}

(async function boot(){
 if(!window.claude||!claude.use){CLD.st='off';CLD.msg='請在 Claude 裡開啟這個頁面。';render();return}
 const to=setTimeout(()=>{if(CLD.st=='load'){CLD.st='off';CLD.msg='讀不到雲端資料：請確認已登入 Claude、網路正常。';render()}},12000);
 try{const [dbx,us]=await Promise.all([claude.use('db'),claude.use('user')]);CLD.db=dbx;CLD.user=us;CLD.uid=us?await us.id():'';
  if(!dbx||!CLD.uid){clearTimeout(to);CLD.st='off';CLD.msg='請先登入 Claude，才能儲存你自己的訂單。';render();return}
  await cloudLoad();clearTimeout(to);CLD.st='ok';route()}
 catch(e){clearTimeout(to);CLD.st='off';CLD.msg='雲端資料讀取失敗，請重新整理頁面。';render()}
 try{CLD.sample=await claude.use('sample');if(CLD.sample)CLD.lim=await CLD.sample.limits().catch(()=>null)}catch(e){CLD.sample=null}
 if(S.v=='add')render()})();

/* 首頁：沒有旅程時的引導 */
{const _home=VIEWS.home;VIEWS.home=()=>{const warn=CLD.st=='off'||CLD.st=='err'?`<div class="${CC} cldw">${esc(CLD.msg||'目前無法使用雲端資料')}</div>`:'';
 if(db.trips.length)return warn+_home();
 return warn+(CLD.st=='load'?`<div class="${CC} text-stone-500">讀取你的訂單中…</div>`:`<div class="${CC} adhero"><h3>出發前，訂單一目了然</h3><p class="text-sm text-stone-600">機票、飯店、交通、門票都整理在同一個地方。資料只存在你自己的帳號，其他人看不到。</p>
 <ol class="adsteps"><li><b>1</b><span><em>上傳訂單</em>截圖、PDF 或確認信文字都可以</span></li><li><b>2</b><span><em>確認後存入</em>Claude 讀出旅程、旅客和訂單，你看過再存</span></li><li><b>3</b><span><em>隨時查看</em>清單、未付款、店家報到、每人行程單和建議行程</span></li></ol>
 <button type="button" class="${BP}" onclick="go('up')">上傳第一筆訂單</button></div>`)}}

/* ---------- 新增頁 ---------- */
const adTabs=[['trip','旅程'],['mem','成員'],['ord','訂單'],['bk','備份']];
function adGo(t){ADS.tab=t;ADS.edit='';ADS.del='';render()}
const ttlOf=(k,x)=>k=='fl'?((x.airline||'機票')+' '+(x.segs||[]).map(s=>s.no).filter(Boolean).join('・')):k=='ht'?(x.zh||x.en||'飯店'):(x.title||[x.type,x.company].filter(Boolean).join(' ')||KIND[k][1]);
const dateOf=(k,x)=>k=='fl'?((x.segs||[])[0]||{}).date||'':k=='ht'?x.cin||'':x.date||'';
function vAdd(){const tabs=`<div class="xchips adtabs">${adTabs.map(([k,l])=>`<button type="button" class="xchip${ADS.tab==k?' on':''}" onclick="adGo('${k}')">${l}</button>`).join('')}</div>`;
 const warn=(CLD.st=='off'||CLD.st=='err')&&CLD.msg?`<div class="${CC} cldw">${esc(CLD.msg)}</div>`:'';
 const body=({trip:adTrip,mem:adMem,ord:adOrd,bk:adBk}[ADS.tab]||adTrip)();
 return `<h2 class="sr">⚙️ 管理</h2>${warn}${adAiBox()}${tabs}${body}`}
VIEWS.add=vAdd;
/* 上傳訂單：獨立頁面，右下角固定按鈕隨時可進入 */
function vUp(){const warn=(CLD.st=='off'||CLD.st=='err')&&CLD.msg?`<div class="${CC} cldw">${esc(CLD.msg)}</div>`:'';return `<h2 class="sr">📸 上傳訂單</h2>${warn}${adUp()}`}
VIEWS.up=vUp;
function fabUpd(){let b=document.getElementById('upfab');if(!b){b=document.createElement('button');b.id='upfab';b.type='button';b.className='upfab';b.innerHTML='<span aria-hidden="true">＋</span>上傳訂單';b.onclick=()=>{ADS.res=ADS.res;go('up')};document.body.appendChild(b)}
 b.hidden=S.v=='up'||inCi()||!!document.getElementById('pdfv')}
{const _r=render;render=function(k){_r(k);try{fabUpd()}catch(e){}}}

/* ===== 上傳訂單 ===== */
function adUp(){if(ADS.res)return adPreview();
 const img=CLD.lim&&CLD.lim.images,noAi=!CLD.sample;
 const files=ADS.files.map((f,i)=>`<div class="adf"><span>${f.kind=='pdf'?'📄':'🖼'} ${esc(f.name)}</span><button type="button" class="adx" aria-label="移除" onclick="adRm(${i})">✕</button></div>`).join('');
 return `<div class="${CC}"><div class="font-bold text-lg">📸 上傳訂單</div><p class="text-sm text-stone-500 mb-2">可一次選多張：訂單截圖、PDF、或下面貼上確認信文字。Claude 會讀出旅程、旅客、航班／飯店／交通資料，你確認後才存入。</p>
 ${noAi?`<div class="text-sm text-red-700 mb-2">${CLD.st=='load'?'準備中…':'這個畫面目前無法使用 Claude 自動讀取（需在 Claude 中開啟並允許使用）。'}</div>`:''}
 <label class="adpick${img?'':' dis'}"><input type="file" multiple accept="image/*,application/pdf" onchange="adFiles(this.files);this.value=''" ${img?'':'disabled'}><span>＋ 選擇截圖或 PDF</span></label>
 ${img?'':`<div class="text-xs text-stone-500 mt-1">${CLD.st=='load'?'':'這個畫面無法傳送圖片給 Claude，可改用貼上文字。'}</div>`}
 ${files?`<div class="mt-2">${files}</div>`:''}
 <div class="kvl mt-3">或貼上確認信文字</div><textarea id="adtx" class="${IN} adta" rows="4" placeholder="把訂單確認 email 的內容整段貼上" oninput="ADS.text=this.value">${esc(ADS.text)}</textarea>
 <div class="kvl mt-2">補充說明（可不填）</div><input id="adnt" class="${IN}" placeholder="例如：這是 7 月東京家族旅行、兩間房各住誰" value="${esc(ADS.note)}" oninput="ADS.note=this.value">
 <div class="flex gap-2 mt-3 items-center flex-wrap"><button type="button" class="${BP}" ${ADS.busy||noAi?'disabled':''} onclick="adRun()">${ADS.busy?'讀取中…':'✨ 自動讀取'}</button>${ADS.busy?`<button type="button" class="${BT}" onclick="adStop()">停止</button><span class="text-sm text-stone-500">通常需要 20–90 秒</span>`:''}</div>
 ${ADS.err?`<div class="text-sm text-red-700 mt-2">${esc(ADS.err)}</div>`:''}</div>
`}
function adRm(i){ADS.files.splice(i,1);render()}
async function adFiles(fl){const L=[...fl];for(const f of L){if(/pdf$/i.test(f.type)||/\.pdf$/i.test(f.name))ADS.files.push({kind:'pdf',name:f.name,file:f});else if(/^image\//.test(f.type))ADS.files.push({kind:'img',name:f.name,file:f})}render()}
function adStop(){if(ADS.ctl)ADS.ctl.abort()}

/* 圖片處理：送給 Claude 的大圖（JPEG）＋ 存在雲端的訂單截圖（WebP，壓到 180KB 內） */
function loadScr(src){return new Promise((ok,no)=>{const s=document.createElement('script');s.src=src;s.onload=ok;s.onerror=no;document.head.appendChild(s)})}
async function pdfLib(){if(window.pdfjsLib)return window.pdfjsLib;const B='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/';await loadScr(B+'pdf.min.js');await loadScr(B+'pdf.worker.min.js');window.pdfjsLib.GlobalWorkerOptions.workerSrc=B+'pdf.worker.min.js';return window.pdfjsLib}
async function pdfPages(file,max){const lib=await pdfLib(),doc=await lib.getDocument({data:await file.arrayBuffer()}).promise,out=[];
 for(let p=1;p<=Math.min(doc.numPages,max);p++){const pg=await doc.getPage(p),vp=pg.getViewport({scale:2}),c=document.createElement('canvas');c.width=vp.width;c.height=vp.height;await pg.render({canvasContext:c.getContext('2d'),viewport:vp}).promise;out.push(c)}return out}
function fileCanvas(file){return new Promise((ok,no)=>{const u=URL.createObjectURL(file),im=new Image();im.onload=()=>{const c=document.createElement('canvas');c.width=im.naturalWidth;c.height=im.naturalHeight;c.getContext('2d').drawImage(im,0,0);URL.revokeObjectURL(u);ok(c)};im.onerror=()=>{URL.revokeObjectURL(u);no(new Error('img'))};im.src=u})}
function scaled(c,max){const k=Math.min(1,max/Math.max(c.width,c.height));if(k>=1)return c;const o=document.createElement('canvas');o.width=Math.round(c.width*k);o.height=Math.round(c.height*k);const x=o.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,o.width,o.height);x.drawImage(c,0,0,o.width,o.height);return o}
const toBlob=(c,t,q)=>new Promise(ok=>c.toBlob(ok,t,q));
function thumb(c){for(const [m,q] of [[1100,.6],[900,.5],[720,.45],[560,.4]]){const u=scaled(c,m).toDataURL('image/webp',q);if(u.length<185000)return u}return ''}

const AI_RULES=`你是旅遊訂單整理助手。從使用者提供的訂單截圖、PDF 或確認信文字中，抽出訂單資料，整理成下面格式的 JSON（只回傳 JSON）。

規則：
- 日期一律 YYYY-MM-DD，時間 HH:MM（24 小時制，當地時間）。金額是數字、不加逗號；幣別用 ISO 代碼（TWD JPY KRW HKD CNY USD EUR THB MOP…）。
- 看不到的欄位填空字串，不要猜、不要編造。不要記錄完整信用卡號（最多末四碼）。
- 一個訂單編號一筆訂單；同一筆來回機票放在同一筆的 segs 裡。
- note 用繁體中文，重點以「・」分隔：付款方式、取消規則、早餐、注意事項等。
- 旅客：若和「現有成員」是同一人（比對英文姓名或中文名），用他的 id；否則在 members 新增，ref 用 "p1"、"p2"…。英文姓名分成 last（姓）和 first（名），全大寫、照護照拼法。
- 旅程：若訂單日期落在「現有旅程」期間（或補充說明有指定），trip 用那個旅程的 id；否則在 trips 新增，ref 用 "new1"…，name 用「國家／城市」簡短命名（例如「日本東京」），start/end 依訂單推算。
- img：這筆訂單出現在第幾張圖片（從 0 開始的陣列），沒有圖片就給 []。

JSON 格式：
{
 "summary": "一句話說明讀到什麼",
 "questions": ["看不清楚或需要使用者確認的地方（沒有就給空陣列）"],
 "trips": [{"ref":"new1","name":"日本東京","start":"","end":"","note":"6天5夜","curs":["JPY"]}],
 "members": [{"ref":"p1","zh":"中文姓名","last":"WANG","first":"XIAOMING","sex":"M 或 F","dob":"","pp":"護照號碼","ppExp":"護照效期","grp":""}],
 "orders": [
  {"kind":"fl","trip":"","img":[0],"platform":"訂票網站","orderNo":"","airline":"中文名 English Name","pnr":"","ticketNo":"","status":"已確認","paid":true,"cur":"TWD","total":0,"note":"",
   "segs":[{"dir":"去程 / 回程 / 其他","airline":"","no":"BR184","date":"","dep":"","arr":"","from":"桃園 TPE T2","to":"成田 NRT T1"}],
   "pax":{"成員id或ref":"該旅客票價或空字串"},"pp":{"成員id或ref":{"pnr":"","tkt":"機票號碼","kind":"成人 / 兒童 / 嬰兒","note":""}}},
  {"kind":"ht","trip":"","img":[1],"zh":"飯店中文名","en":"English name","ori":"當地語言原名","addr":"","area":"城市・區域","platform":"","orderNo":"","cin":"","cout":"","status":"已確認","paid":false,"free":true,"cancelBy":"免費取消截止日","payDate":"付款／扣款日","rep":"訂房代表人 id或ref","cur":"JPY","total":0,"note":"",
   "rooms":[{"type":"房型","beds":"","bf":false,"price":"","members":["id或ref"],"note":""}]},
  {"kind":"tr","trip":"","img":[],"type":"高鐵 / 火車 / 巴士 / 渡輪 / 租車 / 接送 / 露營車 / 郵輪…","company":"","title":"簡短標題","platform":"","orderNo":"","code":"取票或預約代碼","no":"車次班次","date":"","dep":"","arr":"","from":"","to":"","status":"已確認","paid":false,"cur":"","total":0,"pax":{"id或ref":""},"note":"","lines":["取車／還車等重點，一行一點"],
   "pays":[{"l":"訂金 / 尾款","d":"付款期限","amt":0,"paid":"已付日期或空字串","url":""}],"camp":{"cin":"","cout":"","zh":""}},
  {"kind":"ot","trip":"","img":[],"type":"門票 / 餐廳 / 保險 / 網卡 / 其他","title":"","company":"","platform":"","orderNo":"","code":"","date":"","dep":"","status":"已確認","paid":true,"cur":"","total":0,"pax":{},"note":""}
 ]
}
（tr 的 pays 只有分期付款才填。露營車、郵輪這類「交通兼住宿」的訂單：kind 用 "tr"，type 填 "露營車" 或 "郵輪"，並填 camp（cin＝上車／登船日、cout＝還車／下船日、zh＝顯示名稱，例如「MSC 榮耀號 郵輪」），lines 列出登船／下船港口與時間、停靠港、艙房；其他訂單省略 camp。status 只能是 已確認 / 待確認 / 已取消。）`;

function ctxTxt(){return '今天：'+new Date().toLocaleDateString('sv-SE')+'\n現有旅程：'+JSON.stringify(db.trips.map(t=>({id:t.id,name:t.name,start:t.start,end:t.end})))+'\n現有成員：'+JSON.stringify(db.members.map(m=>({id:m.id,zh:m.zh,last:m.last,first:m.first,grp:m.grp||''})))}
function errTxt(e){const c=e&&e.code;return c=='not_granted'?'沒有允許這個頁面使用 Claude，所以無法自動讀取。':c=='rate_limited'?'Claude 使用量暫時到上限，請稍後再試。':c=='image_rejected'?'有圖片無法讀取（太大或格式不支援），請換一張。':c=='invalid_json'?'Claude 回覆的格式不對，請再按一次。':c=='refused'?'Claude 無法處理這份內容。':c=='prompt_too_large'?'內容太多了，請分幾次上傳。':c=='session_expired'?'請重新登入 Claude。':c=='cancelled'?'':'讀取失敗，請再試一次。'}
async function adRun(){if(ADS.busy||!CLD.sample)return;const tx=ADS.text.trim();if(!ADS.files.length&&!tx){ADS.err='請先選擇截圖／PDF，或貼上確認信文字。';render();return}
 ADS.busy=true;ADS.err='';render();
 try{const cans=[];for(const f of ADS.files){if(f.kind=='pdf')cans.push(...await pdfPages(f.file,4));else cans.push(await fileCanvas(f.file))}
  const max=(CLD.lim&&CLD.lim.images&&CLD.lim.images.maxCount)||8;if(cans.length>max){ADS.err='一次最多 '+max+' 張（PDF 每頁算一張），請分批上傳。';ADS.busy=false;render();return}
  const blobs=[];for(const c of cans)blobs.push(await toBlob(scaled(c,1800),'image/jpeg',.88));
  const thumbs=cans.map(thumb);
  const prompt=AI_RULES+'\n\n'+ctxTxt()+(ADS.note.trim()?'\n使用者補充說明：'+ADS.note.trim():'')+(cans.length?'\n共有 '+cans.length+' 張圖片（依序為第 0、1、2…張）。':'')+(tx?'\n\n確認信文字：\n'+tx.slice(0,60000):'');
  ADS.ctl=new AbortController();
  const r=await CLD.sample.json(prompt,{images:blobs.length?blobs:undefined,signal:ADS.ctl.signal,modelTier:'default'});
  const o=obj(r);if(!arr(o.orders).length&&!arr(o.members).length&&!arr(o.trips).length){ADS.err='沒有讀到訂單資料，請確認圖片內容，或在補充說明寫清楚。';}
  else{ADS.res={o,thumbs,skip:{}};arr(o.orders).forEach(x=>{if(!x.trip||!(db.trips.some(t=>t.id==x.trip)||arr(o.trips).some(t=>t.ref==x.trip)))x.trip=(arr(o.trips)[0]||{}).ref||(db.trips[0]||{}).id||''})}}
 catch(e){ADS.err=errTxt(e)}
 ADS.busy=false;ADS.ctl=null;render()}

function adPreview(){const {o}=ADS.res,tr=arr(o.trips),ms=arr(o.members),os=arr(o.orders),sk=ADS.res.skip;
 const tOpts=v=>[...db.trips.map(t=>[t.id,t.name]),...tr.map(t=>[t.ref,'🆕 '+(t.name||'新旅程')])].map(([i,l])=>`<option value="${esc(i)}" ${i==v?'selected':''}>${esc(l)}</option>`).join('');
 const who=id=>{const m=M(id)||ms.find(x=>x.ref==id);return m?(m.zh||[m.last,m.first].filter(Boolean).join(' ')):''};
 const line=(x,i)=>{const k=KIND[x.kind]?x.kind:'ot',pp=[...new Set([...Object.keys(obj(x.pax)),...arr(x.rooms).flatMap(r=>arr(r.members))])].map(who).filter(Boolean),dt=dateOf(k,x),seg=k=='fl'?arr(x.segs).map(s=>`${s.date?d(s.date).slice(5):''} ${s.no||''} ${s.from||''}→${s.to||''}`).join('<br>'):'';
  return `<div class="adord${sk['o'+i]?' off':''}"><div class="flex items-start justify-between gap-2"><div class="min-w-0"><div class="font-bold">${KIND[k][0]} ${esc(ttlOf(k,x))}</div>
  <div class="text-sm text-stone-500">${[k=='ht'&&x.cin?d(x.cin)+'–'+d(x.cout).slice(5):dt?d(dt):'',x.orderNo?'訂單 '+esc(x.orderNo):'',num(x.total)!==''?esc(money(num(x.total),x.cur||'TWD')):''].filter(Boolean).join('・')}</div>
  ${seg?`<div class="text-sm">${seg}</div>`:''}${pp.length?`<div class="text-sm text-stone-600">👤 ${esc(pp.join('、'))}</div>`:''}${x.note?`<div class="text-xs text-stone-500 mt-1">${esc(String(x.note).slice(0,140))}</div>`:''}</div>
  <label class="text-sm whitespace-nowrap"><input type="checkbox" ${sk['o'+i]?'':'checked'} onchange="ADS.res.skip['o${i}']=!this.checked;render()"> 存入</label></div>
  <select class="${IN} mt-2" onchange="ADS.res.o.orders[${i}].trip=this.value">${tOpts(x.trip)}</select></div>`};
 return `<div class="${CC}"><div class="font-bold text-lg">✨ 讀到的內容</div>${o.summary?`<p class="text-sm mt-1">${esc(o.summary)}</p>`:''}
 ${arr(o.questions).length?`<div class="adq"><div class="font-medium text-sm">請確認</div><ul class="list-disc pl-5 text-sm">${o.questions.map(q=>`<li>${esc(q)}</li>`).join('')}</ul></div>`:''}
 ${tr.length?`<div class="kvl mt-3">新旅程</div>${tr.map((t,i)=>`<div class="adrow"><input class="${IN}" value="${esc(t.name||'')}" oninput="ADS.res.o.trips[${i}].name=this.value"><input type="date" class="${IN}" value="${esc(t.start||'')}" oninput="ADS.res.o.trips[${i}].start=this.value"><input type="date" class="${IN}" value="${esc(t.end||'')}" oninput="ADS.res.o.trips[${i}].end=this.value"></div>`).join('')}`:''}
 ${ms.length?`<div class="kvl mt-3">新成員</div>${ms.map((m,i)=>`<label class="adm${sk['m'+i]?' off':''}"><input type="checkbox" ${sk['m'+i]?'':'checked'} onchange="ADS.res.skip['m${i}']=!this.checked;render()"> <b>${esc(m.zh||'')}</b> ${esc([m.last,m.first].filter(Boolean).join(' / '))}${m.pp?' ・護照 '+esc(m.pp):''}</label>`).join('')}`:''}
 ${os.length?`<div class="kvl mt-3">訂單（${os.length}）</div>${os.map(line).join('')}`:''}
 <div class="flex gap-2 mt-3 flex-wrap"><button type="button" class="${BP}" onclick="adApply()">✅ 存入</button><button type="button" class="${BT}" onclick="ADS.res=null;render()">← 回上一步</button><button type="button" class="${BD}" onclick="adDiscard()">放棄</button></div>
 <p class="text-xs text-stone-500 mt-2">存入後仍可在「訂單管理」修改或刪除，也可以用下方「用一句話修改」。</p></div>`}
function adDiscard(){ADS.res=null;ADS.files=[];ADS.text='';ADS.note='';ADS.err='';render()}

function adApply(){const {o,thumbs,skip}=ADS.res,map={},newT=[];
 arr(o.trips).forEach(t=>{const id='t'+uid(),st=t.start||'',nm=String(t.name||'新旅程').trim();map[t.ref]=id;newT.push({id,name:(st?st.slice(0,4)+st.slice(5,7):'')+nm.replace(/^\d{6}/,''),start:st,end:t.end||st,note:t.note||'',curs:arr(t.curs).filter(c=>c!='TWD')})});
 arr(o.members).forEach((m,i)=>{if(skip['m'+i])return;const id='m'+uid();map[m.ref]=id;db.members.push({id,zh:m.zh||'',last:String(m.last||'').toUpperCase(),first:String(m.first||'').toUpperCase(),sex:/^f/i.test(m.sex)?'F':/^m/i.test(m.sex)?'M':'',dob:m.dob||'',pp:m.pp||'',ppExp:m.ppExp||'',nat:m.nat||'',grp:m.grp||'',note:''})});
 const P=v=>map[v]||(db.members.some(m=>m.id==v)?v:'');
 const PO=x=>{const r={};Object.entries(obj(x)).forEach(([k,v])=>{const i=P(k);if(i)r[i]=v===''||v==null?'':(num(v)===''?v:num(v))});return r};
 let n=0,usedT=new Set();
 arr(o.orders).forEach((x,i)=>{if(skip['o'+i])return;const k=COLL.includes(x.kind)?x.kind:'ot',it={...x};delete it.kind;delete it.img;
  it.id=k+'-'+uid();it.trip=map[x.trip]||x.trip||'';usedT.add(it.trip);it.total=num(x.total);it.cur=x.cur||'TWD';it.status=x.status||'已確認';it.grp=x.grp||'';
  if(k=='fl'){it.segs=arr(x.segs).map(s=>({dir:s.dir||'',airline:s.airline||'',no:s.no||'',date:s.date||'',dep:s.dep||'',arr:s.arr||'',from:s.from||'',to:s.to||'',pnr:s.pnr||''}));it.pax=PO(x.pax);const pp={};Object.entries(obj(x.pp)).forEach(([kk,v])=>{const id=P(kk);if(id)pp[id]={pnr:v.pnr||x.pnr||'',tkt:v.tkt||'',kind:v.kind||'',note:v.note||''}});Object.keys(it.pax).forEach(id=>{if(!pp[id])pp[id]={pnr:x.pnr||'',tkt:'',kind:'',note:''}});it.pp=pp;it.paid=x.paid!==false}
  else if(k=='ht'){it.rooms=arr(x.rooms).map(r=>({type:r.type||'',beds:r.beds||'',bf:!!r.bf,price:num(r.price),members:arr(r.members).map(P).filter(Boolean),note:r.note||''}));it.rep=P(x.rep);it.paid=!!x.paid;it.free=!!x.free;it.map=x.map||''}
  else{it.pax=PO(x.pax);it.paid=!!x.paid;it.lines=arr(x.lines);if(arr(x.pays).length)it.pays=x.pays.map(q=>({l:q.l||'付款',d:q.d||'',amt:num(q.amt)||0,paid:q.paid||'',url:q.url||''}));else delete it.pays;if(!(x.camp&&x.camp.cin))delete it.camp}
  db[k].push(it);n++;
  const im=arr(x.img).map(Number).find(j=>thumbs[j]);if(im!=null&&it.orderNo&&!ORDIMG[it.orderNo])imgSave(String(it.orderNo),thumbs[im])});
 newT.filter(t=>usedT.has(t.id)||!arr(o.orders).length).forEach(t=>db.trips.push(t));
 /* 旅程日期自動涵蓋訂單 */
 db.trips.forEach(t=>{const ds=[...db.fl.filter(f=>f.trip==t.id).flatMap(f=>f.segs.map(s=>s.date)),...db.ht.filter(h=>h.trip==t.id).flatMap(h=>[h.cin,h.cout]),...[...db.tr,...db.ot].filter(x=>x.trip==t.id).map(x=>x.date)].filter(Boolean).sort();if(ds.length){if(!t.start||ds[0]<t.start)t.start=ds[0];if(!t.end||ds[ds.length-1]>t.end)t.end=ds[ds.length-1]}
  const cs=new Set(t.curs||[]);[...db.fl,...db.ht,...db.tr,...db.ot].filter(x=>x.trip==t.id&&x.cur&&x.cur!='TWD').forEach(x=>cs.add(x.cur));t.curs=[...cs]});
 adDiscard();cloudSave();tip('已存入 '+n+' 筆訂單');go('home')}

/* ===== 用一句話修改（交給 Claude） ===== */
function adAiBox(){if(!CLD.sample||!db.trips.length&&!db.members.length)return '';const r=ADS.aiRes;
 return `<div class="${CC}"><div class="font-bold">💬 用一句話修改</div><p class="text-sm text-stone-500 mb-2">例如「京都那間飯店改成已付款」「把小明加到東京所有訂單」「旅程改名叫北海道親子遊」。</p>
 <textarea class="${IN} adta" rows="2" oninput="ADS.ai=this.value" placeholder="想改什麼？">${esc(ADS.ai)}</textarea>
 <div class="flex gap-2 mt-2"><button type="button" class="${BP}" ${ADS.busy?'disabled':''} onclick="aiEdit()">${ADS.busy?'處理中…':'送出'}</button>${ADS.busy?`<button type="button" class="${BT}" onclick="adStop()">停止</button>`:''}</div>
 ${r?`<div class="adq mt-2"><div class="text-sm">${esc(r.summary||'')}</div><div class="text-xs text-stone-500">共 ${arr(r.ops).length} 項變更</div>${arr(r.ops).length?`<div class="flex gap-2 mt-2"><button type="button" class="${BP}" onclick="aiApply()">套用</button><button type="button" class="${BT}" onclick="ADS.aiRes=null;render()">取消</button></div>`:''}</div>`:''}
 ${ADS.aiErr?`<div class="text-sm text-red-700 mt-2">${esc(ADS.aiErr)}</div>`:''}</div>`}
async function aiEdit(){const q=ADS.ai.trim();if(!q||ADS.busy)return;ADS.busy=true;ADS.aiErr='';ADS.aiRes=null;render();
 const data={members:db.members,trips:db.trips,fl:db.fl,ht:db.ht,tr:db.tr,ot:db.ot};
 const p=`你在幫忙修改一份旅遊訂單資料（JSON）。依照使用者的要求，回傳要做的變更，只回傳 JSON：
{"summary":"用繁體中文一句話說明會改什麼（如果不清楚要改哪一筆，說明原因並給空的 ops）","ops":[
 {"op":"set","coll":"members|trips|fl|ht|tr|ot","id":"項目 id","patch":{"欄位":"新值"}},
 {"op":"add","coll":"…","item":{…完整新項目，不用給 id…}},
 {"op":"del","coll":"…","id":"…"}]}
patch 只放要改的欄位（陣列欄位要給完整的新陣列）。不要改動使用者沒提到的資料。日期 YYYY-MM-DD，金額用數字。

今天：${new Date().toLocaleDateString('sv-SE')}
使用者要求：${q}

目前資料：
${JSON.stringify(data).slice(0,200000)}`;
 try{ADS.ctl=new AbortController();const r=await CLD.sample.json(p,{signal:ADS.ctl.signal,cache:false});ADS.aiRes={summary:String(obj(r).summary||''),ops:arr(obj(r).ops)}}catch(e){ADS.aiErr=errTxt(e)}
 ADS.busy=false;ADS.ctl=null;render()}
function aiApply(){const ops=arr((ADS.aiRes||{}).ops);let n=0;const K=['members','trips',...COLL];
 ops.forEach(o=>{const L=db[o.coll];if(!K.includes(o.coll)||!L)return;
  if(o.op=='set'){const x=L.find(y=>y.id==o.id);if(x&&o.patch){Object.assign(x,obj(o.patch));x.id=o.id;n++}}
  else if(o.op=='add'&&o.item){const pre={members:'m',trips:'t'}[o.coll]||o.coll+'-';L.push({...obj(o.item),id:pre+uid()});n++}
  else if(o.op=='del'){const i=L.findIndex(y=>y.id==o.id);if(i>=0){if(COLL.includes(o.coll))imgDel(L[i].orderNo);L.splice(i,1);n++}}});
 applyDb(db);ADS.aiRes=null;ADS.ai='';cloudSave();tip('已套用 '+n+' 項變更');render()}

/* ===== 旅程 ===== */
function adTrip(){const f=ADS.tf;
 const form=f?`<div class="${CC}"><div class="font-bold mb-2">${f.id?'編輯旅程':'新增旅程'}</div>
  <div class="kvl">名稱</div><input class="${IN}" id="tf_name" value="${esc((f.name||'').replace(/^\d{6}/,''))}" placeholder="例如：日本東京">
  <div class="adrow mt-2"><div><div class="kvl">出發</div><input type="date" class="${IN}" id="tf_start" value="${esc(f.start||'')}"></div><div><div class="kvl">回程</div><input type="date" class="${IN}" id="tf_end" value="${esc(f.end||'')}"></div></div>
  <div class="kvl mt-2">備註</div><input class="${IN}" id="tf_note" value="${esc(f.note||'')}" placeholder="例如：6天5夜">
  <div class="kvl mt-2">外幣（逗號分隔）</div><input class="${IN}" id="tf_curs" value="${esc((f.curs||[]).join(','))}" placeholder="JPY">
  <div class="kvl mt-2">旅程網頁連結（可不填）</div><input class="${IN}" id="tf_web" value="${esc(f.web||'')}" placeholder="https://">
  <label class="adck"><input type="checkbox" id="tf_fam" ${f.fam?'checked':''}><span>住宿費用按「分組」平均分攤</span></label>
  <label class="adck"><input type="checkbox" id="tf_ns" ${f.nosplit?'checked':''}><span>交通費用依每人金額計算（不按分組平分）</span></label>
  <div class="flex gap-2 mt-3"><button type="button" class="${BP}" onclick="tripSave()">儲存</button><button type="button" class="${BT}" onclick="ADS.tf=null;render()">取消</button></div></div>`:'';
 const list=[...db.trips].sort((a,b)=>(a.start||'').localeCompare(b.start||'')).map(t=>{const c=[...db.fl,...db.ht,...db.tr,...db.ot].filter(x=>x.trip==t.id).length;
  return `<div class="adli"><div class="min-w-0"><div class="font-medium">${esc(t.name.replace(/^\d{6}/,''))}</div><div class="text-sm text-stone-500">${rng(t)}・${c} 筆訂單</div></div><div class="flex gap-1 shrink-0"><button type="button" class="${BT}" onclick="ADS.tf=JSON.parse(JSON.stringify(db.trips.find(x=>x.id=='${t.id}')));render()">編輯</button>${ADS.del=='t'+t.id?`<button type="button" class="adyes" onclick="tripDel('${t.id}')">確定刪除${c?'（含訂單）':''}</button>`:`<button type="button" class="${BD}" onclick="ADS.del='t${t.id}';render()">刪除</button>`}</div></div>`}).join('');
 return form+`<div class="${CC}"><div class="flex justify-between items-center mb-2"><div class="font-bold">旅程（${db.trips.length}）</div><button type="button" class="${BP}" onclick="ADS.tf={};render()">＋ 新增</button></div>${list||'<div class="text-sm text-stone-500">還沒有旅程。上傳訂單時會自動建立，也可以手動新增。</div>'}</div>`}
function tripSave(){const v=k=>(document.getElementById('tf_'+k)||{}).value||'',c=k=>!!(document.getElementById('tf_'+k)||{}).checked,nm=v('name').trim(),st=v('start');
 if(!nm){tip('請填旅程名稱');return}if(!st){tip('請填出發日期');return}
 const f=ADS.tf,t=f.id?db.trips.find(x=>x.id==f.id):{id:'t'+uid()};
 Object.assign(t,{name:st.slice(0,4)+st.slice(5,7)+nm,start:st,end:v('end')||st,note:v('note'),curs:v('curs').toUpperCase().split(/[,\s、，]+/).filter(x=>/^[A-Z]{3}$/.test(x)&&x!='TWD'),web:v('web').trim(),fam:c('fam')?1:0,nosplit:c('ns')?1:0});
 if(!f.id)db.trips.push(t);ADS.tf=null;cloudSave();render();tip('已儲存')}
function tripDel(id){db.trips=db.trips.filter(t=>t.id!=id);if(db.plans)delete db.plans[id];COLL.forEach(k=>{db[k].filter(x=>x.trip==id).forEach(x=>imgDel(x.orderNo));db[k]=db[k].filter(x=>x.trip!=id)});ADS.del='';if(S.trip==id)S.trip='';if(S.ct==id)S.ct='';cloudSave();render();tip('已刪除')}

/* ===== 成員 ===== */
const MF=[['zh','中文姓名',''],['last','英文姓 Surname','WANG'],['first','英文名 Given name','XIAOMING'],['dob','生日','','date'],['pp','護照號碼',''],['ppExp','護照效期','','date'],['grp','分組（同一家人填一樣）','例如：第1組｜王家']];
function adMem(){const f=ADS.mf;
 const form=f?`<div class="${CC}"><div class="font-bold mb-2">${f.id?'編輯成員':'新增成員'}</div>${MF.map(([k,l,ph,ty])=>`<div class="kvl mt-2">${l}</div><input class="${IN}" id="mf_${k}" type="${ty||'text'}" value="${esc(f[k]||'')}" placeholder="${esc(ph)}" ${k=='grp'?'list="mf_grps"':''}>`).join('')}
  <datalist id="mf_grps">${FAM.map(([g])=>`<option value="${esc(g)}">`).join('')}</datalist>
  <div class="kvl mt-2">性別</div><select class="${IN}" id="mf_sex"><option value="">—</option><option value="M" ${f.sex=='M'?'selected':''}>男 M</option><option value="F" ${f.sex=='F'?'selected':''}>女 F</option></select>
  <div class="flex gap-2 mt-3"><button type="button" class="${BP}" onclick="memSave()">儲存</button><button type="button" class="${BT}" onclick="ADS.mf=null;render()">取消</button></div></div>`:'';
 const list=db.members.map(m=>`<div class="adli"><div class="min-w-0"><div class="font-medium">${esc(m.zh||'（未填中文名）')} <span class="text-sm text-stone-500">${esc([m.last,m.first].filter(Boolean).join(' / '))}</span></div><div class="text-sm text-stone-500">${esc(m.grp||'未分組')}${m.pp?'・護照 '+esc(m.pp):''}</div></div><div class="flex gap-1 shrink-0"><button type="button" class="${BT}" onclick="ADS.mf=JSON.parse(JSON.stringify(db.members.find(x=>x.id=='${m.id}')));render()">編輯</button>${ADS.del=='m'+m.id?`<button type="button" class="adyes" onclick="memDel('${m.id}')">確定刪除</button>`:`<button type="button" class="${BD}" onclick="ADS.del='m${m.id}';render()">刪除</button>`}</div></div>`).join('');
 return form+`<div class="${CC}"><div class="flex justify-between items-center mb-2"><div class="font-bold">成員（${db.members.length}）</div><button type="button" class="${BP}" onclick="ADS.mf={};render()">＋ 新增</button></div>${list||'<div class="text-sm text-stone-500">還沒有成員。上傳訂單時會自動從旅客姓名建立。</div>'}<p class="text-xs text-stone-500 mt-2">「分組」用來把一家人放在一起，費用分攤和行程單會依分組顯示。</p></div>`}
function memSave(){const v=k=>((document.getElementById('mf_'+k)||{}).value||'').trim(),f=ADS.mf,m=f.id?db.members.find(x=>x.id==f.id):{id:'m'+uid(),nat:'',note:''};
 if(!v('zh')&&!v('last')){tip('請至少填中文姓名或英文姓');return}
 MF.forEach(([k])=>m[k]=v(k));m.last=m.last.toUpperCase();m.first=m.first.toUpperCase();m.sex=v('sex');if(!f.id)db.members.push(m);ADS.mf=null;cloudSave();render();tip('已儲存')}
function memDel(id){db.members=db.members.filter(m=>m.id!=id);db.fl.forEach(f=>{delete f.pax[id];delete f.pp[id]});db.ht.forEach(h=>h.rooms.forEach(r=>r.members=r.members.filter(x=>x!=id)));[...db.tr,...db.ot].forEach(x=>delete x.pax[id]);ADS.del='';cloudSave();render();tip('已刪除')}

/* ===== 訂單管理 ===== */
function adOrd(){const all=COLL.flatMap(k=>db[k].map(x=>({k,x}))).sort((a,b)=>String(dateOf(a.k,a.x)).localeCompare(String(dateOf(b.k,b.x))));
 const byT=grp(all,o=>o.x.trip);
 const row=({k,x})=>{const key=k+':'+x.id;return `<div class="adli col"><div class="flex items-start justify-between gap-2 w-full"><div class="min-w-0"><div class="font-medium">${KIND[k][0]} ${esc(ttlOf(k,x))}</div><div class="text-sm text-stone-500">${[dateOf(k,x)?d(dateOf(k,x)):'',x.orderNo?'訂單 '+esc(x.orderNo):'',x.status!='已確認'?esc(x.status):''].filter(Boolean).join('・')}</div></div>
  <div class="flex gap-1 shrink-0"><button type="button" class="${BT}" onclick="ADS.edit=ADS.edit=='${key}'?'':'${key}';render()">${ADS.edit==key?'收起':'編輯'}</button>${ADS.del==key?`<button type="button" class="adyes" onclick="ordDel('${k}','${x.id}')">確定刪除</button>`:`<button type="button" class="${BD}" onclick="ADS.del='${key}';render()">刪除</button>`}</div></div>
  ${ADS.edit==key?`<div class="w-full mt-2"><div class="kvl">旅程</div><select class="${IN} mb-2" id="oe_trip">${db.trips.map(t=>`<option value="${t.id}" ${t.id==x.trip?'selected':''}>${esc(t.name)}</option>`).join('')}</select><div class="kvl">狀態</div><select class="${IN} mb-2" id="oe_st">${['已確認','待確認','已取消'].map(s=>`<option ${s==x.status?'selected':''}>${s}</option>`).join('')}</select><label class="text-sm"><input type="checkbox" id="oe_paid" ${x.paid?'checked':''}> 已付款</label>
  <details class="mt-2"><summary class="text-sm text-stone-500 cursor-pointer">進階：直接編輯資料（JSON）</summary><textarea class="${IN} adjs" id="oe_js" rows="12">${esc(JSON.stringify(x,null,1))}</textarea></details>
  <div class="flex gap-2 mt-2"><button type="button" class="${BP}" onclick="ordSave('${k}','${x.id}')">儲存</button></div></div>`:''}</div>`};
 return `<div class="${CC}"><div class="font-bold mb-1">訂單管理（${all.length}）</div><p class="text-xs text-stone-500 mb-2">要改內容也可以用「上傳訂單」頁下方的「用一句話修改」。</p>${byT.map(g=>`<div class="kvl mt-3">${esc(T(g[0].x.trip).name)}</div>${g.map(row).join('')}`).join('')||'<div class="text-sm text-stone-500">還沒有訂單。</div>'}</div>`}
function ordSave(k,id){const i=db[k].findIndex(x=>x.id==id);if(i<0)return;let x=db[k][i];const js=document.getElementById('oe_js'),orig=JSON.stringify(x,null,1);
 if(js&&js.value!=orig){try{const n=JSON.parse(js.value);if(!n||typeof n!='object'||Array.isArray(n))throw 0;x=n;x.id=id}catch(e){tip('JSON 格式有誤，未儲存');return}}
 x.trip=document.getElementById('oe_trip').value;x.status=document.getElementById('oe_st').value;x.paid=document.getElementById('oe_paid').checked;
 db[k][i]=x;applyDb(db);ADS.edit='';cloudSave();render();tip('已儲存')}
function ordDel(k,id){const x=db[k].find(y=>y.id==id);if(x)imgDel(x.orderNo);db[k]=db[k].filter(y=>y.id!=id);ADS.del='';cloudSave();render();tip('已刪除')}

/* ===== 備份 ===== */
function adBk(){return `<div class="${CC}"><div class="font-bold mb-1">備份</div><p class="text-sm text-stone-500 mb-2">資料已自動存在你的 Claude 帳號雲端。想另外留一份，可以複製全部資料存到記事本。（不含訂單截圖）</p><button type="button" class="${BP}" onclick="cpText(JSON.stringify(db),'已複製全部資料')">📋 複製全部資料</button></div>
 <div class="${CC}"><div class="font-bold mb-1">還原</div><p class="text-sm text-stone-500 mb-2">貼上之前複製的資料，會<b>取代</b>目前全部內容。</p><textarea class="${IN} adjs" rows="5" oninput="ADS.imp=this.value;ADS.impOk=false">${esc(ADS.imp)}</textarea>
 <div class="flex gap-2 mt-2">${ADS.impOk?`<button type="button" class="adyes" onclick="bkImport()">確定取代全部資料</button><button type="button" class="${BT}" onclick="ADS.impOk=false;render()">取消</button>`:`<button type="button" class="${BT}" onclick="ADS.impOk=true;render()">還原</button>`}</div></div>`}
function bkImport(){try{const o=JSON.parse(ADS.imp);if(!o||typeof o!='object')throw 0;const keep=db.imgs;applyDb(o);db.imgs=keep.filter(k=>ORDIMG[k]);ADS.imp='';ADS.impOk=false;cloudSave();tip('已還原');go('home')}catch(e){ADS.impOk=false;tip('資料格式不對，無法還原');render()}}
