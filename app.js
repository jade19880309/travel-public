// 旅程頁面的程式。所有旅程內容都在 trips/<代號>.json，這裡只負責畫面。
const TRIP=window.TRIP,M=TRIP.meta;
// 多方案（可省略）：TRIP.plans=[{id,name,label,sub,desc,days,hotels,plan}]，每個方案各有自己的每日行程與住宿。
// 目前選的方案存在這支手機；網址加 ?p=<方案代號> 可直接指定。沒有 plans 的旅程（首爾、港珠澳）完全不受影響。
const PL=Array.isArray(TRIP.plans)&&TRIP.plans.length?TRIP.plans:null,PK=(M.store||M.id)+'p';
let PI=0;
if(PL){const q=new URLSearchParams(location.search).get('p');PI=PL.findIndex(p=>p.id===q);
 if(PI<0){try{PI=PL.findIndex(p=>p.id===JSON.parse(localStorage.getItem(PK)))}catch(e){PI=-1}}
 if(PI<0)PI=0;
 const p=PL[PI];['days','hotels','dayImages'].forEach(k=>{if(p[k])TRIP[k]=p[k]});TRIP.plan=Object.assign({},TRIP.plan,p.plan||{})}
const {kop:KOP={},tags:T={},days:D,dayImages:DI={},foods:F={},sights:S={},ko:KO={},regions:REG={},todo:TODO={},phrases:PH=[],sheets:SH={}}=TRIP;
const $=s=>document.querySelector(s);
const enc=encodeURIComponent;
const K=M.store||M.id; // 這支手機存待辦、訂位勾選用的名稱
const ls={get:(k,d)=>{try{const v=localStorage.getItem(k);return v==null?d:JSON.parse(v)}catch(e){return d}},set:(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};
const openUrl=u=>{const a=document.createElement('a');a.href=u;a.target='_blank';a.rel='noopener noreferrer';a.style.display='none';document.body.appendChild(a);a.click();a.remove()};
const esc=t=>String(t==null?'':t).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// 語音鈕圖示（只有線條圖示、不加底色；顏色跟著各旅程主題）
const SPI='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9.3h3.3L12 5.4v13.2l-4.7-3.9H4z" fill="currentColor" fill-opacity=".14"/><path class="w" d="M15.4 9.2a3.9 3.9 0 0 1 0 5.6"/><path class="w w2" d="M18.2 6.6a7.6 7.6 0 0 1 0 10.8"/></svg>';
// 行程裡可能要給當地人聽的名稱：韓文要有諺文；日文要有假名或漢字、不含英文、不是台灣用語
const LANG=String(M.lang||({seoul:'ko',tokyo:'ja',keihan:'ja'})[String(M.id).split('-')[0]]||'').slice(0,2);
const locOK=t=>{t=String(t||'');if(LANG==='ko')return /[가-힣]/.test(t);if(LANG==='ja')return /[\u3040-\u30ff\u3400-\u9fff]/.test(t)&&!/[A-Za-z]/.test(t)&&!/機場|航廈|淺|臺|灣/.test(t);return false};
const spB=t=>locOK(t)?`<button class="vo" data-say="${esc(t)}" aria-label="播放：${esc(t)}" title="${esc(t)}">${SPI}</button>`:'';
const btns=(list,extra='')=>(list||[]).map(([k,l])=>`<button class="b bt gd${extra}" data-sh="${k}">${l}</button>`).join('');

// 高德地圖（大陸地點用）：TRIP.amap = {city, places:[地點代號], regions:[美食分區], q:{地點:簡體搜尋字}}
const AM=TRIP.amap||null;
const amU=(n,q)=>`https://uri.amap.com/search?keyword=${enc((AM.q&&AM.q[n])||q||n)}&city=${enc(AM.city||'')}&src=travel-public&callnative=1`;
const amOk=n=>!!(AM&&(AM.places||[]).includes(n));
const AMI='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5a6.5 6.5 0 0 0-6.5 6.5c0 4.6 6.5 12.5 6.5 12.5S18.5 13.6 18.5 9A6.5 6.5 0 0 0 12 2.5z" fill="#fff"/><circle cx="12" cy="9" r="2.6" fill="#1e7dff"/></svg>';
// ===== 依旅程資料畫出各區塊 =====
(function build(){
 document.title=M.title;
 // 上方功能列：只列出這個旅程有的區塊
 $('#hd nav').innerHTML=(TRIP.nav||[]).map(([id,l])=>`<a href="#${id}">${l}</a>`).join('');
 document.querySelectorAll('main>section[id]').forEach(s=>{if(!(TRIP.nav||[]).some(n=>n[0]===s.id))s.remove()});
 // 區塊順序跟著上方功能列的順序走（資料裡的 nav 怎麼排，畫面就怎麼排）
 (TRIP.nav||[]).forEach(n=>{const s=document.getElementById(n[0]);if(s&&s.tagName==='SECTION')$('footer').before(s)});
 // 封面
 const h=TRIP.hero||{};
 // hero.bare＝封面圖本身已含標題：圖片完整顯示，不再疊上標題文字
 $('#hero').classList.toggle('bare',!!h.bare);
 $('#hero').innerHTML=`<img class="hero-bg" src="${h.img}" alt="${h.alt||''}">${h.seal?`<div class="seal">${h.seal}</div>`:''}${h.bare?'':`<div class="eyebrow">${h.eyebrow||''}</div><h1>${h.title||M.title}</h1>`}<p>${(h.sub||[]).map(x=>`<span>${x}</span>`).join('｜')}</p><div class="cd" id="cd"></div><p id="cdnote"></p><a class="b go" href="#plan" id="gotoday">看每日行程</a>`;
 // 標題文字
 const set=(sel,v)=>{const e=$(sel);if(e&&v!=null)e.innerHTML=v};
 const TT=TRIP.titles||{};
 Object.keys(TT).forEach(id=>set('#'+id+' h2',TT[id]));
 // 航班（登機證的配色依航空公司代碼：BR 長榮、CI 華航、KE 大韓…，樣式在 style.css）
 const alCls=t=>{const m=String(t||'').match(/\b([A-Z][A-Z0-9])\s?\d{2,4}\b/);return m?'al-'+m[1].toLowerCase():''};
 // 航班動態：點登機證方塊，直接開啟 Trip.com 的航班動態查詢
 const fnOf=t=>{const m=String(t||'').match(/\b([A-Z][A-Z0-9])\s?(\d{2,4})\b/);return m?m[1]+m[2]:''};
 const frU=n=>'https://www.trip.com/flights/status-'+n.toLowerCase()+'/';
 const FL=TRIP.flights;
 if(FL&&$('#flight'))$('#flight').insertAdjacentHTML('beforeend',`<div class="grid">${FL.list.map(f=>`<div class="card bp ${alCls(f.al)}"${fnOf(f.al)?` data-fn="${fnOf(f.al)}" role="link" tabindex="0" aria-label="${f.dir}航班 ${fnOf(f.al)}，點一下查看航班動態"`:''}><div class="bph"><span class="pill">${f.dir}</span>${f.date}<span class="al">${f.al}</span></div><div class="fl"><div><big>${f.from[0]}</big><span>${f.from[1]}</span><b>${f.from[2]}</b></div><div class="mid">${f.dur||''}</div><div class="r"><big>${f.to[0]}</big><span>${f.to[1]}</span><b>${f.to[2]}</b></div></div>${f.ac?`<div class="ac">${f.ac}</div>`:''}<small>${f.note||''}</small></div>`).join('')}</div>${FL.note?`<p class="rate" style="margin:12px 0 0">${FL.note}</p>`:''}${FL.sheets?`<div class="btns">${btns(FL.sheets)}</div>`:''}`);
 if($('#flight')){const fo=e=>{const c=e.target.closest('.bp[data-fn]');if(!c||e.target.closest('a'))return;openUrl(frU(c.dataset.fn))};
  $('#flight').addEventListener('click',fo);
  $('#flight').addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();fo(e)}})}
 // 住宿
 if(TRIP.hotels&&$('#hotel'))$('#hotel').insertAdjacentHTML('beforeend',TRIP.hotels.map((o,i)=>{const q=enc(o.mapQ||o.ko);return `<details class="card hotel"${i?' style="margin-top:12px"':''}><summary><div class="hn"><div class="hko"><b class="ko">${o.ko}</b>${spB(o.ja||(M.single?'':o.ko))}${o.pic?`<button class="pic" data-sh="${o.pic}" onclick="event.preventDefault()" aria-label="飯店相片" title="飯店相片">📷</button>`:''}</div>${o.zh?`<span class="zh">${o.zh}</span>`:''}${o.en?`<span class="en">${o.en}</span>`:''}${o.tel?`<a class="hph" href="tel:${o.tel}" onclick="event.stopPropagation()">📞 ${o.telShow||o.tel}</a>`:''}<div class="btns"><a class="b g" target="_blank" rel="noopener" onclick="event.stopPropagation()" href="https://www.google.com/maps/search/?api=1&query=${q}">Google 地圖</a>${o.naver===false?'':`<a class="b" target="_blank" rel="noopener" onclick="event.stopPropagation()" href="https://map.naver.com/p/search/${q}">Naver 地圖</a>`}${amOk(o.ko)?`<a class="b am" target="_blank" rel="noopener" onclick="event.stopPropagation()" href="${amU(o.ko,o.mapQ||o.ko)}">高德地圖</a>`:''}</div></div></summary><div class="hbody">${o.addr?`<div class="blk"><div class="hn ha"><b class="ko">${o.addr[0]}</b>${o.addr[1]?`<span class="zh">${o.addr[1]}</span>`:''}${o.addr[2]?`<span class="en">${o.addr[2]}</span>`:''}</div>${o.big?`<div class="btns"><button class="b bt dk" data-big="${i}">🔍 放大地址給司機看</button></div>`:''}</div>`:''}${o.tel?`<div class="blk"><div class="lb">📞 飯店電話</div><a class="tel" href="tel:${o.tel}">${o.telShow||o.tel}</a></div>`:''}${(o.blocks||[]).map(b=>`<div class="blk"><div class="lb">${b[0]}</div>${b[1]}</div>`).join('')}${o.sheets?`<div class="btns">${btns(o.sheets)}</div>`:''}</div></details>`}).join(''));
 // 行程
 const P=TRIP.plan||{};
 if($('#plan'))$('#plan h2').insertAdjacentHTML('afterend',`<p class="rate">${P.note||'點任一天展開當天行程；也可用畫面最下方的日期列隨時切換。'}</p>${P.sheets?`<div class="btns" style="margin:0 0 14px">${btns(P.sheets,' mapbtn')}</div>`:''}`);
 // 方案切換：放在每日行程最上方；住宿區塊標示目前是哪個方案
 if(PL&&$('#plan')){const c=PL[PI];
  $('#plan h2').insertAdjacentHTML('afterend',`<div class="card plans"><div class="plh">${TRIP.planHead||'行程方案・點選切換比較'}</div><div class="plb n${PL.length}">${PL.map((p,i)=>`<button data-pl="${i}" class="${i===PI?'on':''}" aria-pressed="${i===PI}">${p.ic?`<img class="pic" src="${TRIP.icBase||''}${p.ic}.svg" alt="">`:''}<b>${p.name}</b><span>${(p.label||'').replace('・','<br>')}</span>${p.sub?`<small>${p.sub}</small>`:''}</button>`).join('')}</div>${c.desc?`<p class="pld">${c.desc}</p>`:''}</div>`);
  $('#plan .plans').onclick=e=>{const b=e.target.closest('[data-pl]');if(!b||+b.dataset.pl===PI)return;
   try{localStorage.setItem(PK,JSON.stringify(PL[+b.dataset.pl].id));sessionStorage.setItem(PK+'go','1')}catch(_){}
   const u=new URL(location.href);u.searchParams.delete('p');u.hash='';if(u.href===location.href.split('#')[0])location.reload();else location.replace(u.href)};
  if(c.hotels&&$('#hotel'))$('#hotel h2').insertAdjacentHTML('afterend',`<p class="rate">目前顯示<b>${c.name}${c.label?' '+c.label:''}</b>的住宿，<a href="#plan">到每日行程切換方案</a>。</p>`);
  let go=null;try{go=sessionStorage.getItem(PK+'go');sessionStorage.removeItem(PK+'go')}catch(_){}
  if(go)setTimeout(()=>$('#plan').scrollIntoView({block:'start'}),60)}
 // 價格／預算、注意事項、App：自由格式內容
 const HT=TRIP.html||{};
 if(HT.price&&$('#price'))$('#price').insertAdjacentHTML('beforeend',HT.price);
 if(HT.tips&&$('#tips'))$('#tips .grid').insertAdjacentHTML('afterbegin',HT.tips);
 if(HT.apps&&$('#apps'))$('#apps').insertAdjacentHTML('beforeend',HT.apps);

 // Workman 專區（東京）：TRIP.workman，整區折疊；依 routes 分路線，地圖用 Leaflet＋OpenStreetMap（依路線上色、圖例可開關），第一次打開才載入，沒網路時請用每間的 Google 地圖按鈕
 const WM=TRIP.workman;
 if(WM&&$('#workman')){let no=0;const all=[];
  const gm=q=>'https://www.google.com/maps/search/?api=1&query='+enc(q);
  const RT=(WM.routes&&WM.routes.length)?WM.routes:[{id:'',name:'',short:'全部',color:'#c0392b'}];
  const stH=(o,r)=>{no++;all.push({no,o,r});return `<div class="blk wms"><div class="wmh"><span class="wmno" style="background:${r.color}">${no}</span><b>${esc(o.n)}</b>${spB(o.ja)}<span class="wmt">${esc(o.type)}</span></div><div>${esc(o.acc)}</div>${o.tip?`<small>${esc(o.tip)}</small>`:''}<div class="btns"><a class="b g" target="_blank" rel="noopener" href="${gm(o.q||o.ja||o.n)}">Google 地圖</a></div></div>`};
  const gH=RT.map(r=>{const gs=(WM.groups||[]).filter(g=>(g.route||RT[0].id)===r.id);if(!gs.length)return '';
   return (r.name?`<div class="wmr" style="--rc:${r.color}"><b>${esc(r.name)}</b>${r.sub?`<small>${esc(r.sub)}</small>`:''}</div>`:'')+gs.map(g=>`<details class="wmg"><summary><b>${esc(g.name)}</b><small>${esc(g.hint||'')}・${g.stores.length} 間</small></summary>${g.stores.map(o=>stH(o,r)).join('')}</details>`).join('')}).join('');
  const lg=RT.filter(r=>all.some(a=>a.r===r&&typeof a.o.lat==='number')).map(r=>`<button type="button" class="wmlg on" aria-pressed="true" data-rt="${esc(r.id)}" style="--rc:${r.color}"><i></i>${esc(r.short||r.name)}</button>`).join('');
  $('#workman').insertAdjacentHTML('beforeend',`${WM.intro?`<p class="rate">${esc(WM.intro)}</p>`:''}<details class="card fold wm"><summary>🧥 ${esc(WM.title||'Workman 店家')}（${all.length} 間）・點開看</summary><div class="wmin">${WM.note?`<p class="wmn">${esc(WM.note)}</p>`:''}<div class="btns" style="margin:0 0 12px"><a class="b g" target="_blank" rel="noopener" href="${gm(WM.search||'ワークマン')}">Google 地圖搜尋附近</a></div><details class="wmg wmmapd"><summary><b>🗺 看地圖</b><small>依路線上色，點下方按鈕可開關（需要網路）</small></summary><div class="wm-map" id="wmmap"></div><div class="wmleg">${lg}</div><p class="wmn" id="wmmsg" hidden></p></details>${gH}</div></details>`);
  const mapd=$('.wmmapd');let mp=null;const lay={};
  const loadLF=()=>window.L?Promise.resolve():new Promise((ok,no2)=>{const c=document.createElement('link');c.rel='stylesheet';c.href='https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css';document.head.appendChild(c);const j=document.createElement('script');j.src='https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js';j.onload=ok;j.onerror=no2;document.head.appendChild(j)});
  const fit=()=>{if(!mp)return;const p=all.filter(a=>typeof a.o.lat==='number'&&mp.hasLayer(lay[a.r.id])).map(a=>[a.o.lat,a.o.lon]);if(p.length)mp.fitBounds(p,{padding:[24,24]});setTimeout(()=>mp.invalidateSize(),80)};
  mapd.addEventListener('toggle',()=>{if(!mapd.open)return;
   if(mp){setTimeout(()=>mp.invalidateSize(),50);return}
   loadLF().then(()=>{const L=window.L;mp=L.map('wmmap',{scrollWheelZoom:false}).setView([35.69,139.76],9);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:18,attribution:'© OpenStreetMap'}).addTo(mp);
    RT.forEach(r=>{lay[r.id]=L.layerGroup().addTo(mp)});
    all.forEach(({no:n,o,r})=>{if(typeof o.lat!=='number')return;L.marker([o.lat,o.lon],{icon:L.divIcon({className:'',html:`<span class="wmpin${o.rough?' rough':''}" style="background:${r.color}">${n}</span>`,iconSize:[28,28],iconAnchor:[14,14]})}).addTo(lay[r.id]).bindPopup(`<b>${esc(o.n)}</b><br>${esc(o.type)}${r.short?`・${esc(r.short)}`:''}${o.rough?'<br><small>位置是概略，請以 Google 地圖為準</small>':''}<br><a target="_blank" rel="noopener" href="${gm(o.q||o.ja||o.n)}">Google 地圖</a>`)});
    fit()
   }).catch(()=>{$('#wmmsg').hidden=false;$('#wmmsg').textContent='地圖載入失敗（可能沒有網路）。請用每間店的「Google 地圖」按鈕。'})});
  $('.wmleg').addEventListener('click',e=>{const b=e.target.closest('[data-rt]');if(!b||!mp)return;const g=lay[b.dataset.rt];if(!g)return;const on=!mp.hasLayer(g);on?mp.addLayer(g):mp.removeLayer(g);b.classList.toggle('on',on);b.setAttribute('aria-pressed',on?'true':'false');fit()})}
 // 美食景點、韓語
 const FD=TRIP.food||{};
 if(FD.seg){const b=$('#seg').children;b[0].innerHTML=FD.seg[0];b[1].innerHTML=FD.seg[1]}
 if(FD.sightNote)set('#ps .note',FD.sightNote);
 if(!Object.keys(S).length&&$('#seg'))$('#seg').remove();
 if(TRIP.phrNote)set('#phr .rate',TRIP.phrNote);
 set('footer',TRIP.footer||'');
 // 插圖橫幅（可省略）：TRIP.banners={區塊id: HTML}，放在該區塊標題正下方
 const BN=TRIP.banners||{};Object.keys(BN).forEach(id=>{const h2=$('#'+id+' h2');if(h2)h2.insertAdjacentHTML('afterend',BN[id])});
 // 其他旅程（meta.hideOthers：不列其他旅程與總覽連結）
 if(!M.hideOthers)fetch('trips/index.json',{cache:'no-cache'}).then(r=>r.json()).then(L=>{const o=L.filter(t=>t.id!==M.id);if(o.length)$('footer').insertAdjacentHTML('beforeend',`<div class="trips">其他旅程：${o.map(t=>`<a href="${t.url||'?t='+t.id}">${t.title}</a>`).join('')}<a href="home.html">全部旅程總覽</a></div>`)}).catch(()=>{});
})();

