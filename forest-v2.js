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
 var LEAF='images/forest-journal-v2/leaf-branch.png';
 var EMO=/^\s*(?:[←-⯿☀-➿️‍]|[\uD83C-\uDBFF][\uDC00-\uDFFF])+\s*/;
 var swapImg=function(img,src){if(!img)return;var old=img.getAttribute('src');img.onerror=function(){img.onerror=null;img.src=old};img.src=src};

 // ================= V2.1 共用：可展開工具選單＋版本提示 =================
 // 工具選單：原本右下角的懸浮鈕（換算 #fxb、字體 #fs、語言 #lgb、更新 #upd）收進一顆「工具」鈕，點開才顯示；
 // 按鈕本身與原有點擊功能都沒改，只改位置與顯示。往下捲動時工具鈕暫時淡出，停下或往上捲就回來，避免擋住卡片文字與箭頭。
 var VER={loaded:null,latest:null,state:''};
 function tools(ids){
  var bs=ids.map(function(i){return document.getElementById(i)}).filter(Boolean);if(!bs.length)return;
  var t=document.createElement('button');t.id='fj2-tools';t.type='button';t.setAttribute('aria-expanded','false');t.setAttribute('aria-label','工具選單（換算、字體、更新等）');
  t.innerHTML='<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/></svg><small>工具</small><i class="fj2-dot" hidden></i>';
  var ver=document.createElement('div');ver.id='fj2-ver';ver.setAttribute('role','status');
  document.body.append(ver,t);
  bs.forEach(function(b,k){b.classList.add('fj2-tool');b.style.setProperty('--fj2-i',k+1)});
  R.style.setProperty('--fj2-n',bs.length);
  var open=function(v){document.body.classList.toggle('fj2-tools-open',v);t.setAttribute('aria-expanded',v);bs.forEach(function(b){if(v)b.removeAttribute('tabindex');else b.setAttribute('tabindex','-1')});if(v)document.body.classList.remove('fj2-tools-hide')};
  open(false);requestAnimationFrame(function(){requestAnimationFrame(function(){document.body.classList.add('fj2-tools-ready')})});
  t.onclick=function(e){e.stopPropagation();open(!document.body.classList.contains('fj2-tools-open'))};
  document.addEventListener('click',function(e){if(!document.body.classList.contains('fj2-tools-open'))return;if(e.target.closest('#fj2-tools,.fj2-tool,.fxp,#fj2-ver'))return;open(false)});
  addEventListener('keydown',function(e){if(e.key==='Escape')open(false)});
  var ly=scrollY,tm=0;
  addEventListener('scroll',function(){var y=scrollY;if(!document.body.classList.contains('fj2-tools-open')&&y>ly+4&&y>200)document.body.classList.add('fj2-tools-hide');else if(y<ly-4)document.body.classList.remove('fj2-tools-hide');ly=y;clearTimeout(tm);tm=setTimeout(function(){document.body.classList.remove('fj2-tools-hide')},900)},{passive:true});
  verLine();
 }
 function verLine(){var v=$('#fj2-ver');if(!v)return;var s=VER.state;
  v.innerHTML=s==='ready'?'<b>新版 '+VER.latest+' 已下載</b><button type="button" class="fj2-reload">重新載入套用</button>'
   :s==='downloading'?'<b>發現新版 '+VER.latest+'</b><span>下載中，完成後會提示…</span>'
   :s==='ok'?'<span>目前版本 '+VER.loaded+'・已是最新</span>'
   :VER.loaded?'<span>目前版本 '+VER.loaded+'</span>':'';
  var d=$('.fj2-dot');if(d)d.hidden=!(s==='ready'||s==='downloading');
  document.body.classList.toggle('fj2-has-update',s==='ready');
  var r=$('.fj2-reload',v);if(r)r.onclick=function(){try{sessionStorage.setItem('fj2upd',VER.latest)}catch(_){}location.reload()}}
 function toast(msg){var t=document.createElement('div');t.className='fj2-toast';t.setAttribute('role','status');t.textContent=msg;document.body.append(t);setTimeout(function(){t.classList.add('out')},3200);setTimeout(function(){t.remove()},3800)}
 // 版本提示：頁面開啟當下（<head> 先記下）用的是哪個快取版本，和網站上的 sw.js 比對。
 // 舊版 → 顯示「發現新版、下載中」，Service Worker 裝好新快取後改成「新版已下載，重新載入套用」（工具鈕亮綠點、頂部出現提示條）；
 // 重新載入後若已是新版 → 提示「已更新到 vXXX」。沒有 Service Worker 控制（第一次開、本機測試）時不顯示。
 function verCheck(){
  var num=function(k){return +(String(k).match(/(\d+)$/)||[0,0])[1]};
  Promise.resolve(window.FJ2_CV||null).then(function(ks){
   ks=(ks||[]).filter(function(k){return k.indexOf('trip-')===0}).sort(function(a,b){return num(a)-num(b)});
   if(!ks.length)return;VER.loaded=ks[0].slice(5);verLine();
   var done=null;try{done=sessionStorage.getItem('fj2upd');sessionStorage.removeItem('fj2upd')}catch(_){}
   return fetch('sw.js?ts='+Date.now(),{cache:'no-store'}).then(function(r){return r.text()}).then(function(txt){
    var v=(txt.match(/VERSION\s*=\s*'([^']+)'/)||[])[1];if(!v)return;VER.latest=v;
    if(v===VER.loaded){VER.state='ok';verLine();if(done)toast('已更新到最新版 '+v+' ✓');return}
    VER.state='downloading';verLine();showBar();
    var n=0,poll=function(){caches.keys().then(function(k2){if(k2.indexOf('trip-'+v)>=0&&k2.filter(function(k){return k.indexOf('trip-')===0}).length===1){VER.state='ready';verLine();showBar()}else if(++n<60)setTimeout(poll,1000)})};
    if(navigator.serviceWorker){navigator.serviceWorker.getRegistration().then(function(r){if(r)r.update().catch(function(){})})}
    poll();
   });
  }).catch(function(){});
 }
 function showBar(){var b=$('#fj2-bar');if(!b){b=document.createElement('div');b.id='fj2-bar';b.setAttribute('role','status');document.body.append(b)}
  b.innerHTML=VER.state==='ready'?'<span>新版 '+VER.latest+' 已下載完成</span><button type="button">重新載入</button><button type="button" class="x" aria-label="稍後">✕</button>'
   :'<span>發現新版 '+VER.latest+'，背景下載中…</span><button type="button" class="x" aria-label="關閉">✕</button>';
  var bt=b.querySelectorAll('button');bt.forEach(function(x){x.onclick=function(){if(x.classList.contains('x')){b.remove();return}try{sessionStorage.setItem('fj2upd',VER.latest)}catch(_){}location.reload()}})}

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
  var ph=$('#plan>h2');if(ph)ph.innerHTML='<span class="fj2-sign">我的東京行程</span>';

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


  tools(['upd','fs','fxb']);verCheck();
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
  var KEYS=[['ov','schedule'],['mp','fuji'],['rv','camper','rv'],['rv','sake','brew']];
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
   var l=L();$('.fj2-brand b',bar).textContent=l.brand;sech.innerHTML='<span class="fj2-sign">'+l.sec+'</span>';
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
  tools(['upd','lgb']);verCheck();
 }
})();
