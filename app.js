// 首爾 2027 行程頁面的程式。資料都在 trips/*.json，這裡只負責畫面。
const {kop:KOP,tags:T,days:D,dayImages:DI,foods:F,sights:S,ko:KO,regions:REG,todo:TODO,phrases:PH,sheets:SH}=window.TRIP;
const $=s=>document.querySelector(s);
const enc=encodeURIComponent;
const mp=n=>`<span class="btns" style="display:inline-flex;margin:0 0 0 4px"><a class="b g" target="_blank" rel="noopener" href="https://www.google.com/maps/search/?api=1&query=${enc(KOP[n]||n)}">G</a><a class="b" target="_blank" rel="noopener" href="https://map.naver.com/p/search/${enc(KOP[n]||n)}">N</a></span>`;
// s=大綱說明、g=春節標籤［韓國,台灣］
let day=0,ab='A';
const dbox=$('#days');
dbox.innerHTML=D.map((d,k)=>{const p=d.t.split(' ');return `<div class="dy" id="dy${k}"><button class="dr" data-k="${k}"><b>${p[0]} ${p[1]}</b><span class="ds">${d.s}</span>${d.g?`<span class="tg"><span class="pill">${d.g[0]}</span><span class="pill tw">${d.g[1]}</span></span>`:''}</button><div class="dp" hidden></div></div>`}).join('');
function panel(k){
 const d=D[k],items=d.ab?d[ab]:d.i,im=DI[d.ab?k+ab:k];
 const tl=items.map(x=>{const g=x[2]?`<span class="tag" style="background:${T[x[2]][1]}">${T[x[2]][0]}</span>`:'';return `<li><span class="tm">${x[0]}</span><div class="tc">${x[1]}${g}${x[3]?mp(x[3]):''}${x[3]&&KOP[x[3]]?'<small class="kp">'+KOP[x[3]]+'</small>':''}</div></li>`}).join('');
 return `<h3>${d.h}</h3>`
  +(d.ab?`<div class="ab"><button data-v="A" class="${ab==='A'?'on':''}">A 洪川玩雪</button><button data-v="B" class="${ab==='B'?'on':''}">B 龍山＋東大門</button></div><p class="rate" style="margin:0 0 8px">依天氣、路況與租車狀況二選一。</p>`:'')
  +(im?`<div class="btns" style="margin:0 0 10px"><button class="b bt gd mapbtn" data-img="${im}">🖼 當日行程圖</button></div>`:'')
  +`<ul class="tl">${tl}</ul><div class="note">${d.ab?(ab==='A'?d.nA:d.nB):d.n}</div>`
  +`<div class="dn">${k>0?`<button data-go="${k-1}">← 前一天</button>`:''}${k<D.length-1?`<button data-go="${k+1}">下一天 →</button>`:''}</div>`;
}
const dbtn=$('#dbtn');
D.forEach((d,k)=>{const b=document.createElement('button'),p=d.t.split(' ');b.innerHTML=p[0]+'<small>'+p[1]+'</small>';b.onclick=()=>{day=k;render(true)};dbtn.append(b)});
function render(scroll){
 [...dbtn.children].forEach((b,k)=>b.classList.toggle('on',k===day));
 [...dbox.children].forEach((el,k)=>{const on=k===day,p=el.querySelector('.dp');el.classList.toggle('on',on);p.hidden=!on;p.innerHTML=on?panel(k):''});
 if(scroll&&day>=0)requestAnimationFrame(()=>$('#dy'+day).scrollIntoView({behavior:'smooth',block:'start'}));
}
dbox.addEventListener('click',e=>{
 const r=e.target.closest('.dr');if(r){const k=+r.dataset.k;day=day===k?-1:k;render(true);return}
 const v=e.target.closest('[data-v]');if(v){ab=v.dataset.v;render(false);return}
 const g=e.target.closest('[data-go]');if(g){day=+g.dataset.go;render(true);return}
 const im=e.target.closest('[data-img]');if(im){openLB(im.dataset.img)}
});
{const n=new Date(),k=D.findIndex(d=>d.t.split(' ')[0]===(n.getMonth()+1)+'/'+n.getDate());if(n.getFullYear()===2027&&k>=0){day=k;setTimeout(()=>{dbtn.children[k].innerHTML=D[k].t.split(' ')[0]+'<small>今天</small>'},0)}}
// 食物 [名稱,韓文,特色,營業]
// 景點 [名稱,時間,備註]
function tabs(el,list,data,draw){const box=$(el);Object.keys(data).forEach((k,i)=>{const b=document.createElement('button');b.textContent=k;b.onclick=()=>{[...box.children].forEach(c=>c.classList.remove('on'));b.classList.add('on');draw(k)};box.append(b);if(!i)b.click()})}
// 追加美食
// 海鮮（依使用者提供的推薦清單；地址與時間為查證結果，出發前請再用地圖確認）
// 追加備用景點
// 清單只顯示名稱，點開才跳出詳細資料
// 海鮮與海鮮市場的所在區域（清單與詳細頁都會顯示）
const kn=(kind,x)=>kind==='f'?x[1]:(x[3]||KO[x[0]]||'');
let R={};try{R=JSON.parse(localStorage.getItem('seoul27r')||'{}')}catch(e){}
const LD={};
function listDraw(sel,arr,sea,kind){const box=$(sel);box.className='pl';LD[kind]=[sel,arr,sea];
 box.innerHTML=arr.map((x,i)=>{const k=kn(kind,x);return `<button class="pi" data-i="${i}"><span>${kind==='f'&&R[x[0]]?'✅ ':''}${k||x[0]}${sea?' 🦐':''}${k&&k!==x[0]?`<small>${x[0]}</small>`:''}${sea&&REG[x[0]]?`<small>📍 ${REG[x[0]]}</small>`:''}</span></button>`}).join('');
 box.onclick=e=>{const b=e.target.closest('.pi');if(b)openSheet(kind,arr[b.dataset.i])}}