// ===== 目前當地天氣（Open-Meteo，免金鑰）：封面下方一條；沒網路時顯示上次的結果 =====
(function(){
 const W=TRIP.weather;if(!W||!W.length||!$('#hero'))return;
 const box=document.createElement('div');box.id='wx';box.className='card wx';$('#hero').after(box);
 const KEY=K+'-wx';
 const wmo=(c,day)=>{
  if(c===0)return[day?'☀️':'🌙','晴'];if(c===1)return[day?'🌤':'🌙','晴時多雲'];if(c===2)return['⛅','多雲'];if(c===3)return['☁️','陰'];
  if(c===45||c===48)return['🌫','霧'];if(c>=51&&c<=57)return['🌦','毛毛雨'];
  if(c===61)return['🌧','小雨'];if(c===63)return['🌧','中雨'];if(c===65)return['🌧','大雨'];if(c===66||c===67)return['🌧','凍雨'];
  if(c===71)return['🌨','小雪'];if(c===73)return['🌨','中雪'];if(c===75)return['❄️','大雪'];if(c===77)return['🌨','雪粒'];
  if(c>=80&&c<=82)return['🌦','陣雨'];if(c===85||c===86)return['🌨','陣雪'];if(c>=95)return['⛈','雷雨'];return['🌡','—'];
 };
 const r=n=>Math.round(n);
 function draw(L,ts,old){
  const t=new Date(ts),hm=`${t.getMonth()+1}/${t.getDate()} ${String(t.getHours()).padStart(2,'0')}:${String(t.getMinutes()).padStart(2,'0')}`;
  const kind=c=>c<=1?'sun':c<=3?'cloud':c<=48?'fog':(c>=71&&c<=77)||c===85||c===86?'snow':c>=95?'storm':'rain';
  box.innerHTML=`<div class="wxh"><b>目前當地天氣</b><span>${old?'離線・':''}${hm} 更新</span></div><div class="wxg n${L.length}">${L.map((d,i)=>{const c=d.current,y=d.daily,[ic,tx]=wmo(c.weather_code,c.is_day),pp=y.precipitation_probability_max[0];
   return `<div class="wxc k-${kind(c.weather_code)}"><div class="wxtop"><span class="wxn">${W[i].name}</span><span class="wxk">${tx}</span></div><div class="wxt"><i>${ic}</i><b>${r(c.temperature_2m)}<sup>°</sup></b></div><div class="wxd"><div class="wxr"><span>體感</span><em>${r(c.apparent_temperature)}°</em></div><div class="wxr"><span>氣溫</span><em><u class="lo">${r(y.temperature_2m_min[0])}</u>～<u class="hi">${r(y.temperature_2m_max[0])}°</u></em></div><div class="wxr"><span>降雨</span><em>${pp??'—'}%</em></div><div class="wxbar"><s style="width:${Math.min(100,pp||0)}%"></s></div></div></div>`}).join('')}</div>`;
 }
 function load(){
  const u='https://api.open-meteo.com/v1/forecast?latitude='+W.map(w=>w.lat).join(',')+'&longitude='+W.map(w=>w.lon).join(',')+'&current=temperature_2m,apparent_temperature,weather_code,is_day&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto&forecast_days=1';
  fetch(u).then(x=>x.json()).then(j=>{const L=Array.isArray(j)?j:[j];if(!L[0]||!L[0].current)throw 0;const ts=Date.now();ls.set(KEY,{L,ts});draw(L,ts,false)})
   .catch(()=>{const c=ls.get(KEY,null);if(c)draw(c.L,c.ts,true);else box.innerHTML='<div class="wxh"><b>目前當地天氣</b><span>暫時無法取得，連上網路後會自動顯示</span></div>'});
 }
 const c=ls.get(KEY,null);if(c)draw(c.L,c.ts,true);
 load();
 setInterval(()=>{if(!document.hidden)load()},30*60*1000);
 document.addEventListener('visibilitychange',()=>{const c=ls.get(KEY,null);if(!document.hidden&&(!c||Date.now()-c.ts>15*60*1000))load()});
})();

