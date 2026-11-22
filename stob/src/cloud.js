/* =====================================================================
   TOB 分享版：每個人的資料存在自己的雲端空間（data/users/<id>），
   上傳訂單截圖／PDF／確認信文字 → Claude 讀取 → 確認後存入
   ===================================================================== */
const CLD={db:null,user:null,uid:'',st:'load',msg:'',q:Promise.resolve(),timer:null,sample:null,lim:null,noWrite:false};
const ADS={tab:'trip',files:[],text:'',note:'',busy:false,ctl:null,res:null,err:'',edit:'',del:'',tf:null,mf:null,ai:'',aiRes:null,imp:'',impOk:false,imgFail:[],bk:null,bkAck:false,undo:null,aiSel:{}};
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

/* ---------- 雲端讀寫（版本保護＋讀取失敗鎖定） ----------
   主文件 tob：{v:2, rev, n, len, h, t, by, s:第 1 段}；其餘段落存在 tob_r<rev>_p<i>（每個版本各一份）。
   先寫完所有段落、最後才更新主文件，所以讀的人不會拿到存一半的資料；舊版格式（無 rev、段落 tob_p<i>）照樣讀得到。
   讀取失敗或資料檢查碼不符 → 鎖定儲存，避免用空資料蓋掉雲端；儲存前比對版本，別台裝置已更新 → 停止並請使用者重新讀取。 */
const PART=60000;
const uref=k=>CLD.db.collection('data/users/'+CLD.uid).doc(k);
const fnv=s=>{let h=0x811c9dc5;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return (h>>>0).toString(16)};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
CLD.rev=0;CLD.prevN=1;CLD.legacy=false;CLD.lock='';CLD.sid=uid()+uid();CLD.imgMiss=0;CLD.pk='tob_p';CLD.pend=null;CLD.dirty=false;CLD.retry=0;CLD.rconf=false;CLD.leaseUntil=0;
function cloudBadge(){const m={load:'讀取中…',ok:'',save:'儲存中…',err:'⚠ 未儲存',off:'⚠ 未登入',lock:'⚠ 已暫停儲存'}[CLD.lock?'lock':CLD.st]||'';return `<span class="cldb ${CLD.lock?'err':CLD.st}"${m?'':' hidden'}>${m}</span>`}
/* 只更新標籤，不整頁重畫（避免清掉正在填的表單） */
function badgeUpd(){const e=document.querySelector('.cldb');if(e)e.outerHTML=cloudBadge();lockUpd()}
function lockUpd(){let b=document.getElementById('lockbar');const show=!!CLD.lock;if(!b){if(!show)return;b=document.createElement('div');b.id='lockbar';b.className='lockbar';b.setAttribute('role','alert');document.body.appendChild(b)}
 b.hidden=!show;if(!show){CLD.rconf=false;return}
 b.innerHTML=CLD.rconf?`<span><b>確定要重新讀取嗎？</b>會改用雲端上的最新資料，${CLD.dirty?'這台裝置<b>還沒存上雲端的修改會遺失</b>':'這台裝置若有沒存上雲端的修改會遺失'}。不確定的話，先複製一份目前資料。</span><div class="lockbtn"><button type="button" class="ghost" onclick="cpText(bkPack(),'已複製目前資料，可貼到記事本保存')">先複製目前資料</button><button type="button" onclick="cloudReload(1)">確定重新讀取</button><button type="button" class="ghost" onclick="CLD.rconf=false;lockUpd()">取消</button></div>`
  :`<span>${esc(CLD.msg)}</span><button type="button" onclick="cloudReload()">重新讀取</button>`}
/* 寫入前的守門：鎖定或沒有登入時不讓改，也不在畫面上假裝改好了 */
function canWrite(){if(CLD.lock){tip('目前暫停儲存，請先按上方「重新讀取」');lockUpd();return false}if(!CLD.db||!CLD.uid){tip(CLD.msg||'請先登入 Claude');return false}return true}
function cloudSave(){famCalc();campCalc();CLD.dirty=true;if(!CLD.db||!CLD.uid){CLD.st='off';return}if(CLD.lock){badgeUpd();return}CLD.st='save';badgeUpd();clearTimeout(CLD.timer);CLD.timer=setTimeout(cloudFlush,500)}
async function readMain(){const s=await uref('tob').get();return s.exists?(s.data()||{}):null}
/* 分段文件的前綴：新格式寫在主文件 pk；沒有 pk 的 v2 用 tob_r<rev>_p；舊格式用 tob_p */
const partPre=o=>{const p=o&&o.pk;if(typeof p=='string'&&/^tob_[A-Za-z0-9_]{1,80}$/.test(p))return p;return o&&o.rev?'tob_r'+o.rev+'_p':'tob_p'};
/* 寫入鎖：只用 Claude db 提供的 acquire（cooperative lease，所有 STOB 寫入者都先取得它）。
   沒拿到就不寫；不支援 acquire 就暫停儲存，不再「當作成功」。 */
const LEASE_MS=10000,LEASE_MIN=4000;
async function leaseTry(){const r=uref('tob_lock');if(typeof r.acquire!='function')throw {code:'nolease'};
 const t0=Date.now();let a;try{a=await r.acquire({holder:CLD.sid,ttlMs:LEASE_MS})}catch(e){const c=e&&e.code;if(c=='capability_removed'||c=='capability_disabled')throw {code:'nolease'};throw e}
 if(a&&a.acquired){CLD.leaseUntil=t0+LEASE_MS;return {ok:true}}
 const ex=a&&a.expiresAt?Date.parse(a.expiresAt)-Date.now():NaN;return {ok:false,wait:isFinite(ex)?Math.min(4000,Math.max(300,ex+200)):1200}}
async function takeLease(){for(let i=0;i<4;i++){let r;try{r=await leaseTry()}catch(e){if(e&&e.code=='unavailable'&&i<3){await sleep(600+Math.random()*900);continue}throw e}
  if(r.ok)return;await sleep(r.wait)}
 throw {code:'busy'}}