function openSheet(kind,x){
 const f=kind==='f',name=x[0],ko=kn(kind,x),q=/[가-힣]/.test(ko)?ko:name,hg=/[가-힣]/.test(ko);
 const rows=f?[['🍴','特色',x[2]],['🕒','營業時間',x[3]],['📍','地址',x[4]]]:[['🕒','開放時間',x[1]],['📝','備註',x[2]]];
 if(REG[name])rows.unshift(['📍','區域',REG[name]]);
 $('#sbody').innerHTML='<h3>'+(ko||name)+'</h3>'+(ko&&ko!==name?'<p class="ko">'+name+'</p>':'')
  +rows.filter(r=>r[2]).map(r=>`<div class="sr"><span>${r[0]}</span><div><small>${r[1]}</small>${r[2]}</div></div>`).join('')
  +`<div class="sbt"><a class="b g" target="_blank" rel="noopener" href="https://www.google.com/maps/search/?api=1&query=${enc(q)}">Google Map</a><a class="b" target="_blank" rel="noopener" href="https://map.naver.com/p/search/${enc(q)}">Naver Map</a>${hg?'<button class="b" id="sbig" style="background:#3b2a2a;border:0;font-family:inherit;cursor:pointer">放大給人看</button>':''}${f?`<button class="b" id="srv" style="background:${R[name]?'#27ae60':'#8a7468'};border:0;font-family:inherit;cursor:pointer">${R[name]?'✅ 已訂位':'☐ 標記已訂位'}</button>`:''}</div>`;
 const sb=$('#sbig');if(sb)sb.onclick=()=>{const z=$('#big');z.querySelector('b').textContent=ko;z.querySelector('small').textContent=name;z.classList.add('on')};
 const sr=$('#srv');if(sr)sr.onclick=()=>{R[name]=!R[name];try{localStorage.setItem('seoul27r',JSON.stringify(R))}catch(e){}openSheet(kind,x);const L=LD[kind];if(L)listDraw(L[0],L[1],L[2],kind)};
 $('#sheet').classList.add('on');$('#sheet .sp').scrollTop=0}