// ===== 地圖連結小圖示（藍色＝Google 地圖、綠色 N＝Naver 地圖）=====
const PIN='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5a6.5 6.5 0 0 0-6.5 6.5c0 4.6 6.5 12.5 6.5 12.5S18.5 13.6 18.5 9A6.5 6.5 0 0 0 12 2.5z" fill="#fff"/><circle cx="12" cy="9" r="2.6" fill="#1a73e8"/></svg>';
const NAV=M.naver!==false;
const mp=n=>`<span class="maps"><a class="mi g" target="_blank" rel="noopener" aria-label="用 Google 地圖開啟" title="Google 地圖" href="https://www.google.com/maps/search/?api=1&query=${enc(KOP[n]||n)}">${PIN}</a>${NAV?`<a class="mi n" target="_blank" rel="noopener" aria-label="用 Naver 地圖開啟" title="Naver 地圖" href="https://map.naver.com/p/search/${enc(KOP[n]||n)}">N</a>`:''}${amOk(n)?`<a class="mi a" target="_blank" rel="noopener" aria-label="用高德地圖開啟" title="高德地圖" href="${amU(n,KOP[n]||n)}">高</a>`:''}</span>`;
// 用餐方塊：點一下直接跳到「美食」區塊（並自動切到對應區域）
const MEAL=/早餐|午餐|晚餐|宵夜|早午餐|點心/;
const flash=el=>{if(!el)return;el.classList.remove('flash');void el.offsetWidth;el.classList.add('flash')};
const goSec=(id,after)=>{const el=document.getElementById(id);if(!el)return;el.scrollIntoView({behavior:'smooth',block:'start'});flash(el.querySelector('h2'));if(after)after(el)};
const clean=t=>String(t).replace(/[\u{1F000}-\u{1FFFF}\u2600-\u27BF\uFE0F]/gu,'').trim();
// 依這一格（標題、地點，找不到再看當天標題）比對美食分頁；沒有對應區域就回傳 null，該方塊不放連結
function foodKey(k,x){
 const d=D[k],keys=Object.keys(F||{});if(!keys.length)return null;
 const toks=key=>clean(key).split(/[／/、・]/).map(w=>w.trim()).filter(w=>w.length>1);
 // 早餐列優先連到名稱含「早餐」的分頁；午餐、晚餐等不連到早餐分頁
 const hit=txt=>{const bf=/早餐/.test(txt)&&!/早午餐/.test(txt),ks=keys.filter(key=>bf||!key.includes('早餐'));
  return (bf&&ks.find(key=>key.includes('早餐')))||ks.find(key=>toks(key).some(w=>txt.includes(w)))||null};
 return hit(x[1]+' '+(x[3]||''))||(d.ab?null:hit(d.s+' '+d.h))}