/* 每次寫入前確認鎖還夠用（剩不到 4 秒就續約；續不到就中止，主文件不會被寫） */
async function keepLease(){if(CLD.leaseUntil-Date.now()>LEASE_MIN)return;const r=await leaseTry();if(!r.ok)throw {code:'lease_lost'}}
function cloudFlush(){
 CLD.q=CLD.q.then(async()=>{if(CLD.lock)return;
  await takeLease();
  const m=await readMain(),remote=m?(+m.rev||0):0,P=CLD.pend;
  if(remote!==CLD.rev){
   /* 上次寫主文件時斷線、其實已寫入：主文件是自己寫的同一份 → 接手，不算衝突 */
   if(P&&m&&m.by===CLD.sid&&remote===P.rev&&m.h===P.h){CLD.rev=P.rev;CLD.prevN=P.n;CLD.legacy=false;const op=CLD.pk;CLD.pk=P.pk;CLD.pend=null;for(let i=1;i<P.oldN;i++)uref(op+i).delete().catch(()=>{})}
   else throw {code:'conflict'}}
  const js=JSON.stringify(db),h=fnv(js);
  if(m&&!CLD.legacy&&m.h===h&&+m.len===js.length){CLD.dirty=false;CLD.retry=0;CLD.st='ok';badgeUpd();return}
  const parts=[];for(let i=0;i<js.length;i+=PART)parts.push(js.slice(i,i+PART));if(!parts.length)parts.push('{}');
  const rev=CLD.rev+1,pk='tob_r'+rev+'_'+CLD.sid.slice(0,10)+'_p';
  for(let i=1;i<parts.length;i++){await keepLease();await uref(pk+i).set({s:parts[i]})}
  await keepLease();
  CLD.pend={rev,h,n:parts.length,pk,oldN:CLD.prevN};
  await uref('tob').set({v:2,rev,n:parts.length,len:js.length,h,pk,t:Date.now(),by:CLD.sid,s:parts[0]});
  /* 寫完再讀一次：如果被沒用鎖的舊版本覆蓋，立刻發現並鎖定 */
  const v=await readMain();if(!v||+v.rev!==rev||v.by!==CLD.sid||v.h!==h)throw {code:'conflict'};
  const op=CLD.pk,oldN=CLD.prevN;CLD.rev=rev;CLD.prevN=parts.length;CLD.legacy=false;CLD.pk=pk;CLD.pend=null;
  for(let i=1;i<oldN;i++)uref(op+i).delete().catch(()=>{});
  CLD.dirty=JSON.stringify(db)!==js;CLD.retry=0;CLD.st='ok';CLD.noWrite=false;badgeUpd()})
 .catch(e=>{const c=e&&e.code;clearTimeout(CLD.timer);
  if(c=='conflict'){CLD.lock='conflict';CLD.st='err';CLD.msg='這份資料在其他裝置或分頁更新過。為了不覆蓋，已暫停儲存；請按「重新讀取」載入最新資料。';badgeUpd();render();return}
  if(c=='nolease'){CLD.lock='nolease';CLD.st='err';CLD.msg='目前的 Claude 版本不支援儲存鎖定，為了避免多台裝置互相覆蓋，已暫停儲存。請更新 Claude App 後重新開啟這個頁面。';badgeUpd();render();return}
  if(c=='busy'||c=='lease_lost'){CLD.st='err';CLD.msg='另一台裝置或分頁正在儲存，稍後自動重試…';badgeUpd();CLD.timer=setTimeout(cloudFlush,4000);return}
  if(c=='unavailable'||c=='resource_exhausted'||!c){CLD.retry=Math.min((CLD.retry||0)+1,5);CLD.st='err';CLD.msg='網路不穩，修改還沒存到雲端；恢復連線後會自動重試。';badgeUpd();if(CLD.retry==1)tip(CLD.msg);CLD.timer=setTimeout(cloudFlush,Math.min(60000,2500*2**CLD.retry));return}
  CLD.st='err';CLD.noWrite=c=='invalid_argument';CLD.msg=c=='quota_exceeded'?'雲端空間已滿，請刪除一些截圖或訂單。':CLD.noWrite?'你目前沒有儲存權限：請分享這個頁面的人把你設為「編輯者」。':'儲存失敗，請確認網路後再改一次（下次修改會再嘗試儲存）。';badgeUpd();tip(CLD.msg)})}
addEventListener('online',()=>{if(CLD.dirty&&!CLD.lock&&CLD.db&&CLD.uid){clearTimeout(CLD.timer);CLD.retry=0;cloudFlush()}});
async function cloudLoad(){const o=await readMain();
 if(!o){applyDb({});CLD.rev=0;CLD.prevN=1;CLD.legacy=false;CLD.pk='tob_p';return}
 const legacy=!o.rev,n=Math.max(1,+o.n||1),pre=partPre(o);let js=String(o.s||'');
 for(let i=1;i<n;i++){const p=await uref(pre+i).get();if(!p.exists)throw {code:'part_missing'};js+=String((p.data()||{}).s||'')}
 if(!legacy&&(js.length!==+o.len||fnv(js)!==o.h))throw {code:'checksum'};
 let d;try{d=JSON.parse(js||'{}')}catch(e){throw {code:'parse'}}
 if(!d||typeof d!='object'||Array.isArray(d))throw {code:'parse'};
 applyDb(d);CLD.rev=legacy?0:+o.rev;CLD.prevN=n;CLD.legacy=legacy;CLD.pk=pre;CLD.pend=null;CLD.dirty=false;
 CLD.imgMiss=0;for(const k of db.imgs){try{const p=await uref('img_'+ikey(k)).get();if(p.exists)ORDIMG[k]=String((p.data()||{}).d||'');else CLD.imgMiss++}catch(e){CLD.imgMiss++}}}
const LOADERR={part_missing:'資料不完整（可能另一台裝置正在儲存）',checksum:'資料檢查碼不符',parse:'資料格式損壞'};
async function loadSafe(){for(let i=0;i<2;i++){try{await cloudLoad();CLD.lock='';return true}catch(e){if(i==0){await sleep(1500);continue}
  CLD.lock='read';CLD.st='err';CLD.msg='讀取雲端資料失敗（'+(LOADERR[e&&e.code]||'網路或服務暫時無法使用')+'）。為了避免覆蓋你的資料，已暫停儲存；請按「重新讀取」。';return false}}}
/* 重新讀取前先確認：會放棄這台裝置沒存上雲端的修改 */
async function cloudReload(ok){if(!ok){CLD.rconf=true;lockUpd();return}
 CLD.rconf=false;CLD.st='load';CLD.lock='';badgeUpd();lockUpd();clearTimeout(CLD.timer);await CLD.q.catch(()=>{});
 Object.keys(ORDIMG).forEach(k=>delete ORDIMG[k]);const okk=await loadSafe();if(okk){CLD.st='ok';CLD.retry=0;tip('已載入最新資料')}badgeUpd();render()}
const ikey=k=>String(k).replace(/[^A-Za-z0-9_\-.~:@+]/g,'_').slice(0,150)||'x';
/* 訂單截圖：失敗要讓使用者知道，並可重試 */
function imgSave(k,dataUrl){if(!k)return;if(!dataUrl){imgFail(k,'',"截圖太大，壓縮後仍超過上限");return}
 if(!CLD.db||!CLD.uid||CLD.lock){imgFail(k,dataUrl,CLD.lock?'目前暫停儲存':'未登入');return}
 ORDIMG[k]=dataUrl;if(!db.imgs.includes(k))db.imgs.push(k);
 CLD.q=CLD.q.then(()=>uref('img_'+ikey(k)).set({k,d:dataUrl})).then(()=>{ADS.imgFail=ADS.imgFail.filter(x=>x.k!=k)}).catch(e=>{delete ORDIMG[k];db.imgs=db.imgs.filter(x=>x!=k);imgFail(k,dataUrl,e&&e.code=='quota_exceeded'?'雲端空間已滿':'雲端儲存失敗');cloudSave()})}