function closeSheet(){$('#sheet').classList.remove('on')}
$('#sheet .sbd').onclick=closeSheet;$('#sheet .sx').onclick=closeSheet;
addEventListener('keydown',e=>{if(e.key==='Escape')closeSheet()});
tabs('#ftabs',0,{'🦞 海鮮':F['🦞 海鮮'],...F},k=>listDraw('#flist',F[k],k.indexOf('海鮮')>-1,'f'));
tabs('#stabs',0,{'🦞 海鮮市場':S['🦞 海鮮市場'],...S},k=>listDraw('#slist',S[k],k.indexOf('海鮮')>-1,'s'));
$('#seg').onclick=e=>{const b=e.target.closest('button');if(!b)return;[...$('#seg').children].forEach(x=>x.classList.toggle('on',x===b));$('#pf').hidden=b.dataset.p!=='f';$('#ps').hidden=b.dataset.p!=='s'};
// 待辦（只存在這支手機，不需同步）
let st={};try{st=JSON.parse(localStorage.getItem('seoul27t')||'{}')||{}}catch(e){st={}}
function drawTodo(){$('#todolist').innerHTML=Object.keys(TODO).map(g=>{const l=TODO[g],n=l.filter(t=>st[t]).length;return `<details class="td"><summary>${g} <small class="cnt">${n}/${l.length}</small></summary>`+l.map(t=>`<label><input type="checkbox" data-t="${t}" ${st[t]?'checked':''}><span>${t}</span></label>`).join('')+'</details>'}).join('')}
drawTodo();
$('#todolist').onchange=e=>{st[e.target.dataset.t]=e.target.checked;try{localStorage.setItem('seoul27t',JSON.stringify(st))}catch(_){}const d=e.target.closest('details'),ls=[...d.querySelectorAll('input')];d.querySelector('.cnt').textContent=ls.filter(i=>i.checked).length+'/'+ls.length};
// 倒數（台灣時間 2/3 17:50）
function tick(){const ms=new Date('2027-02-03T17:50:00+08:00')-new Date();
 if(ms<=0){$('#cd').innerHTML='';$('#cdnote').textContent=new Date()>new Date('2027-02-08T16:25:00+08:00')?'🏠 旅程結束，歡迎回家！':'🛫 旅程進行中，玩得開心！';return}
 const s=Math.floor(ms/1e3),v=[[Math.floor(s/86400),'天'],[Math.floor(s%86400/3600),'時'],[Math.floor(s%3600/60),'分'],[s%60,'秒']];
 $('#cd').innerHTML=v.map(x=>`<div><b>${x[0]}</b><span>${x[1]}</span></div>`).join('');$('#cdnote').textContent='距離出發（台中起飛）還有';}
tick();setInterval(tick,1000);

tabs('#ptabs',0,Object.fromEntries(PH.map(c=>[c[0],c[1]])),k=>{const c=PH.find(x=>x[0]===k)[1];const box=$('#plist');
 box.innerHTML=c.map((x,i)=>`<button class="pi" data-i="${i}"><span>${x[1]}</span></button>`).join('');
 box.onclick=e=>{const b=e.target.closest('.pi');if(!b)return;const z=$('#big'),x=c[b.dataset.i];z.querySelector('b').textContent=x[0];z.querySelector('small').textContent=x[1];z.classList.add('on')}});
