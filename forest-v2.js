// 森林手帳 V2 版面（東京 tokyo.html、露營車 campervan.html 共用）。
// 只搬動／包裝頁面已畫好的元素、換上 images/forest-journal-v2/ 水彩素材；不改行程資料（trips/*.json、campervan.html 的 const D）與原本的功能邏輯。
// 樣式在 theme-forest-v2.css（全部以 html.fj2 開頭）。
// 切換：?theme=classic＝v168 之前的原版（不套森林手帳）；?theme=v1＝森林手帳第一版（v168）；?theme=forest＝目前的 V2（預設）。記在這支手機（localStorage "theme"）。
(function(){
 var R=document.documentElement;
 if(!R.classList.contains('fj2'))return; // classic／v1 時 <head> 的腳本已拿掉 fj2
 var $=function(s,r){return (r||document).querySelector(s)},$$=function(s,r){return [].slice.call((r||document).querySelectorAll(s))};
 var IMG='images/forest-journal-v2/';
 var ic=function(n){return IMG+'icon-'+n+'.png'};
 var LEAF='images/forest-journal/leaf.webp';
 var EMO=/^\s*(?:[←-⯿☀-➿️‍]|[\uD83C-\uDBFF][\uDC00-\uDFFF])+\s*/;
 var swapImg=function(img,src){if(!img)return;var old=img.getAttribute('src');img.onerror=function(){img.onerror=null;img.src=old};img.src=src};

 // ================= 東京 tokyo.html（app.js 畫完後執行） =================
 if(window.TRIP&&$('#hero')){
  // 舊的線條圖示（ic-xxx.svg）→ 水彩小插畫，對應關係固定，只換圖不改資料
  var ICM={city:'city',forest:'forest',fuji:'fuji',plane:'plane',port:'harbor',van:'camper'};
  var toWC=function(img){var m=(img.getAttribute('src')||'').match(/ic-(\w+)\.svg$/);if(m&&ICM[m[1]]){img.dataset.old=img.getAttribute('src');swapImg(img,ic(ICM[m[1]]));img.classList.add('fj2-wc')}};

  // ---- 頁首：品牌列（標題＋選單鍵），原本的橫向導覽移到封面下方變成圖示紙卡 ----
  var hd=$('#hd'),nav=$('#hd nav'),hero=$('#hero');
  hd.insertAdjacentHTML('afterbegin','<div class="fj2-brand"><img src="'+LEAF+'" alt="" aria-hidden="true"><b>東京旅遊</b><img class="r" src="'+LEAF+'" alt="" aria-hidden="true"><button type="button" class="fj2-menu" aria-label="回到功能選單"><svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg></button></div>');
  var NIC={flight:'flight',plan:'schedule',hotel:'hotel',phr:'japanese',tips:'info',todo:'todo',workman:'workman',fx:'info',food:'city',price:'todo',apps:'info'};
  if(nav){
   nav.classList.add('fj2-nav');nav.setAttribute('aria-label','功能選單');
   $$('a',nav).forEach(function(a){var id=(a.getAttribute('href')||'').slice(1),t=a.textContent;a.innerHTML='<i aria-hidden="true" style="background-image:url('+ic(NIC[id]||'info')+')"></i><span>'+t+'</span>'});
   nav.classList.toggle('odd',$$('a',nav).length%4!==0);
   hero.after(nav); // 先放封面後，下面倒數卡建好後再移到封面與倒數卡之間
   $('.fj2-menu').onclick=function(){nav.scrollIntoView({behavior:'smooth',block:'center'})};
  }

  // ---- 封面：水彩淺草＋晴空塔，HTML 標題（圖片載入失敗退回原本封面） ----
  var bg=$('.hero-bg',hero);
  if(bg){swapImg(bg,IMG+'tokyo-hero.webp');bg.alt='東京封面：淺草雷門與東京晴空塔水彩插畫';bg.setAttribute('fetchpriority','high')}
  hero.classList.add('fj2-hero');
  var fig=document.createElement('div');fig.className='fj2-cover';
  if(bg)fig.append(bg);
  fig.insertAdjacentHTML('beforeend','<div class="fj2-title"><h1>東京旅遊</h1><p><em lang="en">Tokyo</em><span class="fj2-seal" aria-hidden="true">東京</span></p></div>');
  hero.prepend(fig);
  var info=document.createElement('div');info.className='fj2-cdcard';
  $$(':scope>p,:scope>.cd,:scope>#cdnote,:scope>#gotoday',hero).forEach(function(e){info.append(e)});
  var cdn=$('#cdnote',info),cd=$('#cd',info);if(cdn&&cd)info.insertBefore(cdn,cd);
  hero.append(info);
  if(nav)hero.insertBefore(nav,info);

  // ---- 區塊標題：去表情符號，兩側水彩葉片 ----
  $$('main>section[id]>h2').forEach(function(h){h.innerHTML=h.innerHTML.replace(EMO,'');h.classList.add('fj2-h')});
  var ph=$('#plan>h2');if(ph)ph.textContent='我的東京行程';

  // ---- 每日行程：方案卡、日期分頁（代按下方日期列）、行程卡片縮圖 ----
  $$('#plan .plans .pic,#days .dic').forEach(toWC);
  // 橫幅：富士山 → 湖畔露營車水彩、雷門 → 淺草雷門水彩（只換圖，圖說文字照舊）
  $$('.bnr img').forEach(function(b){var s=b.getAttribute('src')||'';if(/banner-fuji/.test(s)){swapImg(b,IMG+'campervan-hero.webp');b.alt='富士山湖畔與露營車水彩插畫'}else if(/banner-kaminarimon/.test(s)){swapImg(b,IMG+'asakusa-banner.webp');b.alt='淺草雷門水彩插畫'}else return;b.closest('.bnr').classList.add('fj2-bnr')});
  var dbtn=$('#dbtn'),days=$('#days');
  if(dbtn&&days){
   var tabs=document.createElement('div');tabs.className='fj2-daytabs';tabs.setAttribute('role','tablist');tabs.setAttribute('aria-label','選擇日期');
   $$('button',dbtn).forEach(function(b,k){var t=document.createElement('button');t.type='button';t.innerHTML='Day '+(k+1)+'<small>'+(b.firstChild&&b.firstChild.nodeType===3?b.firstChild.nodeValue:'')+'</small>';t.onclick=function(){b.click()};tabs.append(t)});
   days.before(tabs);
   var sync=function(){var bs=$$('button',dbtn);$$('button',tabs).forEach(function(t,k){var on=!!bs[k]&&bs[k].classList.contains('on');t.classList.toggle('on',on);t.setAttribute('aria-selected',on)});
    var o=$('.on',tabs);if(o&&tabs.scrollWidth>tabs.clientWidth)tabs.scrollTo({left:o.offsetLeft-(tabs.clientWidth-o.offsetWidth)/2,behavior:'smooth'})};
   new MutationObserver(sync).observe(dbtn,{subtree:true,attributes:true,attributeFilter:['class']});sync();
   $$('.dr',days).forEach(function(r){r.insertAdjacentHTML('beforeend','<span class="fj2-chev" aria-hidden="true"></span>')});
  }


  // ---- 頁尾：富士山與繡球花 ----
  var ff=$('.forest-footer');if(ff){swapImg(ff,IMG+'footer-fuji.webp');ff.removeAttribute('width');ff.removeAttribute('height')}
  window.dispatchEvent(new Event('resize'));window.dispatchEvent(new Event('scroll'));
  // 切換方案（app.js 會重新載入並捲到每日行程）：版面重排後再捲一次
  if(window.FJ2_GO){var pl=$('#plan'),toPlan=function(){if(pl)pl.scrollIntoView({block:'start'})};setTimeout(toPlan,150);
   // 重新整理後瀏覽器會在 load 時還原捲動位置，所以 load 後再捲一次
   if(document.readyState!=='complete')addEventListener('load',function(){setTimeout(toPlan,60)},{once:true})}
  return;
 }

 // ================= 露營車 campervan.html（頁面腳本之後執行） =================
 if(typeof window.render==='function'&&$('#m')&&$('#tabs')){
  var T={zh:{brand:'露營車之旅',sec:'露營車行程',sub:'Campervan Trip',keys:['行程總覽','里程地圖','RV Park','酒藏巡禮'],back:'東京行程'},
         ja:{brand:'キャンピングカーの旅',sec:'旅程',sub:'Campervan Trip',keys:['概要','距離・地図','RV Park','酒蔵めぐり'],back:'東京'}};
  var L=function(){return T[document.documentElement.lang==='ja'?'ja':'zh']};
  var bar=$('.bar'),tabs=$('#tabs'),hero=$('header.hero'),wrap=hero&&hero.parentNode;
  // 品牌列（取代原本頂部的分頁列位置；分頁改放到封面與圖示卡下方，捲動時黏在品牌列下）
  bar.classList.add('fj2-bar');
  $('.wrap',bar).insertAdjacentHTML('afterbegin','<div class="fj2-brand"><a class="fj2-backi" href="tokyo.html" aria-label="回東京行程"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg></a><img src="'+LEAF+'" alt="" aria-hidden="true"><b></b><img class="r" src="'+LEAF+'" alt="" aria-hidden="true"></div>');
  // 封面：露營車湖畔水彩＋標題
  hero.classList.add('fj2-hero');
  hero.insertAdjacentHTML('afterbegin','<div class="fj2-cover"><img class="fj2-cimg" src="'+IMG+'campervan-hero.webp" alt="富士山湖畔與露營車水彩插畫" fetchpriority="high"></div>');
  var ti=$('#ti');ti.insertAdjacentHTML('afterend','<p class="fj2-en" lang="en">Campervan Trip</p>');
  // 功能圖示紙卡：只放頁面原本就有的分頁
  var KEYS=[['ov','schedule'],['mp','fuji'],['rv','camper','rv'],['rv','japanese','brew']];
  var grid=document.createElement('nav');grid.className='fj2-keys';grid.setAttribute('aria-label','功能選單');
  grid.innerHTML=KEYS.map(function(k,i){return '<button type="button" data-fk="'+i+'"><i aria-hidden="true" style="background-image:url('+ic(k[1])+')"></i><span></span></button>'}).join('');
  hero.after(grid);
  var sech=document.createElement('h2');sech.className='fj2-sech';var sec=document.createElement('div');sec.className='fj2-tabsec';
  grid.after(sech);sech.after(sec);sec.append(tabs);
  var toContent=function(){requestAnimationFrame(function(){var y=sec.getBoundingClientRect().top+scrollY-($('.bar').offsetHeight||0)+2;scrollTo({top:y,behavior:'smooth'})})};
  grid.onclick=function(e){var b=e.target.closest('[data-fk]');if(!b)return;var k=KEYS[+b.dataset.fk];if(k[2]&&typeof rvSet==='function')rvSet(k[2]);go(k[0]);toContent()};
  var sc=$('.forest-scene');if(sc)sc.remove();
  var ff2=$('.forest-footer');if(ff2){swapImg(ff2,IMG+'footer-fuji.webp');ff2.removeAttribute('width');ff2.removeAttribute('height')}

  // 每天的縮圖（總覽頁的日程卡；分頁本身不變）
  var DIC={d1:'camper',d2:'forest',d3:'fuji',d4:'city'};
  var post=function(){
   var l=L();$('.fj2-brand b',bar).textContent=l.brand;sech.textContent=l.sec;
   $$('span',grid).forEach(function(s,i){s.textContent=l.keys[i]});
   var p=document.body.dataset.p;
   $$('button',grid).forEach(function(b,i){var k=KEYS[i],sub=k[2];var rvs='rv';try{rvs=localStorage.getItem('rvs')||'rv'}catch(e){}b.classList.toggle('on',p===k[0]&&(!sub||sub===rvs))});
   $$('#m .ph h2,#m h3').forEach(function(h){h.innerHTML=h.innerHTML.replace(EMO,'')});
   if(p==='ov'&&typeof D!=='undefined'){var lg=document.documentElement.lang==='ja'?'ja':'zh',DD=D[lg];
    var cards=['d1','d2','d3','d4'].map(function(k){var t=(DD[k]&&DD[k][0])||'',a=t.split('｜')[0],b=t.split('｜').slice(1).join('｜'),n=(DD[k]&&DD[k][1]||[]).length;
     return '<button type="button" class="fj2-day" data-gd="'+k+'"><img src="'+ic(DIC[k])+'" alt="" loading="lazy"><span class="fj2-dt"><b>'+a+'</b><span>'+b+'</span><small>'+n+(lg==='ja'?' 件の予定':' 個行程點')+'</small></span><span class="fj2-chev" aria-hidden="true"></span></button>'}).join('');
    var st=$('#m .stats');if(st)st.insertAdjacentHTML('afterend','<div class="fj2-days">'+cards+'</div>');
    $$('#m [data-gd]').forEach(function(b){b.onclick=function(){go(b.dataset.gd);toContent()}})}
  };
  var _render=window.render;window.render=function(){var r=_render.apply(this,arguments);try{post()}catch(e){}return r};
  window.render();
 }
})();
