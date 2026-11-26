// 首爾冬日旅行手帳 V3.0（2026/11/26，使用者提供 seoul-winter-v3.zip）：只在首爾頁（index.html?t=seoul-2027）由 index.html 於 app.js 之後載入。
// 依 reference-v3.html／seoul-v3.css 重建「視覺呈現層」：只搬動／包裝 app.js 畫好的元素並插入 V3 素材，不改任何行程資料、id、事件。
// 樣式：seoul-v3-site.css（全部 html.th-han.sv3 開頭）。V2.1 版面備份在 seoul-winter-v2.js（網址 ?theme=v2）。
// 切換：?theme=classic 原始版、?theme=v2 V2.1 備份、?theme=v3（或 winter）V3（記在這支手機）。
(function(){
 var q=new URLSearchParams(location.search).get('theme');
 if(q==='winter')q='v3';
 try{if(q==='classic'||q==='v2'||q==='v3')localStorage.setItem('seoulTheme',q)}catch(e){}
 var th=null;try{th=localStorage.getItem('seoulTheme')}catch(e){}
 if(th==='classic'||!window.TRIP||!document.getElementById('hero'))return;
 if(th==='v2'){var s2=document.createElement('script');s2.src='seoul-winter-v2.js';document.body.appendChild(s2);return}

 var $=function(s,r){return (r||document).querySelector(s)},$$=function(s,r){return [].slice.call((r||document).querySelectorAll(s))};
 var V3='images/seoul-2027/v3/',DEC='images/seoul-2027/decor/';
 var img=function(src,c,lazy){return '<img class="'+(c||'')+'" src="'+src+'" alt=""'+(lazy?' loading="lazy"':'')+' aria-hidden="true">'};
 var H=TRIP.hero||{},M=TRIP.meta||{},DAYS=TRIP.days||[];
 var EMO=/^\s*(?:[←-⯿☀-➿️‍]|[\uD83C-\uDBFF][\uDC00-\uDFFF])+\s*/;
 var deEmoji=function(el){var n=el.firstChild;while(n&&n.nodeType===1&&!n.textContent.trim())n=n.nextSibling;if(n&&n.nodeType===3&&EMO.test(n.nodeValue))n.nodeValue=n.nodeValue.replace(EMO,'')};
 var esc=function(s){return String(s).replace(/[<>&"]/g,function(c){return {'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;'}[c]})};
 document.documentElement.classList.add('sv3');
 document.body.classList.add('seoul-v3');

 // 手繪圖示（12 個，依語意）
 var IC=function(n){return V3+n+'.png'};
 var NAVIC={flight:'plane',plan:'map',hotel:'bed',phr:'hanok',food:'food',price:'shopping',tips:'snow',todo:'luggage',apps:'train'};
 // 行程摘要圖示：依文字內容判斷（不改文字）
 var pickIc=function(t){
  if(/KE\d|搭機|搭 KE|機場|航廈|報到|安檢|託運/.test(t))return 'plane';
  if(/飯店|入住|退房/.test(t))return 'bed';
  if(/行李/.test(t))return 'luggage';
  if(/醫美/.test(t))return 'medical';
  if(/玩雪|雪橇|滑雪|Vivaldi|Snowy/.test(t))return 'ski';
  if(/宮/.test(t))return 'palace';
  if(/韓屋|北村|仁寺洞|博物館/.test(t))return 'hanok';
  if(/購物|商圈|明洞|Ssamziegil/.test(t))return 'shopping';
  if(/早餐|午餐|晚餐|市場|美食|煎餅|小吃/.test(t))return 'food';
  if(/地鐵|AREX|首爾站|車站|KTX/.test(t))return 'train';
  if(/雪/.test(t))return 'snow';
  return 'map'};

 // ===== 封面 hero3：冬日全景＋書法標題 title.png（不加霧化遮罩） =====
 var hero=$('#hero'),bg=$('.hero-bg',hero);
 hero.classList.add('hero3');
 if(bg){var old=bg.getAttribute('src');bg.onerror=function(){bg.onerror=null;bg.removeAttribute('srcset');bg.src=old};bg.sizes='(min-width:1000px) 1100px, 100vw';bg.srcset=DEC+'hero-winter-m.jpg 1000w, '+DEC+'hero-winter.jpg 1672w';bg.src=DEC+'hero-winter.jpg';bg.alt='';bg.setAttribute('fetchpriority','high')}
 var ttl=H.title||M.title||'';
 hero.insertAdjacentHTML('beforeend',img(V3+'flag.png','flag3')+'<h1 class="t3"><img src="'+V3+'title.png" alt="首爾 서울 Seoul" fetchpriority="high"></h1><b class="band3">'+esc(ttl)+'</b>'+(H.eyebrow?'<small class="eb3">'+esc(H.eyebrow)+'</small>':''));

 // ===== 功能列 nav3：手繪圖示＋文字（同一組連結，捲動標示照常） =====
 var nav=$('#hd nav');
 if(nav){nav.classList.add('nav3');nav.setAttribute('aria-label','功能選單');
  $$('a',nav).forEach(function(a){var id=(a.getAttribute('href')||'').slice(1);a.innerHTML=img(IC(NAVIC[id]||'map'),'ni3')+'<span>'+a.textContent+'</span>'});
  hero.after(nav);
  var stk=function(){nav.classList.toggle('stuck',nav.getBoundingClientRect().top<=1&&scrollY>40)};addEventListener('scroll',stk,{passive:true});stk();
  new MutationObserver(function(){var a=$('a.on',nav);if(a&&nav.scrollWidth>nav.clientWidth){var l=a.offsetLeft-(nav.clientWidth-a.offsetWidth)/2;nav.scrollTo({left:l,behavior:'smooth'})}}).observe(nav,{subtree:true,attributes:true,attributeFilter:['class']});
  window.dispatchEvent(new Event('resize'))}

 // ===== 倒數 count3（福袋＋倒數＋新年祝福）＋日期 info3（景福宮）＋天氣 quick3 =====
 var cd=$('#cd'),note=$('#cdnote'),go=$('#gotoday'),sub=$('p',hero);
 var card=document.createElement('section');card.className='card paper3 count3';
 card.innerHTML=img(DEC+'bokjumeoni.png','bag3')+img(DEC+'plum-branch.png','plum3')+'<div class="cin3"></div>';
 var inn=$('.cin3',card);
 if(note)inn.append(note);if(cd){cd.classList.add('nums');inn.append(cd)}
 inn.insertAdjacentHTML('beforeend','<b class="wish3" lang="ko">새해 복 많이 받으세요!</b><p class="wish3s">新年快樂</p>');
 if(go){deEmoji(go);inn.append(go)}
 var info=document.createElement('section');info.className='card paper3 info3';
 var CDL=(H.cd||{}).label||'';
 info.innerHTML=img(DEC+'palace-cut.png','pal3')
  +'<p><img src="'+IC('map')+'" alt="" aria-hidden="true"><span><small>旅遊日期</small><b>'+esc((H.sub||[])[0]||'')+'</b>'+((H.sub||[])[1]?'<em>'+esc(H.sub[1])+'</em>':'')+'</span></p>'
  +(CDL?'<p><img src="'+IC('plane')+'" alt="" aria-hidden="true"><span><small>出發</small><b>'+esc(CDL)+'</b></span></p>':'');
 if(sub)sub.remove();
 var top=document.createElement('div');top.className='top3';top.append(card,info);
 nav?nav.after(top):hero.after(top);
 var wx=$('#wx');if(wx){wx.classList.add('paper3','quick3');wx.insertAdjacentHTML('afterbegin',img(IC('snow'),'wxi3'));top.append(wx)}

 // ===== 區塊標題 section3：水彩筆刷＋手繪圖示 =====
 var BR={flight:'rose',hotel:'blue',plan:'rose',phr:'violet',food:'gold',price:'blue',tips:'green',todo:'rose',apps:'violet'};
 $$('main>section[id]>h2').forEach(function(h){var id=h.parentNode.id;
  h.innerHTML=h.innerHTML.replace(EMO,'');
  h.classList.add('section3','br3-'+(BR[id]||'rose'));
  h.innerHTML='<span class="sh3">'+img(IC(NAVIC[id]||'map'),'si3')+'<span>'+h.innerHTML+'</span></span>'});
 var clean=function(){$$('main .btns>.b, main .tabs>button, main .seg>button, main details.fold>summary, main details.td>summary, main p.rate').forEach(deEmoji)};
 clean();var mo=new MutationObserver(function(){mo.disconnect();clean();watch()}),watch=function(){$$('main .tabs, main .seg, #pf, #ps').forEach(function(t){mo.observe(t,{childList:true,subtree:true})})};watch();

 // ===== 航班＋住宿 pair3：手撕紙卡 =====
 var fl=$('#flight'),ho=$('#hotel');
 if(fl&&ho){var p3=document.createElement('div');p3.className='pair3';fl.before(p3);p3.append(fl,ho)}
 $$('#flight .bp').forEach(function(b){b.classList.add('paper3','fl3');var h=$('.bph',b);if(!h)return;
  [].slice.call(h.childNodes).forEach(function(n){if(n.nodeType===3&&n.nodeValue.trim()){var d=document.createElement('div');d.className='fdate3';d.textContent=n.nodeValue.trim();h.after(d);n.remove()}});
  h.insertAdjacentHTML('afterbegin',img(IC('plane'),'fi3'))});
 $$('#hotel details.hotel').forEach(function(d,i){var s=$('summary',d),o=(TRIP.hotels||[])[i]||{};if(!s)return;
  d.classList.add('paper3','ho3');
  if(o.pic==='hpic')s.insertAdjacentHTML('afterbegin','<button class="hpic3" data-sh="hpic" onclick="event.preventDefault()" aria-label="飯店相片"><img src="images/seoul-2027/hotel-2.jpg" alt="飯店外觀" loading="lazy"></button>')});
 if(ho)ho.insertAdjacentHTML('beforeend',img(DEC+'plum-branch.png','hplum3',true));

 // ===== 每日行程 days3／day3：依 reference-v3.html 結構重建視覺層 =====
 // 左欄 46%：Day 水彩標籤（badge-1～6）＋日期同列、下方插畫；右欄：當日標題＋三項摘要（圖示 21px、文字 14px、自然換行）
 // 插畫依正式日期（V3.1 補充包 1800×540，網頁用 900×270）：2/3 飛機、2/4 明洞、2/5 玩雪雪橇、2/6 景福宮、2/7 韓屋與溪流、2/8 機場
 // 手機 1.9:1 裁切時各張主體位置不同，用 object-position 對準（SPOS）
 var SCN=['scene-1.png','scene-2.png','scene-3.png','scene-4.png','scene-5.png','scene-6.png'],SPOS=['44%','46%','30%','66%','50%','42%'];
 var ACC=['#a84d59','#497da6','#537c63','#a96730','#78618f','#537c63'];
 var plain=function(s){var e=document.createElement('div');e.innerHTML=String(s||'').replace(/<a\b[^>]*class="xl"[^>]*>[\s\S]*?<\/a>/g,'');return (e.textContent||'').replace(EMO,'').replace(/\s+/g,' ').trim()};
 var ph=$('#plan>h2.section3');if(ph)ph.insertAdjacentHTML('beforeend',img(V3+'camera.png','cam3',true));
 var dbox=$('#days');
 if(dbox){dbox.classList.add('days3');
  $$('.dy',dbox).forEach(function(el,k){var r=$('.dr',el);if(!r||el.hidden)return;var D=DAYS[k]||{};
   el.classList.add('paper3','day3');el.style.setProperty('--accent',ACC[k%ACC.length]);
   var t=(D.t||'').split(' '),date=t[0]+(t[1]?'（'+t[1]+'）':'');
   var h=(D.h||'').replace(/^Day\s*\d+\s*/i,'');
   var its=(D.ab?D.A:D.i)||[];
   var li=its.map(function(x){return plain(x[1])}).filter(function(s){return s&&!/^(早餐|午餐|晚餐)$/.test(s)}).slice(0,3);
   var tg=$('.tg',r);
   r.classList.add('dr3');
   r.insertAdjacentHTML('afterbegin','<span class="dl3"><span class="dayhead"><span class="daybadge" style="--badge:url('+V3+'badge-'+((k%6)+1)+'.png)">Day '+(k+1)+'</span><span class="ddate">'+esc(date)+'</span></span><img class="scene" src="'+V3+SCN[k%SCN.length]+'" style="object-position:'+SPOS[k%SPOS.length]+' 50%" alt="" loading="lazy"></span>'
    +'<span class="dr3r"><span class="dh3">'+esc(h)+'</span><span class="dul">'+li.map(function(s){return '<span class="dli"><img src="'+IC(pickIc(s))+'" alt="" aria-hidden="true"><span>'+esc(s)+'</span></span>'}).join('')+'</span></span>');
   if(tg)$('.dr3r',r).append(tg)})}

 // ===== 底部日期列 dock3：總覽＋D1～D6 =====
 var dk=$('#daybar');
 if(dk){dk.classList.add('dock3');var row=dk.firstElementChild;
  if(row)row.insertAdjacentHTML('afterbegin','<a class="all3" href="#plan">'+img(IC('map'),'')+'總覽</a>');
  window.dispatchEvent(new Event('resize'))}

 // ===== 下半部：手撕紙卡 =====
 ['phr','food','price','tips','todo','apps'].forEach(function(id){var s=document.getElementById(id);if(s&&s.parentNode.tagName==='MAIN')s.classList.add('sheet3')});
 // 價格／App 橫滑卡：容器高度跟著目前那一張
 $$('main .swipe').forEach(function(sw){var tm,fit=function(){var c=[].slice.call(sw.children).filter(function(e){return e.offsetWidth}),x=sw.scrollLeft+sw.clientWidth*0.3,cur=c[0];c.forEach(function(e){if(e.offsetLeft-sw.offsetLeft<=x+1)cur=e});if(!cur)return;var cs=getComputedStyle(sw);sw.style.height=(cur.offsetHeight+parseFloat(cs.paddingTop)+parseFloat(cs.paddingBottom))+'px'};
  sw.classList.add('fit3');sw.addEventListener('scroll',function(){clearTimeout(tm);tm=setTimeout(fit,90)},{passive:true});addEventListener('resize',fit);setTimeout(fit,60);fit()});

 // ===== 頁尾 foot3：韓式美食＋天際線＋手寫標語（文字取自行程資料） =====
 var ft=$('footer');
 if(ft)ft.insertAdjacentHTML('beforebegin','<div class="foot3">'+img(V3+'food-spread.png','ffood3',true)+img(V3+'snowman.png','fsnow3',true)+img(DEC+'plum-branch.png','fplum3',true)+'<div class="ftx3"><b>首爾冬日・新春旅行</b>'+((H.sub||[]).length?'<small>'+esc(H.sub.join('・'))+'</small>':'')+'</div></div>');
})();
