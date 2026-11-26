// 首爾冬日旅行手帳 V2.1 版面：只在首爾頁（index.html?t=seoul-2027）由 index.html 於 app.js 之後載入。
// 只搬動／包裝 app.js 已畫好的元素並加上素材圖，不改任何行程資料。
// 樣式：theme-han.css 的「Seoul Winter」區塊（html.th-han.sw，內頁共用）＋ seoul-v2.css（使用者提供，原樣）＋ seoul-v2-site.css（把 V2 版型對應到正式頁，html.th-han.sw.sv2）。
// 恢復舊版：網址加 ?theme=classic（記在這支手機）；?theme=winter 改回。
(function(){
 var q=new URLSearchParams(location.search).get('theme');
 try{if(q==='classic'||q==='winter')localStorage.setItem('seoulTheme',q)}catch(e){}
 var th=null;try{th=localStorage.getItem('seoulTheme')}catch(e){}
 if(th==='classic'||!window.TRIP||!document.getElementById('hero'))return;
 var $=function(s,r){return (r||document).querySelector(s)},$$=function(s,r){return [].slice.call((r||document).querySelectorAll(s))};
 var IMG='images/seoul-2027/decor/';
 var deco=function(f,c,lazy){return '<img class="sw-deco '+c+'" src="'+IMG+f+'" alt=""'+(lazy?' loading="lazy"':'')+' aria-hidden="true">'};
 var H=TRIP.hero||{},M=TRIP.meta||{},DAYS=TRIP.days||[];
 document.documentElement.classList.add('sw','sv2');
 document.body.classList.add('seoul-v2');

 // ===== 封面（hero2）：冬日韓屋插畫＋HTML 標題（標題文字取自行程資料） =====
 var hero=$('#hero'),bg=$('.hero-bg',hero);
 hero.classList.add('sw-hero','hero2');
 if(bg){var old=bg.getAttribute('src');bg.onerror=function(){bg.onerror=null;bg.removeAttribute('srcset');bg.src=old};bg.sizes='(min-width:1000px) 1100px, 100vw';bg.srcset=IMG+'hero-winter-m.jpg 1000w, '+IMG+'hero-winter.jpg 1672w';bg.src=IMG+'hero-winter.jpg';bg.alt=H.alt?'首爾封面：雪中的北村韓屋與南山首爾塔':'';bg.setAttribute('fetchpriority','high')}
 var ttl=H.title||M.title||'';
 hero.insertAdjacentHTML('beforeend','<div class="sv2-title"><h1><span class="sv2-zh">首爾</span><span class="sv2-side"><small lang="ko">서울</small><em lang="en">Seoul</em></span></h1><p>'+ttl+'</p>'+(H.eyebrow?'<b>'+H.eyebrow+'</b>':'')+'</div>');

 // ===== 功能選單（nav2）：從頁首移到封面下方（保留同一組連結，捲動標示照常運作） =====
 var nav=$('#hd nav');
 if(nav){nav.classList.add('sw-nav','nav2');nav.setAttribute('aria-label','功能選單');
  $$('a',nav).forEach(function(a){var id=(a.getAttribute('href')||'').slice(1);a.dataset.ic=id;a.classList.add('tile');a.innerHTML='<i class="nav-icon" aria-hidden="true"></i><span>'+a.textContent+'</span>'});
  hero.after(nav);
  var stk=function(){nav.classList.toggle('stuck',nav.getBoundingClientRect().top<=1&&scrollY>40)};addEventListener('scroll',stk,{passive:true});stk();
  new MutationObserver(function(){var a=$('a.on',nav);if(a&&nav.scrollWidth>nav.clientWidth){var l=a.offsetLeft-(nav.clientWidth-a.offsetWidth)/2;nav.scrollTo({left:l,behavior:'smooth'})}}).observe(nav,{subtree:true,attributes:true,attributeFilter:['class']});
  window.dispatchEvent(new Event('resize'))}

 // ===== 倒數卡（count2：福袋＋梅枝）＋旅遊日期卡（info2：景福宮） =====
 var cd=$('#cd'),note=$('#cdnote'),go=$('#gotoday'),sub=$('p',hero);
 var card=document.createElement('section');card.className='card sw-cd panel2 count2';
 card.innerHTML='<div class="sw-cdin"></div>';
 var inn=$('.sw-cdin',card);
 if(note){inn.append(note)}if(cd){cd.classList.add('numbers');inn.append(cd)}
 inn.insertAdjacentHTML('beforeend','<p class="sw-wish"><span lang="ko">새해 복 많이 받으세요!</span><small>新年快樂</small></p>');
 if(go)inn.append(go);
 var info=document.createElement('section');info.className='card sw-info panel2 info2';
 info.innerHTML='<div class="sw-irow"><i class="sw-ical" aria-hidden="true"></i><div><small>旅遊日期</small><b>'+((H.sub||[])[0]||'')+'</b>'+((H.sub||[])[1]?'<span>'+H.sub[1]+'</span>':'')+'</div></div>';
 if(sub)sub.remove();
 var top=document.createElement('div');top.className='sw-top';
 var p1=document.createElement('div');p1.className='pair';p1.append(card,info);top.append(p1);
 nav?nav.after(top):hero.after(top);
 // 天氣卡（整列）；換算／字體／更新維持右側懸浮鈕（使用者指定，方便隨時點）
 var wx=$('#wx');if(wx){wx.classList.add('panel2','sv2-wx');top.append(wx)}

 // ===== 區塊標題：去掉表情符號，文字放進水彩筆刷（brush2），右側放對應素材小插畫 =====
 var DECO={flight:'airplane.png',hotel:'suitcase.png',plan:'hanok-roof.png',phr:'hanok-window.png',food:'hotteok.png',price:'coffee.png',tips:'mittens.png',todo:'plum-branch.png',apps:'snowflake.png',fx:'coffee.png'};
 var BR={flight:'blue',hotel:'green',plan:'rose',phr:'violet',food:'gold',price:'blue',tips:'green',todo:'rose',apps:'violet'};
 $$('main>section[id]>h2').forEach(function(h){
  h.innerHTML=h.innerHTML.replace(/^\s*(?:[←-⯿☀-➿️‍]|[\uD83C-\uDBFF][\uDC00-\uDFFF])+\s*/,'');
  var id=h.parentNode.id;h.innerHTML='<span class="brush2 sv2-'+(BR[id]||'rose')+'">'+h.innerHTML+'</span>';
  var f=DECO[id];h.classList.add('sw-h');if(f)h.insertAdjacentHTML('beforeend',deco(f,'sw-hd',true))});

 // ===== 航班＋住宿並排（pair）：登機證 flight2、飯店卡 hotel2（照片沿用正式網站） =====
 var fl=$('#flight'),ho=$('#hotel');
 if(fl&&ho){var p3=document.createElement('div');p3.className='pair sv2-fh';fl.before(p3);p3.append(fl,ho)}
 $$('#flight .bp').forEach(function(b){b.classList.add('flight2')});
 $$('#hotel details.hotel').forEach(function(d,i){var s=$('summary',d),o=(TRIP.hotels||[])[i]||{};if(!s)return;
  d.classList.add('sw-hotel','panel2','hotel2');
  var src=o.pic==='hpic'?'images/seoul-2027/hotel-2.jpg':'';
  if(src)s.insertAdjacentHTML('afterbegin','<button class="sw-hpic" data-sh="'+o.pic+'" onclick="event.preventDefault()" aria-label="飯店相片"><img src="'+src+'" alt="飯店外觀" loading="lazy"></button>')});

 // ===== 每日行程卡（days2／day2）：Day 筆刷標籤＋插畫（裝飾，依真實行程內容配圖，不代表新增景點）＋當日標題 =====
 // 圖：2/3 出發飛機、2/4 明洞、2/5 玩雪、2/6 景福宮、2/7 南山、2/8 機場返程
 var DIMG=['day-1','day-2','day-5','day-3','day-4','day-6'],ACC=['#a84d59','#497da6','#537c63','#a96730','#78618f','#537c63'];
 var dbox=$('#days');
 if(dbox){dbox.classList.add('days2');
  $$('.dy',dbox).forEach(function(el,k){var r=$('.dr',el);if(!r)return;
   el.classList.add('day2');el.style.setProperty('--accent',ACC[k%ACC.length]);
   var h=((DAYS[k]||{}).h||'').replace(/^Day\s*\d+\s*/i,'');
   r.insertAdjacentHTML('afterbegin','<strong class="sv2-dn">Day '+(k+1)+'</strong>');
   var b=$('b',r);if(b)b.insertAdjacentHTML('afterend','<img class="sv2-dimg" src="'+IMG+(DIMG[k]||'day-1')+'.jpg" alt="" loading="lazy">'+(h?'<span class="sv2-dt">'+h+'</span>':''))})}

 // ===== 底部日期列（dock2）：加「總覽」回到每日行程；日期鍵加 D1～D6 =====
 var dk=$('#daybar');
 if(dk){dk.classList.add('dock2');var row=dk.firstElementChild;
  if(row)row.insertAdjacentHTML('afterbegin','<a class="tile sv2-all" href="#plan"><i aria-hidden="true"></i>總覽</a>');
  $$('#dbtn>button').forEach(function(b){b.classList.add('tile')});
  window.dispatchEvent(new Event('resize'))}

 // ===== 頁尾（footer2）：韓式美食＋首爾天際線 =====
 var ft=$('footer');
 if(ft)ft.insertAdjacentHTML('beforebegin','<div class="footer2"><b>首爾冬日・新春旅行</b>'+((H.sub||[]).length?'<small>'+H.sub.join('・')+'</small>':'')+'</div>');
})();