function goFood(k,x){
 const key=foodKey(k,x);if(!key)return;
 goSec('food',()=>{
  const sg=$('#seg');if(sg&&$('#pf')&&$('#pf').hidden)sg.children[0].click();
  const g=key.includes('・')?key.split('・')[0]:key,pick=(sel,txt)=>{const t=[...($(sel)||{children:[]}).children].find(x=>x.textContent===txt);if(t&&!t.classList.contains('on'))t.click()};
  pick('#ftabs',g);if(g!==key)pick('#fsub',key.slice(g.length+1))})}
const tagH=x=>String(x||'').split(',').filter(k=>T[k]).map(k=>`<span class="tag" style="background:${T[k][1]}">${T[k][0]}</span>`).join('');

// ===== 每日行程 =====
let day=-1,ab='A'; // 預設全部折疊；旅程期間打開網頁時，下面會自動展開「今天」
const dbox=$('#days');
dbox.innerHTML=D.map((d,k)=>{const p=d.t.split(' ');return `<div class="dy" id="dy${k}"><button class="dr" data-k="${k}">${d.ic?`<img class="dic" src="${TRIP.icBase||''}${d.ic}.svg" alt="">`:''}<b>${p[0]} ${p[1]}</b><span class="ds">${d.s}</span>${d.g?`<span class="tg"><span class="pill">${d.g[0]}</span>${d.g[1]?`<span class="pill tw">${d.g[1]}</span>`:''}</span>`:''}</button><div class="dp" hidden></div></div>`}).join('');
function panel(k){
 const d=D[k],items=d.ab?d[ab]:d.i,im=DI[d.ab?k+ab:k],abL=d.abL||['A 方案','B 方案'];
 const food=!!document.getElementById('food');
 const tl=items.map((x,i)=>{const meal=food&&MEAL.test(x[1])&&!!foodKey(k,x);return `<li class="${meal?'meal':''}" data-i="${i}"><span class="tm">${x[0]}</span><div class="tc">${x[1]}${tagH(x[2])}${x[3]?mp(x[3]).replace(/<\/span>$/,spB(KOP[x[3]]||x[3])+'</span>'):''}${x[3]&&KOP[x[3]]&&M.kop!==false?'<small class="kp">'+KOP[x[3]]+'</small>':''}${meal?'<span class="lh" aria-hidden="true">🍴 看美食推薦 ↓</span>':''}</div></li>`}).join('');
 return `<h3>${d.h}</h3>`
  +(d.lead?`<p class="lead">${d.lead}</p>`:'')
  +(d.ab?`<div class="ab"><button data-v="A" class="${ab==='A'?'on':''}">${abL[0]}</button><button data-v="B" class="${ab==='B'?'on':''}">${abL[1]}</button></div><p class="rate" style="margin:0 0 8px">${d.abN||'依天氣、路況二選一。'}</p>`:'')
  +(im?`<div class="btns" style="margin:0 0 10px"><button class="b bt gd mapbtn" data-img="${im}">🖼 當日行程圖</button></div>`:'')
  +`<ul class="tl">${tl}</ul>`
  +(d.x||[]).map(b=>`<details class="dx"><summary>${b[0]}</summary><div>${b[1]}</div></details>`).join('')
  +`<div class="note">${d.ab?(ab==='A'?d.nA:d.nB):d.n}</div>`
  +`<div class="dn">${k>0?`<button data-go="${k-1}">← 前一天</button>`:''}${k<D.length-1?`<button data-go="${k+1}">下一天 →</button>`:''}</div>`;
}
const dbtn=$('#dbtn');
D.forEach((d,k)=>{const b=document.createElement('button'),p=d.t.split(' ');b.innerHTML=p[0]+'<small>週'+p[1]+'</small>';b.setAttribute('aria-label',p[0]+' 週'+p[1]+' 行程');b.onclick=()=>{day=k;render(true)};dbtn.append(b)});
function render(scroll){
 [...dbtn.children].forEach((b,k)=>b.classList.toggle('on',k===day));
 [...dbox.children].forEach((el,k)=>{const on=k===day,p=el.querySelector('.dp');el.classList.toggle('on',on);p.hidden=!on;p.innerHTML=on?panel(k):''});
 if(scroll&&day>=0)requestAnimationFrame(()=>$('#dy'+day).scrollIntoView({behavior:'smooth',block:'start'}));
}
dbox.addEventListener('click',e=>{
 const r=e.target.closest('.dr');if(r){const k=+r.dataset.k;day=day===k?-1:k;render(true);return}
 const v=e.target.closest('[data-v]');if(v){ab=v.dataset.v;render(false);return}
 const g=e.target.closest('[data-go]');if(g){day=+g.dataset.go;render(true);return}
 const im=e.target.closest('[data-img]');if(im){openLB(im.dataset.img);return}
 const li=e.target.closest('.tl li.meal');
 if(li&&!e.target.closest('a,.maps')){const k=+li.closest('.dy').id.slice(2),d=D[k],items=d.ab?d[ab]:d.i;goFood(k,items[+li.dataset.i])}
});
// 站內連結：data-to＝捲到指定卡片（價格卡、美食等）；data-day（可加 data-ab）＝切到某天行程
document.addEventListener('click',e=>{const a=e.target.closest('a[data-to],a[data-day]');if(!a)return;e.preventDefault();
 if(a.dataset.day!==undefined){day=+a.dataset.day;if(a.dataset.ab)ab=a.dataset.ab;render(true);return}
 const t=document.getElementById(a.dataset.to);if(!t)return;t.scrollIntoView({behavior:'smooth',block:'center',inline:'center'});flash(t)});
{const n=new Date(),yr=+M.start.slice(0,4),k=D.findIndex(d=>d.t.split(' ')[0]===(n.getMonth()+1)+'/'+n.getDate()),go=$('#gotoday');
 if(n.getFullYear()===yr&&k>=0){day=k;setTimeout(()=>{dbtn.children[k].innerHTML=D[k].t.split(' ')[0]+'<small>今天</small>'},0);go.textContent='看今天行程'}
 go.onclick=e=>{e.preventDefault();if(day<0)day=0;render(true)}}

