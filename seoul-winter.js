// 首爾冬日旅行手帳（Seoul Winter）版面：只在首爾頁（index.html?t=seoul-2027）由 index.html 於 app.js 之後載入。
// 只搬動／包裝 app.js 已畫好的元素並加上素材圖，不改任何行程資料；樣式在 theme-han.css 最後的「Seoul Winter」區塊（html.th-han.sw）。
// 恢復舊版：網址加 ?theme=classic（記在這支手機）；?theme=winter 改回。
(function(){
 var q=new URLSearchParams(location.search).get('theme');
 try{if(q==='classic'||q==='winter')localStorage.setItem('seoulTheme',q)}catch(e){}
 var th=null;try{th=localStorage.getItem('seoulTheme')}catch(e){}
 if(th==='classic'||!window.TRIP||!document.getElementById('hero'))return;
 var $=function(s,r){return (r||document).querySelector(s)},$$=function(s,r){return [].slice.call((r||document).querySelectorAll(s))};
 var IMG='images/seoul-2027/decor/';
 var deco=function(f,c,lazy){return '<img class="sw-deco '+c+'" src="'+IMG+f+'" alt=""'+(lazy?' loading="lazy"':'')+' aria-hidden="true">'};
 var H=TRIP.hero||{},M=TRIP.meta||{};
 document.documentElement.classList.add('sw');

 // ===== 封面：冬日韓屋插畫＋HTML 標題（標題文字取自行程資料） =====
 var hero=$('#hero'),bg=$('.hero-bg',hero);
 hero.classList.add('sw-hero');
 if(bg){var old=bg.getAttribute('src');bg.onerror=function(){bg.onerror=null;bg.removeAttribute('srcset');bg.src=old};bg.sizes='(min-width:1000px) 1000px, 100vw';bg.srcset=IMG+'hero-winter-m.jpg 1000w, '+IMG+'hero-winter.jpg 1672w';bg.src=IMG+'hero-winter.jpg';bg.alt=H.alt?'首爾封面：雪中的北村韓屋與南山首爾塔':'';bg.setAttribute('fetchpriority','high')}
 var ttl=H.title||M.title||'';
 hero.insertAdjacentHTML('beforeend','<div class="sw-title"><span class="sw-ko" lang="ko">서울</span><h1><span class="sw-zh">首爾</span><em lang="en">Seoul</em></h1><p class="sw-ribbon">'+ttl+'</p>'+(H.eyebrow?'<p class="sw-en">'+H.eyebrow+'</p>':'')+'</div>');

 // ===== 功能選單：從頁首移到封面下方（保留同一組連結，捲動標示照常運作） =====
 var nav=$('#hd nav');
 if(nav){nav.classList.add('sw-nav');nav.setAttribute('aria-label','功能選單');
  $$('a',nav).forEach(function(a){var id=(a.getAttribute('href')||'').slice(1);a.dataset.ic=id;a.innerHTML='<i aria-hidden="true"></i><span>'+a.textContent+'</span>'});
  hero.after(nav);
  var stk=function(){nav.classList.toggle('stuck',nav.getBoundingClientRect().top<=1&&scrollY>40)};addEventListener('scroll',stk,{passive:true});stk();
  // 目前區塊的按鈕捲進可視範圍
  new MutationObserver(function(){var a=$('a.on',nav);if(a&&nav.scrollWidth>nav.clientWidth){var l=a.offsetLeft-(nav.clientWidth-a.offsetWidth)/2;nav.scrollTo({left:l,behavior:'smooth'})}}).observe(nav,{subtree:true,attributes:true,attributeFilter:['class']});
  window.dispatchEvent(new Event('resize'))}

 // ===== 倒數卡：韓式福袋＋倒數＋新年祝福 =====
 var cd=$('#cd'),note=$('#cdnote'),go=$('#gotoday'),sub=$('p',hero);
 var card=document.createElement('div');card.className='card sw-cd';
 card.innerHTML=deco('bokjumeoni.png','sw-bok')+deco('plum-branch.png','sw-plum')+'<div class="sw-cdin"></div>';
 var inn=$('.sw-cdin',card);
 if(note)inn.append(note);if(cd)inn.append(cd);
 inn.insertAdjacentHTML('beforeend','<p class="sw-wish"><span lang="ko">새해 복 많이 받으세요</span><small>新年快樂</small></p>');
 if(go)inn.append(go);
 // ===== 旅遊日期卡（日期取自封面資料）＋南山塔插畫 =====
 var info=document.createElement('div');info.className='card sw-info';
 info.innerHTML='<div class="sw-irow"><i class="sw-ical" aria-hidden="true"></i><div><small>旅遊日期</small><b>'+((H.sub||[])[0]||'')+'</b>'+((H.sub||[])[1]?'<span>'+H.sub[1]+'</span>':'')+'</div></div>'+deco('namsan-tower.png','sw-tower');
 if(sub)sub.remove();
 var top=document.createElement('div');top.className='sw-top';top.append(card,info);
 nav?nav.after(top):hero.after(top);
 var wx=$('#wx');if(wx)top.append(wx);

 // ===== 區塊標題：去掉表情符號，右側放對應素材小插畫 =====
 var DECO={flight:'airplane.png',hotel:'suitcase.png',plan:'hanok-roof.png',phr:'hanok-window.png',food:'hotteok.png',price:'coffee.png',tips:'mittens.png',todo:'plum-branch.png',apps:'snowflake.png',fx:'coffee.png'};
 $$('main>section[id]>h2').forEach(function(h){
  h.innerHTML=h.innerHTML.replace(/^\s*(?:[←-⯿☀-➿️‍]|[\uD83C-\uDBFF][\uDC00-\uDFFF])+\s*/,'');
  var f=DECO[h.parentNode.id];if(f){h.classList.add('sw-h');h.insertAdjacentHTML('beforeend',deco(f,'sw-hd',true))}});

 // ===== 住宿：飯店外觀照片＋文字質感卡（點照片開相簿） =====
 $$('#hotel details.hotel').forEach(function(d,i){var s=$('summary',d),o=(TRIP.hotels||[])[i]||{};if(!s)return;
  d.classList.add('sw-hotel');
  var src=o.pic==='hpic'?'images/seoul-2027/hotel-2.jpg':'';
  if(src)s.insertAdjacentHTML('afterbegin','<button class="sw-hpic" data-sh="'+o.pic+'" onclick="event.preventDefault()" aria-label="飯店相片"><img src="'+src+'" alt="飯店外觀" loading="lazy"></button>')});

 // ===== 頁尾：首爾街景與冬日小吃插畫 =====
 var ft=$('footer');
 if(ft)ft.insertAdjacentHTML('beforebegin','<div class="sw-foot" aria-hidden="true"><img class="sw-sky" src="'+IMG+'seoul-skyline.jpg" alt="" loading="lazy"><div class="sw-snacks">'+deco('eomuk.png','',true)+deco('hotteok.png','',true)+deco('coffee.png','',true)+deco('mittens.png','',true)+'</div></div>');
})();