function imgFail(k,d,why){ADS.imgFail=ADS.imgFail.filter(x=>x.k!=k);ADS.imgFail.push({k,d,why});clearTimeout(ADS.imgT);ADS.imgT=setTimeout(()=>{tip(ADS.imgFail.length+' 張訂單截圖沒有存到雲端，請到「上傳訂單」頁查看');if(S.v=='up')render()},300)}
function imgRetry(){const L=ADS.imgFail.filter(x=>x.d);if(!L.length||!canWrite())return;L.forEach(x=>imgSave(x.k,x.d));CLD.q.then(()=>{cloudSave();render();tip(ADS.imgFail.length?'還有 '+ADS.imgFail.length+' 張沒存到':'截圖都已存到雲端')})}
function imgDel(k){if(!k||!db.imgs.includes(k))return;delete ORDIMG[k];db.imgs=db.imgs.filter(x=>x!=k);if(CLD.db)CLD.q=CLD.q.then(()=>uref('img_'+ikey(k)).delete()).catch(()=>{})}

(async function boot(){
 if(!window.claude||!claude.use){CLD.st='off';CLD.msg='請在 Claude 裡開啟這個頁面。';render();return}
 const to=setTimeout(()=>{if(CLD.st=='load'){CLD.st='off';CLD.msg='讀不到雲端資料：請確認已登入 Claude、網路正常。';render()}},12000);
 try{const [dbx,us]=await Promise.all([claude.use('db'),claude.use('user')]);CLD.db=dbx;CLD.user=us;CLD.uid=us?await us.id():'';
  if(!dbx||!CLD.uid){clearTimeout(to);CLD.st='off';CLD.msg='請先登入 Claude，才能儲存你自己的訂單。';render();return}
  const ok=await loadSafe();clearTimeout(to);if(ok)CLD.st='ok';route();lockUpd()}
 catch(e){clearTimeout(to);CLD.lock='read';CLD.st='err';CLD.msg='雲端資料讀取失敗。為了避免覆蓋你的資料，已暫停儲存；請按「重新讀取」。';render();lockUpd()}
 try{CLD.sample=await claude.use('sample');if(CLD.sample)CLD.lim=await CLD.sample.limits().catch(()=>null)}catch(e){CLD.sample=null}
 if(S.v=='add'||S.v=='up')render()})();

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
function fabUpd(){if(ADS.formTop){ADS.formTop=0;const f=document.querySelector('.adform');if(f)f.scrollIntoView({block:'start',behavior:'smooth'})}let b=document.getElementById('upfab');if(!b){b=document.createElement('button');b.id='upfab';b.type='button';b.className='upfab';b.innerHTML='<span aria-hidden="true">＋</span>上傳訂單';b.onclick=()=>{ADS.res=ADS.res;go('up')};document.body.appendChild(b)}
 b.hidden=S.v=='up'||inCi()||!!document.getElementById('pdfv')||!!document.querySelector('.adform')||!!(S.v=='add'&&ADS.aiRes);lockUpd()}
{const _r=render;render=function(k){_r(k);try{fabUpd()}catch(e){}}}

/* ===== 上傳訂單 ===== */
function adUp(){if(ADS.res)return adPreview();const IF=ADS.imgFail;
 const img=CLD.lim&&CLD.lim.images,noAi=!CLD.sample;
 const files=ADS.files.map((f,i)=>`<div class="adf"><span>${f.kind=='pdf'?'📄':'🖼'} ${esc(f.name)}</span><button type="button" class="adx" aria-label="移除" onclick="adRm(${i})">✕</button></div>`).join('');
 const fail=IF.length?`<div class="${CC} cldw"><div class="font-medium">⚠ ${IF.length} 張訂單截圖沒有存到雲端</div><ul class="text-sm mt-1">${IF.map(x=>`<li>訂單 ${esc(x.k)}：${esc(x.why)}</li>`).join('')}</ul><div class="text-xs mt-1">訂單資料已存好，只有截圖沒存到。</div><div class="flex gap-2 mt-2">${IF.some(x=>x.d)?`<button type="button" class="${BT}" onclick="imgRetry()">重試</button>`:''}<button type="button" class="${BT}" onclick="ADS.imgFail=[];render()">知道了</button></div></div>`:'';
 return fail+`<div class="${CC}"><div class="font-bold text-lg">📸 上傳訂單</div><p class="text-sm text-stone-500 mb-2">可一次選多張：訂單截圖、PDF、或下面貼上確認信文字。Claude 會讀出旅程、旅客、航班／飯店／交通資料，你確認後才存入。</p>
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
 <div class="adbar"><button type="button" class="${BP}" onclick="adApply()">✅ 存入</button><button type="button" class="${BT}" onclick="ADS.res=null;render()">← 回上一步</button><button type="button" class="${BD}" onclick="adDiscard()">放棄</button></div>
 <p class="text-xs text-stone-500 mt-2">存入後仍可在「訂單管理」修改或刪除，也可以用下方「用一句話修改」。</p></div>`}
function adDiscard(){ADS.res=null;ADS.files=[];ADS.text='';ADS.note='';ADS.err='';render()}