// ===== 美食與景點 =====
const first=o=>{const ks=Object.keys(o),s=ks.filter(k=>k.includes('海鮮'));return [...s,...ks.filter(k=>!s.includes(k))]};
function tabs(el,keys,draw){const box=$(el);if(!box)return;keys.forEach((k,i)=>{const b=document.createElement('button');b.textContent=k;b.onclick=()=>{[...box.children].forEach(c=>c.classList.remove('on'));b.classList.add('on');draw(k)};box.append(b);if(!i)b.click()})}
// meta.single＝true：全程同一種語言，不顯示第二個名稱（當地語言副標）
const kn=(kind,x)=>M.single?'':(kind==='f'?x[1]:(x[3]||KO[x[0]]||''));
let R=ls.get(K+'r',{});
const LD={};
function listDraw(sel,arr,sea,kind){const box=$(sel);box.className='pl';LD[kind]=[sel,arr,sea];
 box.innerHTML=arr.map((x,i)=>{const k=kn(kind,x);return `<button class="pi" data-i="${i}"><span>${kind==='f'&&R[x[0]]?'✅ ':''}${k||x[0]}${sea?' 🦐':''}${k&&k!==x[0]?`<small>${x[0]}</small>`:''}${(sea||M.regionAll)&&REG[x[0]]?`<small>📍 ${REG[x[0]]}</small>`:''}</span></button>`}).join('');
 box.onclick=e=>{const b=e.target.closest('.pi');if(b)openSheet(kind,arr[b.dataset.i])}}
function openSheet(kind,x){
 // 美食：第 6 欄（可省略）＝指定分店的定位搜尋字；第 7 欄＝訂位連結（網址或 tel:）
 const f=kind==='f',name=x[0],ko=kn(kind,x),q=(f&&x[5])||(kind==='s'&&x[4])||(/[가-힣]/.test(ko)?ko:name),hg=/[가-힣]/.test(ko)||(M.bigAll&&ko);
 const rows=f?[['🍴','特色',x[2]],['🕒','營業時間',x[3]],['📍','地址',x[4]]]:[['🕒','開放時間',x[1]],['📝','備註',x[2]]];
 if(REG[name])rows.unshift(['📍','區域',REG[name]]);
 $('#sbody').innerHTML='<h3>'+(ko||name)+spB(ko)+'</h3>'+(ko&&ko!==name?'<p class="ko">'+name+'</p>':'')
  +rows.filter(r=>r[2]).map(r=>`<div class="sr"><span>${r[0]}</span><div><small>${r[1]}</small>${r[2]}</div></div>`).join('')
  +`<div class="sbt"><a class="b g" target="_blank" rel="noopener" href="https://www.google.com/maps/search/?api=1&query=${enc(q)}">Google 地圖</a>${NAV?`<a class="b" target="_blank" rel="noopener" href="https://map.naver.com/p/search/${enc(q)}">Naver 地圖</a>`:''}${AM&&(amOk(name)||(f&&(AM.regions||[]).some(r=>(F[r]||[]).includes(x))))?`<a class="b am" target="_blank" rel="noopener" href="${amU(name,q)}">高德地圖</a>`:''}${f&&x[6]?(/^tel:/.test(x[6])?`<a class="b bt gd" href="${x[6]}">📞 打電話訂位</a>`:`<a class="b bt gd" target="_blank" rel="noopener" href="${x[6]}">📅 線上訂位</a>`):''}${hg?'<button class="b bt dk" id="sbig">🔍 放大給人看</button>':''}${f&&M.reserve!==false?`<button class="b" id="srv" style="background:${R[name]?'#2c7a54':'#6b5d55'}">${R[name]?'✅ 已訂位':'☐ 標記已訂位'}</button>`:''}</div>`;
 const sb=$('#sbig');if(sb)sb.onclick=()=>showBig(ko,name);
 const sr=$('#srv');if(sr)sr.onclick=()=>{R[name]=!R[name];ls.set(K+'r',R);openSheet(kind,x);const L=LD[kind];if(L)listDraw(L[0],L[1],L[2],kind)};
 $('#sheet').classList.add('on');$('#sheet .sp').scrollTop=0}
function closeSheet(){$('#sheet').classList.remove('on')}
$('#sheet .sbd').onclick=closeSheet;$('#sheet .sx').onclick=closeSheet;
addEventListener('keydown',e=>{if(e.key==='Escape')closeSheet()});
// 美食分頁：名稱含「・」的分成兩層（「明洞・早餐」「明洞・其他」→ 上層「明洞」，下層「早餐／其他」）
{const box=$('#ftabs'),FK=first(F);if(box){const sub=document.createElement('div');sub.className='tabs sub';sub.id='fsub';sub.hidden=true;box.after(sub);
 const grp=k=>k.includes('・')?k.split('・')[0]:k,show=k=>listDraw('#flist',F[k],k.includes('海鮮'),'f');
 tabs('#ftabs',[...new Set(FK.map(grp))],g=>{const ks=FK.filter(k=>grp(k)===g);sub.innerHTML='';
  if(ks.length===1&&ks[0]===g){sub.hidden=true;show(g);return}
  sub.hidden=false;tabs('#fsub',ks.map(k=>k.slice(g.length+1)),x=>show(g+'・'+x))})}}
tabs('#stabs',first(S),k=>listDraw('#slist',S[k],k.includes('海鮮'),'s'));
if($('#seg'))$('#seg').onclick=e=>{const b=e.target.closest('button');if(!b)return;[...$('#seg').children].forEach(x=>x.classList.toggle('on',x===b));$('#pf').hidden=b.dataset.p!=='f';$('#ps').hidden=b.dataset.p!=='s'};

// ===== 待辦（只存在這支手機）=====
let st=ls.get(K+'t',{})||{};
function drawTodo(){$('#todolist').innerHTML=Object.keys(TODO).map(g=>{const l=TODO[g],n=l.filter(t=>st[t]).length;return `<details class="td"><summary>${g} <small class="cnt">${n}/${l.length}</small></summary>`+l.map(t=>`<label><input type="checkbox" data-t="${t}" ${st[t]?'checked':''}><span>${t}</span></label>`).join('')+'</details>'}).join('')}
if($('#todolist')){drawTodo();
$('#todolist').onchange=e=>{st[e.target.dataset.t]=e.target.checked;ls.set(K+'t',st);const d=e.target.closest('details'),l=[...d.querySelectorAll('input')];d.querySelector('.cnt').textContent=l.filter(i=>i.checked).length+'/'+l.length}}