$('#big').onclick=()=>$('#big').classList.remove('on');
if('serviceWorker' in navigator&&/^https?:/.test(location.protocol))navigator.serviceWorker.register('sw.js').catch(()=>{});
// 圖片檢視器：雙指縮放、拖曳、連點放大、滾輪縮放
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
document.querySelectorAll('a.zoom').forEach(a=>a.onclick=e=>{e.preventDefault();open(a.querySelector('img').src)});
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
// 導覽列：依捲動位置高亮目前段落
(function(){const links=[...document.querySelectorAll('nav a')],secs=links.map(a=>document.querySelector(a.getAttribute('href')));
let cur=-1;
function spy(){const off=(document.querySelector('header').offsetHeight||60)+48;let k=0;
secs.forEach((el,i)=>{if(el&&el.getBoundingClientRect().top<=off)k=i});
if(innerHeight+scrollY>=document.documentElement.scrollHeight-4)k=secs.length-1;
if(scrollY<40&&secs[0]&&secs[0].getBoundingClientRect().top>off)k=0;
if(k===cur)return;cur=k;
links.forEach((a,i)=>a.classList.toggle('on',i===k));
const nv=links[k].parentElement;if(nv.scrollWidth>nv.clientWidth){const a=links[k];nv.scrollTo({left:a.offsetLeft-nv.clientWidth/2+a.offsetWidth/2,behavior:'smooth'})}}
addEventListener('scroll',()=>requestAnimationFrame(spy),{passive:true});addEventListener('resize',spy);spy();})();
// 韓元換算：抓當日匯率（兩個來源），失敗用上次快取或頁面內的參考值
(function(){
const ft=$('#fxt'),fk=$('#fxk'),info=$('#fxrate'),q=$('#fxq');
let r=1/0.0269,note='離線參考匯率（臺灣銀行 11/18 現鈔賣出價 ₩1≈NT$0.0269）';
try{const c=JSON.parse(localStorage.getItem('fxbot')||'null');if(c&&c.r>0){r=c.r;note='上次取得的臺灣銀行匯率（'+c.d+'）'}}catch(e){}
const fmt=(n,d)=>isFinite(n)?(+n.toFixed(d)).toLocaleString('en-US'):'';
const num=v=>parseFloat(String(v).replace(/,/g,''));
function show(){info.innerHTML='NT$1 ≈ ₩'+r.toFixed(2)+'　<small>₩1,000 ≈ NT$'+(1000/r).toFixed(1)+'</small><br>'+note+'。牌告僅供參考，實際換匯／刷卡匯率略有差異。'}
function fromT(){const v=num(ft.value);fk.value=v>=0?fmt(v*r,0):''}
function fromK(){const v=num(fk.value);ft.value=v>=0?fmt(v/r,1):''}
ft.oninput=fromT;fk.oninput=fromK;
[ft,fk].forEach(e=>e.onfocus=()=>e.select());
q.innerHTML=[1000,5000,10000,30000,50000,100000].map(k=>`<button data-k="${k}">₩${k.toLocaleString('en-US')}<small></small></button>`).join('');
q.onclick=e=>{const b=e.target.closest('button');if(!b)return;fk.value=(+b.dataset.k).toLocaleString('en-US');fromK()};
function quick(){q.querySelectorAll('button').forEach(b=>b.lastChild.textContent='≈ NT$'+fmt(b.dataset.k/r,0))}
show();quick();fk.value='10,000';fromK();
async function get(u,pick){const x=await fetch(u,{cache:'no-store'});if(!x.ok)throw 0;const j=await x.json(),v=pick(j);if(!(v>0))throw 0;return v}
(async()=>{let v=0;
const parse=t=>{const l=t.split(/\r?\n/).find(x=>/^\s*KRW/.test(x));if(!l)return 0;const c=l.split(',').map(x=>x.trim());for(const i of [11,12]){const n=parseFloat(c[i]);if(n>0.005&&n<0.1)return n}return 0};
for(const u of ['/botrate','https://rate.bot.com.tw/xrt/flcsv/0/day']){try{const x=await fetch(u,{cache:'no-store'});if(!x.ok)continue;const n=parse(await x.text());if(n>0){v=1/n;break}}catch(e){}}
if(v>0){r=v;const d=new Date(),ds=(d.getMonth()+1)+'/'+d.getDate();note='臺灣銀行今日牌告現鈔賣出價（'+ds+' 取得）₩1≈NT$'+(1/v).toFixed(4);try{localStorage.setItem('fxbot',JSON.stringify({r:v,d:ds}))}catch(e){}
show();quick();if(document.activeElement===ft)fromT();else fromK()}
})();
})();
document.querySelectorAll('[data-sh]').forEach(b=>b.onclick=()=>{$('#sbody').innerHTML=SH[b.dataset.sh];$('#sheet').classList.add('on');$('#sheet .sp').scrollTop=0});
const showBig=(a,b)=>{const z=$('#big');z.querySelector('b').textContent=a;z.querySelector('small').textContent=b;z.classList.add('on')};
$('#hbig').onclick=()=>showBig('트래블로지 명동 남산 호텔','Travelodge Myeongdong Namsan｜首爾明洞南山彩鴻酒店｜서울특별시 중구 수표로 16');
(function(){const Z=[1,1.15,1.3];let i=0;try{i=+localStorage.getItem('seoul27z')||0}catch(e){}
const ap=()=>document.documentElement.style.setProperty('--z',Z[i]);ap();
$('#fs').onclick=()=>{i=(i+1)%3;ap();try{localStorage.setItem('seoul27z',i)}catch(e){}}})();
// 左右滑動區：圓點指示目前第幾張
document.querySelectorAll('.swipe[data-dots]').forEach(sw=>{const sl=[...sw.children],d=document.createElement('div');d.className='dots';d.innerHTML=sl.map(()=>'<i></i>').join('');sw.after(d);
 const dd=[...d.children];let t=0;
 const go=i=>sw.scrollTo({left:sl[Math.max(0,Math.min(sl.length-1,i))].offsetLeft-sw.offsetLeft-14,behavior:'smooth'});
 const cur=()=>dd.findIndex(e=>e.classList.contains('on'));
 const pv=document.createElement('button'),nx=document.createElement('button');pv.className=nx.className='sa';pv.textContent='‹';nx.textContent='›';pv.setAttribute('aria-label','上一張');nx.setAttribute('aria-label','下一張');
 pv.onclick=()=>go(cur()-1);nx.onclick=()=>go(cur()+1);d.prepend(pv);d.append(nx);
 dd.forEach((e,i)=>{e.onclick=()=>go(i)});
 const upd=()=>{const l=sw.getBoundingClientRect().left+14;let k=0,m=1e9;sl.forEach((x,i)=>{const g=Math.abs(x.getBoundingClientRect().left-l);if(g<m){m=g;k=i}});if(sw.scrollLeft+sw.clientWidth>=sw.scrollWidth-4)k=sl.length-1;dd.forEach((e,i)=>e.classList.toggle('on',i===k))};
 sw.addEventListener('scroll',()=>{cancelAnimationFrame(t);t=requestAnimationFrame(upd)},{passive:true});upd()});
render(false);