function adApply(){if(!canWrite())return;const {o,thumbs,skip}=ADS.res,map={},newT=[];
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

/* ===== 用一句話修改：逐欄位預覽＋驗證，只套用勾選且通過檢查的項目 ===== */
const AIK=['members','trips',...COLL],CNAME={members:'成員',trips:'旅程',fl:'機票',ht:'飯店',tr:'交通',ot:'其他'};
const FLD={members:{zh:'中文姓名',last:'英文姓',first:'英文名',sex:'性別',dob:'生日',pp:'護照號碼',ppExp:'護照效期',nat:'國籍',grp:'分組',note:'備註'},
 trips:{name:'名稱',start:'出發',end:'回程',note:'備註',curs:'外幣',web:'旅程網頁',fam:'住宿按分組分攤',nosplit:'交通依每人金額'},
 fl:{trip:'旅程',grp:'分組',platform:'訂購平台',orderNo:'訂單編號',airline:'航空公司',pnr:'訂位代碼',ticketNo:'機票號碼',status:'狀態',paid:'已付款',cur:'幣別',total:'總額',note:'備註',segs:'航段',pax:'旅客金額',pp:'旅客訂位'},
 ht:{trip:'旅程',grp:'分組',zh:'飯店中文名',en:'英文名',ori:'當地名',addr:'地址',area:'區域',map:'地圖連結',platform:'訂購平台',orderNo:'訂單編號',cin:'入住',cout:'退房',status:'狀態',paid:'已付款',free:'可免費取消',cancelBy:'免費取消期限',payDate:'付款日',rep:'代表人',cur:'幣別',total:'總額',note:'備註',rooms:'房間'},
 tr:{trip:'旅程',grp:'分組',type:'類型',company:'公司',title:'標題',platform:'訂購平台',orderNo:'訂單編號',code:'代碼',no:'班次',date:'日期',dep:'出發時間',arr:'抵達時間',from:'出發地',to:'目的地',status:'狀態',paid:'已付款',cur:'幣別',total:'總額',pax:'旅客金額',note:'備註',lines:'重點',pays:'分期付款',camp:'交通兼住宿'},
 ot:{trip:'旅程',grp:'分組',type:'類型',title:'標題',company:'公司',platform:'訂購平台',orderNo:'訂單編號',code:'代碼',date:'日期',dep:'時間',status:'狀態',paid:'已付款',cur:'幣別',total:'總額',pax:'旅客金額',note:'備註',lines:'重點'}};
const RE_D=/^\d{4}-\d{2}-\d{2}$/,RE_T=/^\d{1,2}:\d{2}$/;
const isMem=i=>db.members.some(m=>m.id==i),isTrip=i=>db.trips.some(t=>t.id==i);
function vField(c,k,v){const D=['dob','ppExp','start','end','cin','cout','cancelBy','payDate','date'];
 if(!FLD[c]||!(k in FLD[c]))return '不認得的欄位';
 const str=()=>typeof v=='string'||typeof v=='number';
 if(D.includes(k))return v===''||(typeof v=='string'&&RE_D.test(v))?'':'日期格式要是 YYYY-MM-DD';
 if(k=='dep'||k=='arr')return v===''||(typeof v=='string'&&RE_T.test(v))?'':'時間格式要是 HH:MM';
 if(k=='total')return v===''||(typeof v=='number'&&isFinite(v)&&v>=0)?'':'金額要是數字';
 if(['paid','free','fam','nosplit'].includes(k))return typeof v=='boolean'||v===0||v===1?'':'要是「是／否」';
 if(k=='status')return ['已確認','待確認','已取消'].includes(v)?'':'狀態只能是 已確認／待確認／已取消';
 if(k=='cur')return typeof v=='string'&&/^[A-Z]{3}$/.test(v)?'':'幣別要是三個大寫英文字母';
 if(k=='sex')return ['','M','F'].includes(v)?'':'性別要是 M、F 或空白';
 if(k=='trip')return isTrip(v)?'':'找不到這趟旅程';
 if(k=='rep')return v===''||isMem(v)?'':'找不到這位成員';
 if(k=='curs')return Array.isArray(v)&&v.every(x=>/^[A-Z]{3}$/.test(x))?'':'外幣要是幣別代碼清單';
 if(k=='lines')return Array.isArray(v)&&v.every(x=>typeof x=='string')?'':'要是文字清單';
 if(k=='pax')return v&&typeof v=='object'&&!Array.isArray(v)&&Object.keys(v).every(isMem)&&Object.values(v).every(x=>x===''||typeof x=='number')?'':'旅客要是現有成員、金額要是數字';
 if(k=='pp')return v&&typeof v=='object'&&!Array.isArray(v)&&Object.keys(v).every(isMem)?'':'旅客要是現有成員';
 if(k=='rooms')return Array.isArray(v)&&v.length&&v.every(r=>r&&typeof r=='object'&&arr(r.members).every(isMem))?'':'房間格式不對或住客不是現有成員';
 if(k=='segs')return Array.isArray(v)&&v.every(s=>s&&typeof s=='object'&&(s.date===undefined||s.date===''||RE_D.test(s.date))&&(!s.dep||RE_T.test(s.dep))&&(!s.arr||RE_T.test(s.arr)))?'':'航段格式不對';
 if(k=='pays')return Array.isArray(v)&&v.every(q=>q&&typeof q=='object'&&(!q.d||RE_D.test(q.d)))?'':'分期付款格式不對';
 if(k=='camp')return v&&typeof v=='object'&&RE_D.test(v.cin||'')&&RE_D.test(v.cout||'')?'':'交通兼住宿要有上車／下車日期';
 return str()?'':'要是文字'}
const fmtV=v=>v===undefined?'（無）':v===''||v===null?'（空白）':typeof v=='boolean'?(v?'是':'否'):typeof v=='object'?JSON.stringify(v).slice(0,90)+(JSON.stringify(v).length>90?'…':''):String(v);
const itemName=(c,x)=>!x?'':c=='members'?(x.zh||[x.last,x.first].filter(Boolean).join(' ')):c=='trips'?String(x.name||'').replace(/^\d{6}/,''):ttlOf(c,x);
function aiCheck(ops){return arr(ops).slice(0,60).map((o,i)=>{o=obj(o);const c=o.coll,L=db[c],r={i,op:o.op,c,rows:[],err:'',name:''};
 if(!AIK.includes(c)){r.err='不認得的資料類別';return r}
 if(o.op=='set'){const x=L.find(y=>y.id==o.id);if(!x){r.err='找不到要修改的項目';return r}r.name=itemName(c,x);const P=obj(o.patch);
  if(!Object.keys(P).length){r.err='沒有要改的欄位';return r}
  Object.entries(P).forEach(([k,v])=>{const e=k=='id'?'不能修改 id':vField(c,k,v);r.rows.push({k,l:(FLD[c]||{})[k]||k,a:x[k],b:v,e})});
  if(r.rows.some(x=>x.e))r.err='有欄位沒通過檢查';r.id=o.id;r.patch=P;return r}
 if(o.op=='add'){const it=obj(o.item);delete it.id;r.name=itemName(c,it)||'（新項目）';
  Object.entries(it).forEach(([k,v])=>{const e=vField(c,k,v);r.rows.push({k,l:(FLD[c]||{})[k]||k,a:undefined,b:v,e})});
  if(c=='trips'&&!(it.name&&RE_D.test(it.start||'')))r.err='新旅程要有名稱和出發日期';else if(c=='members'&&!(it.zh||it.last))r.err='新成員要有姓名';else if(COLL.includes(c)&&!isTrip(it.trip))r.err='新訂單要指定現有旅程';else if(r.rows.some(x=>x.e))r.err='有欄位沒通過檢查';
  r.item=it;return r}
 if(o.op=='del'){const x=L.find(y=>y.id==o.id);if(!x){r.err='找不到要刪除的項目';return r}r.name=itemName(c,x);r.id=o.id;return r}
 r.err='不認得的動作';return r})}
function adAiBox(){if(!CLD.sample||!db.trips.length&&!db.members.length)return '';const r=ADS.aiRes;
 const OPN={set:'修改',add:'新增',del:'刪除'};
 const card=x=>{const on=!x.err&&!!ADS.aiSel[x.i];return `<div class="aio${x.err?' bad':''}${x.op=='del'?' del':''}">
  <label class="aioh">${x.err?'<span class="aix">✕</span>':`<input type="checkbox" ${on?'checked':''} onchange="ADS.aiSel[${x.i}]=this.checked;render()">`}<span><b>${OPN[x.op]||esc(x.op)}${CNAME[x.c]||''}</b>${x.name?'「'+esc(x.name)+'」':''}</span></label>
  ${x.rows.length?`<div class="aiorows">${x.rows.map(w=>`<div class="aior${w.e?' bad':''}"><span class="aiok">${esc(w.l)}</span><span class="aiov">${x.op=='set'?`<s>${esc(fmtV(w.a))}</s> → `:''}<b>${esc(fmtV(w.b))}</b>${w.e?`<em>${esc(w.e)}</em>`:''}</span></div>`).join('')}</div>`:''}
  ${x.err?`<div class="aioe">${esc(x.err)}，不會套用</div>`:x.op=='del'?'<div class="aioe">刪除不能復原，確定要刪才勾選</div>':''}</div>`};
 const L=r?r.items:[],nSel=L.filter(x=>!x.err&&ADS.aiSel[x.i]).length;
 return `<div class="${CC}"><div class="font-bold">💬 用一句話修改</div><p class="text-sm text-stone-500 mb-2">例如「京都那間飯店改成已付款」「把小明加到東京所有訂單」「旅程改名叫北海道親子遊」。</p>
 <textarea class="${IN} adta" rows="2" oninput="ADS.ai=this.value" placeholder="想改什麼？" enterkeyhint="send">${esc(ADS.ai)}</textarea>
 <div class="flex gap-2 mt-2"><button type="button" class="${BP}" ${ADS.busy?'disabled':''} onclick="aiEdit()">${ADS.busy?'處理中…':'送出'}</button>${ADS.busy?`<button type="button" class="${BT}" onclick="adStop()">停止</button>`:''}</div>
 ${r?`<div class="aipv"><div class="text-sm font-medium">${esc(r.summary||'')}</div>${L.length?`<div class="text-xs text-stone-500 mb-1">請逐項確認，只會套用勾選的項目</div>${L.map(card).join('')}
  <div class="adbar"><button type="button" class="${BP}" ${nSel?'':'disabled'} onclick="aiApply()">套用勾選的 ${nSel} 項</button><button type="button" class="${BT}" onclick="ADS.aiRes=null;render()">取消</button></div>`:'<div class="text-xs text-stone-500">沒有要修改的內容</div>'}</div>`:''}
 ${ADS.aiErr?`<div class="text-sm text-red-700 mt-2">${esc(ADS.aiErr)}</div>`:''}</div>`}
async function aiEdit(){const q=ADS.ai.trim();if(!q||ADS.busy)return;ADS.busy=true;ADS.aiErr='';ADS.aiRes=null;render();
 const data={members:db.members,trips:db.trips,fl:db.fl,ht:db.ht,tr:db.tr,ot:db.ot};
 const p=`你在幫忙修改一份旅遊訂單資料（JSON）。依照使用者的要求，回傳要做的變更，只回傳 JSON：
{"summary":"用繁體中文一句話說明會改什麼（如果不清楚要改哪一筆，說明原因並給空的 ops）","ops":[
 {"op":"set","coll":"members|trips|fl|ht|tr|ot","id":"項目 id","patch":{"欄位":"新值"}},
 {"op":"add","coll":"…","item":{…完整新項目，不用給 id…}},
 {"op":"del","coll":"…","id":"…"}]}
patch 只放要改的欄位（陣列、物件欄位要給完整的新內容），只能用資料裡已有的欄位名稱。不要改動使用者沒提到的資料。日期 YYYY-MM-DD，時間 HH:MM，金額用數字，是／否用 true／false，status 只能是 已確認／待確認／已取消，旅程與成員只能用現有的 id。

今天：${new Date().toLocaleDateString('sv-SE')}
使用者要求：${q}

目前資料：
${JSON.stringify(data).slice(0,200000)}`;
 try{ADS.ctl=new AbortController();const r=await CLD.sample.json(p,{signal:ADS.ctl.signal,cache:false});const items=aiCheck(obj(r).ops);
  ADS.aiSel={};items.forEach(x=>{ADS.aiSel[x.i]=!x.err&&x.op!='del'});ADS.aiRes={summary:String(obj(r).summary||''),items}}catch(e){ADS.aiErr=errTxt(e)}
 ADS.busy=false;ADS.ctl=null;render()}
function aiApply(){if(!canWrite())return;const L=arr((ADS.aiRes||{}).items).filter(x=>!x.err&&ADS.aiSel[x.i]);let n=0;
 const bool=v=>v===true||v===1;
 L.forEach(x=>{const C=db[x.c];
  if(x.op=='set'){const it=C.find(y=>y.id==x.id);if(!it)return;Object.entries(x.patch).forEach(([k,v])=>{it[k]=['paid','free'].includes(k)?bool(v):['fam','nosplit'].includes(k)?(bool(v)?1:0):v});n++}
  else if(x.op=='add'){const pre={members:'m',trips:'t'}[x.c]||x.c+'-';C.push({...x.item,id:pre+uid()});n++}
  else if(x.op=='del'){const i=C.findIndex(y=>y.id==x.id);if(i>=0){if(COLL.includes(x.c))imgDel(C[i].orderNo);C.splice(i,1);n++}}});
 applyDb(db);ADS.aiRes=null;ADS.ai='';cloudSave();tip('已套用 '+n+' 項變更');render()}

/* ===== 旅程 ===== */
/* 表單內容邊打邊存在 ADS.tf／ADS.mf，背景重畫也不會清掉；長表單的按鈕固定在底部 */
const TFV=k=>{const f=ADS.tf||{};return k=='name'?String(f.name||'').replace(/^\d{6}/,''):k=='curs'?(Array.isArray(f.curs)?f.curs.join(','):String(f.curs||'')):f[k]||''};
function tfSet(k,v){if(ADS.tf)ADS.tf[k]=v}
function adTrip(){const f=ADS.tf;const I=(k,ph,ex)=>`<input class="${IN}" id="tf_${k}" value="${esc(TFV(k))}" placeholder="${esc(ph||'')}" oninput="tfSet('${k}',this.value)" ${ex||''}>`;
 const form=f?`<div class="${CC} adform"><div class="font-bold mb-2">${f.id?'編輯旅程':'新增旅程'}</div>
  <div class="kvl">名稱</div>${I('name','例如：日本東京','enterkeyhint="next"')}
  <div class="adrow mt-2"><div><div class="kvl">出發</div><input type="date" class="${IN}" id="tf_start" value="${esc(f.start||'')}" oninput="tfSet('start',this.value)"></div><div><div class="kvl">回程</div><input type="date" class="${IN}" id="tf_end" value="${esc(f.end||'')}" oninput="tfSet('end',this.value)"></div></div>
  <div class="kvl mt-2">備註</div>${I('note','例如：6天5夜','enterkeyhint="next"')}
  <div class="kvl mt-2">外幣（逗號分隔）</div>${I('curs','JPY','autocapitalize="characters" autocorrect="off" spellcheck="false" enterkeyhint="next"')}
  <div class="kvl mt-2">旅程網頁連結（可不填）</div>${I('web','https://','inputmode="url" autocapitalize="off" autocorrect="off" spellcheck="false"')}
  <label class="adck"><input type="checkbox" id="tf_fam" ${f.fam?'checked':''} onchange="tfSet('fam',this.checked?1:0)"><span>住宿費用按「分組」平均分攤</span></label>
  <label class="adck"><input type="checkbox" id="tf_ns" ${f.nosplit?'checked':''} onchange="tfSet('nosplit',this.checked?1:0)"><span>交通費用依每人金額計算（不按分組平分）</span></label>
  <div class="adbar"><button type="button" class="${BP}" onclick="tripSave()">儲存</button><button type="button" class="${BT}" onclick="ADS.tf=null;render()">取消</button></div></div>`:'';
 const list=[...db.trips].sort((a,b)=>(a.start||'').localeCompare(b.start||'')).map(t=>{const c=[...db.fl,...db.ht,...db.tr,...db.ot].filter(x=>x.trip==t.id).length;
  return `<div class="adli"><div class="min-w-0"><div class="font-medium">${esc(t.name.replace(/^\d{6}/,''))}</div><div class="text-sm text-stone-500">${rng(t)}・${c} 筆訂單</div></div><div class="flex gap-1 shrink-0"><button type="button" class="${BT}" onclick="ADS.tf=JSON.parse(JSON.stringify(db.trips.find(x=>x.id=='${t.id}')));ADS.formTop=1;render()">編輯</button>${ADS.del=='t'+t.id?`<button type="button" class="adyes" onclick="tripDel('${t.id}')">確定刪除${c?'（含訂單）':''}</button>`:`<button type="button" class="${BD}" onclick="ADS.del='t${t.id}';render()">刪除</button>`}</div></div>`}).join('');
 return form+`<div class="${CC}"><div class="flex justify-between items-center mb-2"><div class="font-bold">旅程（${db.trips.length}）</div><button type="button" class="${BP}" onclick="ADS.tf={};ADS.formTop=1;render()">＋ 新增</button></div>${list||'<div class="text-sm text-stone-500">還沒有旅程。上傳訂單時會自動建立，也可以手動新增。</div>'}</div>`}
function tripSave(){if(!canWrite())return;const f=ADS.tf,nm=TFV('name').trim(),st=f.start||'',en=f.end||st;
 if(!nm){tip('請填旅程名稱');return}if(!RE_D.test(st)){tip('請填出發日期');return}if(en<st){tip('回程不能早於出發');return}
 const t=f.id?db.trips.find(x=>x.id==f.id):{id:'t'+uid()};if(!t){tip('找不到這趟旅程');return}
 Object.assign(t,{name:st.slice(0,4)+st.slice(5,7)+nm,start:st,end:en,note:String(f.note||''),curs:TFV('curs').toUpperCase().split(/[,\s、，]+/).filter(x=>/^[A-Z]{3}$/.test(x)&&x!='TWD'),web:String(f.web||'').trim(),fam:f.fam?1:0,nosplit:f.nosplit?1:0});
 if(!f.id)db.trips.push(t);ADS.tf=null;cloudSave();render();tip('已儲存')}
function tripDel(id){if(!canWrite())return;db.trips=db.trips.filter(t=>t.id!=id);if(db.plans)delete db.plans[id];COLL.forEach(k=>{db[k].filter(x=>x.trip==id).forEach(x=>imgDel(x.orderNo));db[k]=db[k].filter(x=>x.trip!=id)});ADS.del='';if(S.trip==id)S.trip='';if(S.ct==id)S.ct='';cloudSave();render();tip('已刪除')}

/* ===== 成員 ===== */
const MF=[['zh','中文姓名',''],['last','英文姓 Surname','WANG'],['first','英文名 Given name','XIAOMING'],['dob','生日','','date'],['pp','護照號碼',''],['ppExp','護照效期','','date'],['grp','分組（同一家人填一樣）','例如：第1組｜王家']];
const MFX={last:'autocapitalize="characters" autocorrect="off" spellcheck="false" autocomplete="off"',first:'autocapitalize="characters" autocorrect="off" spellcheck="false" autocomplete="off"',pp:'autocapitalize="characters" autocorrect="off" spellcheck="false" autocomplete="off"',zh:'autocomplete="off"',grp:'list="mf_grps" autocomplete="off"'};
function mfSet(k,v){if(ADS.mf)ADS.mf[k]=v}
function adMem(){const f=ADS.mf;
 const form=f?`<div class="${CC} adform"><div class="font-bold mb-2">${f.id?'編輯成員':'新增成員'}</div>${MF.map(([k,l,ph,ty])=>`<div class="kvl mt-2">${l}</div><input class="${IN}" id="mf_${k}" type="${ty||'text'}" value="${esc(f[k]||'')}" placeholder="${esc(ph)}" oninput="mfSet('${k}',this.value)" ${MFX[k]||''} ${ty?'':'enterkeyhint="next"'}>`).join('')}
  <datalist id="mf_grps">${FAM.map(([g])=>`<option value="${esc(g)}">`).join('')}</datalist>
  <div class="kvl mt-2">性別</div><select class="${IN}" id="mf_sex" onchange="mfSet('sex',this.value)"><option value="">—</option><option value="M" ${f.sex=='M'?'selected':''}>男 M</option><option value="F" ${f.sex=='F'?'selected':''}>女 F</option></select>
  <div class="adbar"><button type="button" class="${BP}" onclick="memSave()">儲存</button><button type="button" class="${BT}" onclick="ADS.mf=null;render()">取消</button></div></div>`:'';
 const list=db.members.map(m=>`<div class="adli"><div class="min-w-0"><div class="font-medium">${esc(m.zh||'（未填中文名）')} <span class="text-sm text-stone-500">${esc([m.last,m.first].filter(Boolean).join(' / '))}</span></div><div class="text-sm text-stone-500">${esc(m.grp||'未分組')}${m.pp?'・護照 '+esc(m.pp):''}</div></div><div class="flex gap-1 shrink-0"><button type="button" class="${BT}" onclick="ADS.mf=JSON.parse(JSON.stringify(db.members.find(x=>x.id=='${m.id}')));ADS.formTop=1;render()">編輯</button>${ADS.del=='m'+m.id?`<button type="button" class="adyes" onclick="memDel('${m.id}')">確定刪除</button>`:`<button type="button" class="${BD}" onclick="ADS.del='m${m.id}';render()">刪除</button>`}</div></div>`).join('');
 return form+`<div class="${CC}"><div class="flex justify-between items-center mb-2"><div class="font-bold">成員（${db.members.length}）</div><button type="button" class="${BP}" onclick="ADS.mf={};ADS.formTop=1;render()">＋ 新增</button></div>${list||'<div class="text-sm text-stone-500">還沒有成員。上傳訂單時會自動從旅客姓名建立。</div>'}<p class="text-xs text-stone-500 mt-2">「分組」用來把一家人放在一起，費用分攤和行程單會依分組顯示。</p></div>`}
function memSave(){if(!canWrite())return;const f=ADS.mf,v=k=>String(f[k]||'').trim(),m=f.id?db.members.find(x=>x.id==f.id):{id:'m'+uid(),nat:'',note:''};
 if(!m){tip('找不到這位成員');return}if(!v('zh')&&!v('last')){tip('請至少填中文姓名或英文姓');return}
 for(const k of ['dob','ppExp'])if(v(k)&&!RE_D.test(v(k))){tip('日期格式不對');return}
 MF.forEach(([k])=>m[k]=v(k));m.last=m.last.toUpperCase();m.first=m.first.toUpperCase();m.pp=m.pp.toUpperCase();m.sex=v('sex');if(!f.id)db.members.push(m);ADS.mf=null;cloudSave();render();tip('已儲存')}
function memDel(id){if(!canWrite())return;db.members=db.members.filter(m=>m.id!=id);db.fl.forEach(f=>{delete f.pax[id];delete f.pp[id]});db.ht.forEach(h=>{h.rooms.forEach(r=>r.members=r.members.filter(x=>x!=id));if(h.rep==id)h.rep=''});[...db.tr,...db.ot].forEach(x=>delete x.pax[id]);ADS.del='';cloudSave();render();tip('已刪除')}

/* ===== 訂單管理 ===== */
function oeOpen(key){ADS.edit=ADS.edit==key?'':key;ADS.oe=null;if(ADS.edit){const [k,id]=key.split(':'),x=db[k].find(y=>y.id==id);if(x)ADS.oe={trip:x.trip,status:x.status,paid:!!x.paid,js:JSON.stringify(x,null,1),js0:JSON.stringify(x,null,1)}}render()}
function adOrd(){const all=COLL.flatMap(k=>db[k].map(x=>({k,x}))).sort((a,b)=>String(dateOf(a.k,a.x)).localeCompare(String(dateOf(b.k,b.x))));
 const byT=grp(all,o=>o.x.trip);
 const row=({k,x})=>{const key=k+':'+x.id,E=ADS.edit==key&&ADS.oe;return `<div class="adli col"><div class="flex items-start justify-between gap-2 w-full"><div class="min-w-0"><div class="font-medium">${KIND[k][0]} ${esc(ttlOf(k,x))}</div><div class="text-sm text-stone-500">${[dateOf(k,x)?d(dateOf(k,x)):'',x.orderNo?'訂單 '+esc(x.orderNo):'',x.status!='已確認'?esc(x.status):''].filter(Boolean).join('・')}</div></div>
  <div class="flex gap-1 shrink-0"><button type="button" class="${BT}" onclick="oeOpen('${key}')">${ADS.edit==key?'收起':'編輯'}</button>${ADS.del==key?`<button type="button" class="adyes" onclick="ordDel('${k}','${x.id}')">確定刪除</button>`:`<button type="button" class="${BD}" onclick="ADS.del='${key}';render()">刪除</button>`}</div></div>
  ${E?`<div class="w-full mt-2 adform"><div class="kvl">旅程</div><select class="${IN} mb-2" id="oe_trip" onchange="ADS.oe.trip=this.value">${db.trips.map(t=>`<option value="${t.id}" ${t.id==E.trip?'selected':''}>${esc(t.name)}</option>`).join('')}</select><div class="kvl">狀態</div><select class="${IN} mb-2" id="oe_st" onchange="ADS.oe.status=this.value">${['已確認','待確認','已取消'].map(s=>`<option ${s==E.status?'selected':''}>${s}</option>`).join('')}</select><label class="adck"><input type="checkbox" id="oe_paid" ${E.paid?'checked':''} onchange="ADS.oe.paid=this.checked"><span>已付款</span></label>
  <details class="mt-2" ${E.js!=E.js0?'open':''}><summary class="text-sm text-stone-500 cursor-pointer">進階：直接編輯資料（JSON）</summary><textarea class="${IN} adjs" id="oe_js" rows="12" autocapitalize="off" autocorrect="off" spellcheck="false" oninput="ADS.oe.js=this.value">${esc(E.js)}</textarea></details>
  ${E.err?`<div class="text-sm text-red-700 mt-1">${esc(E.err)}</div>`:''}
  <div class="adbar"><button type="button" class="${BP}" onclick="ordSave('${k}','${x.id}')">儲存</button><button type="button" class="${BT}" onclick="oeOpen('${key}')">取消</button></div></div>`:''}</div>`};
 return `<div class="${CC}"><div class="font-bold mb-1">訂單管理（${all.length}）</div><p class="text-xs text-stone-500 mb-2">要改內容也可以用這頁上方的「用一句話修改」。</p>${byT.map(g=>`<div class="kvl mt-3">${esc(T(g[0].x.trip).name)}</div>${g.map(row).join('')}`).join('')||'<div class="text-sm text-stone-500">還沒有訂單。</div>'}</div>`}
function ordSave(k,id){if(!canWrite())return;const i=db[k].findIndex(x=>x.id==id),E=ADS.oe;if(i<0||!E)return;let x=db[k][i];
 if(E.js!=E.js0){let n;try{n=JSON.parse(E.js)}catch(e){E.err='JSON 格式有誤（括號或逗號），沒有儲存';render();return}
  if(!n||typeof n!='object'||Array.isArray(n)){E.err='JSON 要是一個物件 {…}，沒有儲存';render();return}
  const bad=Object.entries(n).filter(([f])=>f!='id'&&FLD[k][f]!==undefined).map(([f,v])=>[f,vField(k,f,v)]).filter(([,e])=>e);
  if(bad.length){E.err='這些欄位沒通過檢查：'+bad.map(([f,e])=>FLD[k][f]+'（'+e+'）').join('、');render();return}
  x=n;x.id=id}
 if(!isTrip(E.trip)){E.err='請選擇旅程';render();return}
 x.trip=E.trip;x.status=E.status;x.paid=!!E.paid;db[k][i]=x;applyDb(db);ADS.edit='';ADS.oe=null;cloudSave();render();tip('已儲存')}
function ordDel(k,id){if(!canWrite())return;const x=db[k].find(y=>y.id==id);if(x)imgDel(x.orderNo);db[k]=db[k].filter(y=>y.id!=id);ADS.del='';cloudSave();render();tip('已刪除')}

/* ===== 備份：帶格式標記；還原先檢查、顯示比較、再二次確認，還原後可復原 ===== */
const bkPack=()=>JSON.stringify({stob:1,format:1,at:new Date().toISOString(),db});
const bkCount=o=>({trips:arr(o.trips).length,members:arr(o.members).length,orders:COLL.reduce((a,k)=>a+arr(o[k]).length,0),fl:arr(o.fl).length,ht:arr(o.ht).length,tr:arr(o.tr).length,ot:arr(o.ot).length,plans:Object.keys(obj(o.plans)).length});
function bkCheck(txt){const R={errs:[],warns:[],data:null};let o;const t=String(txt||'').trim();if(!t){R.errs.push('還沒貼上備份內容');return R}
 try{o=JSON.parse(t)}catch(e){R.errs.push('不是完整的備份資料（可能沒複製完整，結尾少了括號）');return R}
 if(o&&o.stob&&o.db)o=o.db;
 if(!o||typeof o!='object'||Array.isArray(o)){R.errs.push('格式不對：最外層要是 {…}');return R}
 const K=['members','trips',...COLL];if(!K.some(k=>Array.isArray(o[k]))){R.errs.push('裡面沒有旅程、成員或訂單，不像是 STOB 的備份');return R}
 const ids=new Set();K.forEach(k=>{if(o[k]===undefined)return;if(!Array.isArray(o[k])){R.errs.push(CNAME[k]+'的格式不對');return}
  o[k].forEach((x,i)=>{if(!x||typeof x!='object'||Array.isArray(x)){R.errs.push(CNAME[k]+'第 '+(i+1)+' 筆格式不對');return}if(typeof x.id!='string'||!x.id){R.errs.push(CNAME[k]+'第 '+(i+1)+' 筆缺少 id');return}if(ids.has(x.id))R.errs.push('有重複的 id：'+x.id);ids.add(x.id)})});
 if(R.errs.length)return R;
 const tids=new Set(arr(o.trips).map(t=>t.id)),mids=new Set(arr(o.members).map(m=>m.id));
 const orph=COLL.reduce((a,k)=>a+arr(o[k]).filter(x=>!tids.has(x.trip)).length,0);if(orph)R.warns.push(orph+' 筆訂單找不到所屬旅程（還原後不會顯示在任何旅程）');
 let mm=0;arr(o.fl).forEach(f=>Object.keys(obj(f.pax)).forEach(i=>{if(!mids.has(i))mm++}));arr(o.ht).forEach(h=>arr(h.rooms).forEach(r=>arr(r.members).forEach(i=>{if(!mids.has(i))mm++})));if(mm)R.warns.push(mm+' 處旅客找不到對應的成員');
 const bad=K.filter(k=>Array.isArray(o[k])).flatMap(k=>o[k].flatMap(x=>Object.entries(x).filter(([f,v])=>FLD[k][f]!==undefined&&f!='trip'&&f!='rep'&&!['pax','pp','rooms'].includes(f)&&vField(k,f,v)).map(([f])=>CNAME[k]+'「'+(itemName(k,x)||x.id)+'」的'+FLD[k][f])));
 if(bad.length)R.warns.push('有 '+bad.length+' 個欄位格式怪怪的（例如 '+bad.slice(0,3).join('、')+'），仍可還原，請之後再檢查');
 if(!arr(o.trips).length&&!arr(o.members).length)R.warns.push('這份備份沒有任何旅程和成員');
 R.data=o;return R}
function adBk(){const B=ADS.bk,c0=bkCount(db),row=(l,a,b)=>`<tr><td>${l}</td><td>${a}</td><td><b>${b}</b></td></tr>`;
 const report=B?(B.errs.length?`<div class="bkr bad"><div class="font-medium">❌ 無法還原</div><ul>${B.errs.slice(0,6).map(e=>`<li>${esc(e)}</li>`).join('')}</ul></div>`:(()=>{const c1=bkCount(B.data);return `<div class="bkr"><div class="font-medium">✅ 格式正確，還原後會變成：</div>
  <table class="bkt"><tr><th></th><th>目前</th><th>還原後</th></tr>${row('旅程',c0.trips,c1.trips)}${row('成員',c0.members,c1.members)}${row('訂單',c0.orders,c1.orders)}${row('建議行程',c0.plans,c1.plans)}</table>
  ${B.warns.length?`<ul class="bkw">${B.warns.map(w=>`<li>⚠ ${esc(w)}</li>`).join('')}</ul>`:''}
  <label class="adck"><input type="checkbox" ${ADS.bkAck?'checked':''} onchange="ADS.bkAck=this.checked;render()"><span>我了解目前的資料會<b>全部被取代</b>（訂單截圖會保留）</span></label>
  <div class="adbar"><button type="button" class="adyes" ${ADS.bkAck?'':'disabled'} onclick="bkRestore()">確定還原</button><button type="button" class="${BT}" onclick="cpText(bkPack(),'已複製目前資料')">先複製目前資料</button><button type="button" class="${BT}" onclick="ADS.bk=null;ADS.bkAck=false;render()">取消</button></div></div>`})()):'';
 return `<div class="${CC}"><div class="font-bold mb-1">備份</div><p class="text-sm text-stone-500 mb-2">資料已自動存在你的 Claude 帳號雲端。想另外留一份，可以複製全部資料存到記事本（不含訂單截圖）。</p><button type="button" class="${BP}" onclick="cpText(bkPack(),'已複製全部資料')">📋 複製全部資料</button></div>
 ${ADS.undo?`<div class="${CC} bkr"><div class="font-medium">剛剛已還原備份</div><p class="text-sm text-stone-500">發現還原錯了，可以回到還原前的資料（重新整理頁面後就不能復原）。</p><div class="adbar"><button type="button" class="${BT}" onclick="bkUndo()">↩︎ 復原到還原前</button></div></div>`:''}
 <div class="${CC}"><div class="font-bold mb-1">還原</div><p class="text-sm text-stone-500 mb-2">貼上之前複製的資料，先檢查內容，確認後才會取代目前資料。</p><textarea class="${IN} adjs" rows="5" autocapitalize="off" autocorrect="off" spellcheck="false" oninput="ADS.imp=this.value;if(ADS.bk){ADS.bk=null;ADS.bkAck=false;render()}">${esc(ADS.imp)}</textarea>
 <div class="flex gap-2 mt-2"><button type="button" class="${BT}" onclick="ADS.bk=bkCheck(ADS.imp);ADS.bkAck=false;render()">檢查備份</button></div>${report}</div>`}
function bkRestore(){const B=ADS.bk;if(!B||!B.data||B.errs.length||!ADS.bkAck||!canWrite())return;ADS.undo=JSON.stringify(db);const keep=db.imgs;applyDb(B.data);db.imgs=keep.filter(k=>ORDIMG[k]);ADS.imp='';ADS.bk=null;ADS.bkAck=false;cloudSave();tip('已還原，可在「管理 › 備份」復原');render()}
function bkUndo(){if(!ADS.undo||!canWrite())return;const keep=db.imgs;applyDb(JSON.parse(ADS.undo));db.imgs=keep.filter(k=>ORDIMG[k]);ADS.undo=null;cloudSave();tip('已回到還原前的資料');render()}
function bkImport(){ADS.bk=bkCheck(ADS.imp);ADS.bkAck=false;render()}
function toTop(){if(S.v!=='home'){go('home');return}scrollTo({top:0,behavior:'smooth'})}