// ===== 出發倒數 =====
const CD=(TRIP.hero||{}).cd||{};
function tick(){const ms=new Date(CD.start)-new Date();
 if(!(ms>0)){$('#cd').innerHTML='';$('#cdnote').textContent=new Date()>new Date(CD.end)?'🏠 旅程結束，歡迎回家！':'🛫 旅程進行中，玩得開心！';return}
 const s=Math.floor(ms/1e3),v=[[Math.floor(s/86400),'天'],[Math.floor(s%86400/3600),'時'],[Math.floor(s%3600/60),'分'],[s%60,'秒']];
 $('#cd').innerHTML=v.map(x=>`<div><b>${x[0]}</b><span>${x[1]}</span></div>`).join('');$('#cdnote').textContent='距離出發（'+(CD.label||'起飛')+'）還有';}
if(CD.start){tick();setInterval(tick,1000)}

// ===== 常用語句：點一下全螢幕放大 =====
// 語音播放：用手機內建的語音引擎朗讀（不需網路；韓語、日語各自用對應語言）
const VL=M.lang||({seoul:'ko-KR',tokyo:'ja-JP',keihan:'ja-JP'})[String(M.id).split('-')[0]]||'';
const TTS=!!(VL&&'speechSynthesis' in window&&window.SpeechSynthesisUtterance);
let VOICES=[];if(TTS){const lv=()=>{try{VOICES=speechSynthesis.getVoices()||[]}catch(e){}};lv();try{speechSynthesis.addEventListener('voiceschanged',lv)}catch(e){}}
function vdiag(){const m=['speechSynthesis：'+('speechSynthesis' in window?'有':'沒有'),'語音物件：'+(window.SpeechSynthesisUtterance?'有':'沒有'),'主畫面 App：'+((navigator.standalone||(matchMedia&&matchMedia('(display-mode: standalone)').matches))?'是':'否')];
 const e=document.createElement('div');e.style.cssText='position:fixed;left:16px;right:16px;bottom:calc(96px + env(safe-area-inset-bottom,0px));z-index:300;padding:12px 14px;border-radius:14px;background:rgba(40,36,60,.95);color:#fff;font-size:13px;line-height:1.7;white-space:pre-line';
 e.textContent='這個瀏覽器目前無法播放語音\n'+m.join('\n')+'\n（請把這個畫面截圖給我）';document.body.appendChild(e);setTimeout(()=>e.remove(),9000)}
function speak(t,btn){if(!VL)return;if(!TTS){vdiag();return}
 const txt=String(t).replace(/〇+/g,'').replace(/\s+/g,' ').trim();if(!txt)return;
 try{speechSynthesis.cancel();
  const u=new SpeechSynthesisUtterance(txt),lg=VL.toLowerCase(),pre=lg.split('-')[0];u.lang=VL;u.rate=.85;
  const v=VOICES.find(v=>v.lang.replace('_','-').toLowerCase()===lg)||VOICES.find(v=>v.lang.toLowerCase().startsWith(pre));if(v)u.voice=v;
  document.querySelectorAll('.vo.on').forEach(x=>x.classList.remove('on'));
  if(btn){btn.classList.add('on');u.onend=u.onerror=()=>btn.classList.remove('on')}
  speechSynthesis.speak(u)}catch(e){}}
{const pr=$('#phr .rate');if(VL&&pr)pr.insertAdjacentHTML('beforeend','按右邊喇叭可聽發音。');if(pr)pr.insertAdjacentHTML('beforeend','清單左右滑動可切換分類。')}
const SPK=VL?'<button class="vo" aria-label="播放語音" title="播放語音">'+SPI+'</button>':'';
// meta.phrFold＝數字：每個分類只先顯示前幾句，其餘折疊（東京使用）；展開狀態切換分類時保留
const PF=+M.phrFold||0;let pOpen=false;
tabs('#ptabs',PH.map(c=>c[0]),k=>{const c=PH.find(x=>x[0]===k)[1];const box=$('#plist'),fold=PF&&c.length>PF+1;
 box.classList.toggle('open',!fold||pOpen);
 box.innerHTML=c.map((x,i)=>`<div class="pw${fold&&i>=PF?' fx':''}"><button class="pi" data-i="${i}"><span>${x[1]}${x[2]?`<small>${x[2]}</small>`:''}</span></button>${SPK.replace('class="vo"','class="vo" data-i="'+i+'"')}</div>`).join('')+(fold?`<button class="pmore" aria-expanded="${pOpen}">${pOpen?'收起':'看全部 '+c.length+' 句'}<span>${pOpen?'▴':'▾'}</span></button>`:'');
 box.onclick=e=>{const mo=e.target.closest('.pmore');if(mo){pOpen=!pOpen;box.classList.toggle('open',pOpen);mo.setAttribute('aria-expanded',pOpen);mo.innerHTML=(pOpen?'收起':'看全部 '+c.length+' 句')+'<span>'+(pOpen?'▴':'▾')+'</span>';if(!pOpen)$('#phr').scrollIntoView({block:'start',behavior:'smooth'});return}
  const sp=e.target.closest('.vo');if(sp){speak(c[sp.dataset.i][0],sp);return}
  const b=e.target.closest('.pi');if(!b)return;const x=c[b.dataset.i];showBig(x[0],x[1])}});
function showBig(a,b){const z=$('#big');z.querySelector('b').textContent=a;z.querySelector('small').textContent=b;
 let sp=z.querySelector('.vo');if(VL){if(!sp){sp=document.createElement('button');sp.className='vo';sp.setAttribute('aria-label','播放語音');sp.innerHTML=SPI;sp.onclick=e=>{e.stopPropagation();speak(z.querySelector('b').textContent,sp)};z.appendChild(sp)}}
 z.classList.add('on')}
document.addEventListener('click',e=>{const s=e.target.closest('[data-say]');if(s){e.preventDefault();e.stopPropagation();speak(s.dataset.say,s)}},true);
$('#big').onclick=()=>{$('#big').classList.remove('on');if(TTS)try{speechSynthesis.cancel()}catch(e){}};
document.addEventListener('click',e=>{const h=e.target.closest('[data-big]');if(h){const o=TRIP.hotels[h.dataset.big];showBig(o.big[0],o.big[1])}});
// ===== 分頁清單左右滑動切換（常用語句、美食、備用景點）=====
function swipeTabs(area,step){const el=$(area);if(!el)return;let x0=null,y0=0,t0=0;
 el.addEventListener('touchstart',e=>{if(e.touches.length!==1){x0=null;return}x0=e.touches[0].clientX;y0=e.touches[0].clientY;t0=Date.now()},{passive:true});
 el.addEventListener('touchend',e=>{if(x0===null)return;const t=e.changedTouches[0],dx=t.clientX-x0,dy=t.clientY-y0;x0=null;
  if(Math.abs(dx)<50||Math.abs(dx)<Math.abs(dy)*1.5||Date.now()-t0>800)return;
  if(step(dx<0?1:-1)){el.classList.remove('swl','swr');void el.offsetWidth;el.classList.add(dx<0?'swl':'swr')}},{passive:true})}
const tabMove=(sel,d,last)=>{const box=$(sel);if(!box||box.hidden)return false;const bs=[...box.children],i=bs.findIndex(b=>b.classList.contains('on')),j=last===undefined?i+d:last;
 if(i<0||j<0||j>=bs.length)return false;const b=bs[j];b.click();b.scrollIntoView({block:'nearest',inline:'center',behavior:'smooth'});return true};
swipeTabs('#plist',d=>tabMove('#ptabs',d));
swipeTabs('#slist',d=>tabMove('#stabs',d));
// 美食有兩層：先在下層（例：明洞的早餐／其他）切換，到頭再換上層；往回切到上一組時停在它的最後一個下層
swipeTabs('#flist',d=>{if(tabMove('#fsub',d))return true;if(!tabMove('#ftabs',d))return false;
 if(d<0){const sb=$('#fsub');if(sb&&!sb.hidden&&sb.children.length>1)tabMove('#fsub',0,sb.children.length-1)}return true});
if('serviceWorker' in navigator&&/^https?:/.test(location.protocol))navigator.serviceWorker.register('sw.js').catch(()=>{});

// ===== 圖片檢視器：雙指縮放、拖曳、連點放大、滾輪縮放 =====
(function(){
const lb=$('#lb'),li=lb.querySelector('img'),P=new Map();
let sc=1,fit=1,tx=0,ty=0,pd=0,pm=null,moved=0,lt=0;
const dm=()=>[li.naturalWidth||1,li.naturalHeight||1];
function apply(){const W=lb.clientWidth,H=lb.clientHeight,[w,h]=dm(),iw=w*sc,ih=h*sc;
 tx=iw<=W?(W-iw)/2:Math.min(0,Math.max(W-iw,tx));ty=ih<=H?(H-ih)/2:Math.min(0,Math.max(H-ih,ty));
 li.style.transform='translate('+tx+'px,'+ty+'px) scale('+sc+')'}
function reset(){const W=lb.clientWidth,H=lb.clientHeight,[w,h]=dm();fit=Math.min(W/w,H/h);sc=fit;tx=(W-w*sc)/2;ty=(H-h*sc)/2;apply()}
function zoomAt(cx,cy,ns){ns=Math.min(fit*8,Math.max(fit,ns));const k=ns/sc;tx=cx-(cx-tx)*k;ty=cy-(cy-ty)*k;sc=ns;apply()}
function open(src){li.onload=reset;li.src=src;lb.classList.add('on');if(li.complete&&li.naturalWidth)reset()}
function close(){lb.classList.remove('on');P.clear()}
window.openLB=open;
$('#lbx').onclick=close;
$('#lbz1').onclick=()=>zoomAt(lb.clientWidth/2,lb.clientHeight/2,sc/1.5);
$('#lbz2').onclick=()=>zoomAt(lb.clientWidth/2,lb.clientHeight/2,sc*1.5);
lb.addEventListener('pointerdown',e=>{if(e.target.closest('.lbc'))return;try{lb.setPointerCapture(e.pointerId)}catch(_){}
 P.set(e.pointerId,[e.clientX,e.clientY]);if(P.size===1)moved=0;
 if(P.size===2){const[p,q]=[...P.values()];pd=Math.hypot(p[0]-q[0],p[1]-q[1])||1;pm=[(p[0]+q[0])/2,(p[1]+q[1])/2];moved=99}});
lb.addEventListener('pointermove',e=>{const o=P.get(e.pointerId);if(!o)return;P.set(e.pointerId,[e.clientX,e.clientY]);
 if(P.size===1){tx+=e.clientX-o[0];ty+=e.clientY-o[1];moved+=Math.abs(e.clientX-o[0])+Math.abs(e.clientY-o[1]);apply()}
 else if(P.size===2){const[p,q]=[...P.values()],d=Math.hypot(p[0]-q[0],p[1]-q[1])||1,m=[(p[0]+q[0])/2,(p[1]+q[1])/2];
  tx+=m[0]-pm[0];ty+=m[1]-pm[1];zoomAt(m[0],m[1],sc*d/pd);pd=d;pm=m}});
function up(e){if(!P.has(e.pointerId))return;P.delete(e.pointerId);
 if(e.type==='pointerup'&&P.size===0&&moved<10&&!e.target.closest('.lbc')){const t=Date.now();
  if(t-lt<320){lt=0;zoomAt(e.clientX,e.clientY,sc>fit*1.05?fit:Math.max(fit*2.5,fit))}else lt=t}}
lb.addEventListener('pointerup',up);lb.addEventListener('pointercancel',up);
lb.addEventListener('wheel',e=>{e.preventDefault();zoomAt(e.clientX,e.clientY,sc*Math.exp(-e.deltaY*.0015))},{passive:false});
['gesturestart','gesturechange'].forEach(n=>lb.addEventListener(n,e=>e.preventDefault()));
addEventListener('keydown',e=>{if(e.key==='Escape')close()});
addEventListener('resize',()=>{if(lb.classList.contains('on'))reset()});
})();

// ===== 上方功能列：依捲動位置高亮目前段落 =====
(function(){const links=[...document.querySelectorAll('#hd nav a')],secs=links.map(a=>document.querySelector(a.getAttribute('href')));
let cur=-1;
function spy(){const off=($('#hd').offsetHeight||60)+48;let k=0;
secs.forEach((el,i)=>{if(el&&el.getBoundingClientRect().top<=off)k=i});
if(innerHeight+scrollY>=document.documentElement.scrollHeight-4)k=secs.length-1;
if(scrollY<40&&secs[0]&&secs[0].getBoundingClientRect().top>off)k=0;
if(k===cur||!links[k])return;cur=k;
links.forEach((a,i)=>a.classList.toggle('on',i===k))}
addEventListener('scroll',()=>requestAnimationFrame(spy),{passive:true});addEventListener('resize',spy);spy();})();

// ===== 懸浮換算鈕：點一下展開外幣⇄台幣，固定在畫面右下（取代內容區的換算區塊）=====
(function(){const FX=TRIP.fx||[];if(!FX.length)return;
 const old=document.querySelector('main>section#fx');if(old)old.remove();
 document.body.insertAdjacentHTML('beforeend',`<button id="fxb" aria-label="匯率換算" aria-expanded="false"><b${FX[0].sym.trim().length>1?' class="sm"':''}>${FX[0].sym.trim()}</b><small>換算</small></button><div id="fx" class="card fx fxp" hidden><div id="fxc" hidden></div><div class="fxrow"><label id="fxkl">外幣<input id="fxk" type="text" inputmode="decimal" placeholder="0" autocomplete="off" aria-label="外幣金額"></label><span class="fxeq" aria-hidden="true">⇄</span><label>NT$<input id="fxt" type="text" inputmode="decimal" placeholder="0" autocomplete="off" aria-label="台幣金額"></label></div><p class="fxrate" id="fxrate" hidden></p><div class="fxq" id="fxq" hidden></div></div>`);
 const b=$('#fxb'),p=$('#fx');
 const set=v=>{p.hidden=!v;b.classList.toggle('on',v);b.setAttribute('aria-expanded',v)};
 b.onclick=e=>{e.stopPropagation();set(p.hidden);if(!p.hidden)setTimeout(()=>$('#fxk').focus({preventScroll:true}),50)};
 document.addEventListener('click',e=>{if(!p.hidden&&!p.contains(e.target)&&e.target!==b)set(false)});
 addEventListener('keydown',e=>{if(e.key==='Escape')set(false)});
 p.addEventListener('click',e=>{const c=e.target.closest('#fxc button');if(c)setTimeout(()=>{const s=FX[+c.dataset.i].sym.trim(),e=b.querySelector('b');e.textContent=s;e.classList.toggle('sm',s.length>1)},0)});
})();
// ===== 外幣換算：即時國際中價 × 臺銀現鈔加碼 = 估算現鈔價；抓不到時用上次取得的值或資料內的參考值 =====
(function(){
const FX=TRIP.fx||[];if(!FX.length||!$('#fx'))return;
const ft=$('#fxt'),fk=$('#fxk'),info=$('#fxrate'),q=$('#fxq'),seg=$('#fxc');
const fmt=(n,d)=>isFinite(n)?(+n.toFixed(d)).toLocaleString('en-US'):'';
const num=v=>parseFloat(String(v).replace(/,/g,''));
const md=t=>{const d=new Date(t);return (d.getMonth()+1)+'/'+d.getDate()};
// 每種貨幣：r＝NT$1 可換多少外幣（估算現鈔價）
FX.forEach(c=>{c.r=1/c.ref;c.note='離線參考值：'+c.refNote;
 const m=ls.get('fx-'+c.code,null)||(c.code==='KRW'?ls.get('fxmid',null):null);if(m&&m.m>0)est(c,m.m,m.t,true);c.last=(m&&m.at)||0});
function est(c,m,t,old){c.r=m/c.mk;const p=Math.round((c.mk-1)*100);c.note=(old?'上次取得的':'')+(p?'估算現鈔價＝國際中價 NT$1≈'+c.sym+m.toFixed(c.mid||2)+'（'+md(t)+' 更新）÷ 臺銀現鈔加碼約 '+p+'%':'國際中價 NT$1≈'+c.sym+m.toFixed(c.mid||2)+'（'+md(t)+' 更新）')+(c.extra?'。'+c.extra:'')}
let c=FX[0];
if(FX.length>1){seg.hidden=false;seg.innerHTML=FX.map((x,i)=>`<button data-i="${i}" class="${i?'':'on'}">${x.name}</button>`).join('');
 seg.onclick=e=>{const b=e.target.closest('button');if(!b)return;c=FX[b.dataset.i];[...seg.children].forEach(x=>x.classList.toggle('on',x===b));draw();fk.value=fmt(c.quick[2],0);fromK()}}
function show(){const u=c.unit||1;info.innerHTML='NT$1 ≈ '+c.sym+c.r.toFixed(c.mid||2)+'　<small>'+c.sym+u.toLocaleString('en-US')+' ≈ NT$'+(u/c.r).toFixed(1)+'</small><br>'+c.note+'。僅供參考，實際以銀行牌告或刷卡匯率為準。'}
function fromT(){const v=num(ft.value);fk.value=v>=0?fmt(v*c.r,c.dec||0):''}
function fromK(){const v=num(fk.value);ft.value=v>=0?fmt(v/c.r,1):''}
function quick(){q.innerHTML=c.quick.map(k=>`<button data-k="${k}">${c.sym}${k.toLocaleString('en-US')}<small>≈ NT$${fmt(k/c.r,0)}</small></button>`).join('')}
function draw(){$('#fxkl').firstChild.textContent=c.sym+' '+c.name;show();quick()}
ft.oninput=fromT;fk.oninput=fromK;
[ft,fk].forEach(e=>e.onfocus=()=>e.select());
q.onclick=e=>{const b=e.target.closest('button');if(!b)return;fk.value=(+b.dataset.k).toLocaleString('en-US');fromK()};
draw();fk.value=fmt(c.quick[2],0);fromK();
// 中價來源（都允許網頁直接讀取）：open.er-api.com 為主，jsDelivr 上的 currency-api 備援
const SRC=[
 ['https://open.er-api.com/v6/latest/TWD',j=>[x=>j.rates&&j.rates[x],j.time_last_update_unix*1000]],
 ['https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/twd.json',j=>[x=>j.twd&&j.twd[x.toLowerCase()],Date.parse(j.date)]]
];
let last=Math.min(...FX.map(x=>x.last));
async function refresh(){
 for(const [u,pick] of SRC){try{
  const x=await fetch(u,{cache:'no-store'});if(!x.ok)continue;
  const [g,t]=pick(await x.json());let ok=0;
  FX.forEach(cc=>{const m=g(cc.code);if(!(m>0)||(cc.lo&&m<cc.lo)||(cc.hi&&m>cc.hi))return; // 合理範圍檢查
   est(cc,m,t||Date.now(),false);ls.set('fx-'+cc.code,{m,t:t||Date.now(),at:Date.now()});ok++});
  if(!ok)continue;last=Date.now();show();quick();if(document.activeElement===ft)fromT();else fromK();return;
 }catch(e){}}
}
refresh();
// 回到網頁時，距離上次超過 1 小時就重抓
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&Date.now()-last>36e5)refresh()});
})();
document.addEventListener('click',e=>{const b=e.target.closest('[data-sh]');if(b){$('#sbody').innerHTML=SH[b.dataset.sh];$('#sheet').classList.add('on');$('#sheet .sp').scrollTop=0}});
(function(){const Z=[1,1.15,1.3];let i=+ls.get('seoul27z',0)||0;
const ap=()=>document.documentElement.style.setProperty('--z',Z[i]);ap();
$('#fs').onclick=()=>{i=(i+1)%3;ap();ls.set('seoul27z',i)}})();
// 左右滑動區：圓點指示目前第幾張
document.querySelectorAll('.swipe[data-dots]').forEach(sw=>{const sl=[...sw.children],d=document.createElement('div');d.className='dots';d.innerHTML=sl.map(()=>'<i></i>').join('');sw.after(d);
 const dd=[...d.children];let t=0;
 const go=i=>sw.scrollTo({left:sl[Math.max(0,Math.min(sl.length-1,i))].offsetLeft-sw.offsetLeft-16,behavior:'smooth'});
 const cur=()=>dd.findIndex(e=>e.classList.contains('on'));
 const pv=document.createElement('button'),nx=document.createElement('button');pv.className=nx.className='sa';pv.textContent='‹';nx.textContent='›';pv.setAttribute('aria-label','上一張');nx.setAttribute('aria-label','下一張');
 pv.onclick=()=>go(cur()-1);nx.onclick=()=>go(cur()+1);d.prepend(pv);d.append(nx);
 dd.forEach((e,i)=>{e.onclick=()=>go(i)});
 const upd=()=>{const l=sw.getBoundingClientRect().left+16;let k=0,m=1e9;sl.forEach((x,i)=>{const g=Math.abs(x.getBoundingClientRect().left-l);if(g<m){m=g;k=i}});if(sw.scrollLeft+sw.clientWidth>=sw.scrollWidth-4)k=sl.length-1;dd.forEach((e,i)=>e.classList.toggle('on',i===k))};
 sw.addEventListener('scroll',()=>{cancelAnimationFrame(t);t=requestAnimationFrame(upd)},{passive:true});upd()});
// 上方功能列與底部日期列的高度：內容不被遮住
(function(){const hd=$('#hd'),dk=$('#daybar'),rs=document.documentElement.style;
 const fit=()=>{rs.setProperty('--hh',hd.offsetHeight+'px');rs.setProperty('--dock',dk.offsetHeight+'px')};
 fit();addEventListener('resize',fit);
 // 沒有網路時在最上方提示
 const net=$('#net'),upd=()=>{net.hidden=navigator.onLine;fit()};
 addEventListener('online',upd);addEventListener('offline',upd);upd();
 if(document.fonts&&document.fonts.ready)document.fonts.ready.then(fit);
})();
// 離線使用：檢查這支手機是否已經存好這個旅程
(function(){const box=$('#offst');if(!box)return;const t=box.querySelector('span');
 const ok=m=>{box.classList.add('ok');t.textContent=m};
 if(!('caches' in window)||!/^https?:/.test(location.protocol)){t.textContent='這個瀏覽器無法離線使用，請改用 Safari 或 Chrome 開啟。';return}
 const chk=()=>caches.keys().then(ks=>{const k=ks.filter(x=>x.startsWith('trip-')).pop();return k?caches.open(k).then(c=>c.match('./trips/'+M.id+'.json')):null}).then(h=>{
  if(h)ok(matchMedia('(display-mode: standalone)').matches||navigator.standalone?'✓ 已存在這支手機，沒有網路也能打開。':'✓ 已存在這支手機，沒有網路也能看。建議再「加入主畫面」，之後點圖示就能打開。');
  else t.textContent='還沒存好：請在有網路時打開網站，等 10 秒後重新整理一次。'}).catch(()=>{t.textContent='無法確認離線狀態。'});
 chk();if(navigator.serviceWorker)navigator.serviceWorker.ready.then(()=>setTimeout(chk,3000));
})();
render(false);
