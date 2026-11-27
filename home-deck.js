// 總覽旅程卡「便條紙」切換（2026-11-27）：把 #up.journal 裡的旅程卡疊成一疊，一次看一張。
// 往左滑／點「›」＝把最上面那張撕掉（往旁邊飛走）露出下一張；往右滑／點「‹」＝把上一張貼回來。
// 只改顯示方式；卡片內容、連結都是 home.html render() 畫的，沒動。樣式在 layout-fix.css 第 4 段。
(function(){
 var up=document.getElementById('up');if(!up)return;
 var reduce=matchMedia('(prefers-reduced-motion:reduce)').matches,busy=false,cur=0,cards=[],nav=null;
 function setup(){
  cards=[].slice.call(up.querySelectorAll(':scope > article.entry'));
  if(nav){nav.remove();nav=null}
  if(cards.length<2){up.classList.remove('deck');return}
  var first=!up.classList.contains('deck');up.classList.add('deck');
  try{cur=Math.min(cards.length-1,Math.max(0,+sessionStorage.getItem('deckI')||0))}catch(e){}
  nav=document.createElement('div');nav.className='deck-nav';
  nav.innerHTML='<button type="button" class="dk-prev" aria-label="上一個旅程">‹</button><div class="dk-dots">'+cards.map(function(c,i){var n=c.querySelector('h2');return '<button type="button" aria-label="'+(n?n.textContent:'旅程 '+(i+1))+'"></button>'}).join('')+'</div><button type="button" class="dk-next" aria-label="下一個旅程">›</button>';
  up.after(nav);
  nav.querySelector('.dk-prev').onclick=function(){go(cur-1,-1)};
  nav.querySelector('.dk-next').onclick=function(){go(cur+1,1)};
  [].forEach.call(nav.querySelectorAll('.dk-dots button'),function(b,i){b.onclick=function(){if(i!==cur)go(i,i>cur?1:-1)}});
  paint();
  if(!first)return; // render() 重畫卡片時只重建導覽，事件只綁一次
  // 滑動：水平超過 50px 才算，滑過就擋掉這次點擊，避免誤開行程
  var sx=0,sy=0,moved=false;
  up.addEventListener('touchstart',function(e){sx=e.touches[0].clientX;sy=e.touches[0].clientY;moved=false},{passive:true});
  up.addEventListener('touchmove',function(e){var dx=e.touches[0].clientX-sx,dy=e.touches[0].clientY-sy;if(Math.abs(dx)>12&&Math.abs(dx)>Math.abs(dy))moved=true},{passive:true});
  up.addEventListener('touchend',function(e){if(!moved)return;var dx=e.changedTouches[0].clientX-sx;if(Math.abs(dx)>50)go(cur+(dx<0?1:-1),dx<0?1:-1)},{passive:true});
  up.addEventListener('click',function(e){if(moved){e.preventDefault();e.stopPropagation();moved=false}},true);
  addEventListener('keydown',function(e){if(e.target.closest&&e.target.closest('input,textarea'))return;if(e.key==='ArrowRight')go(cur+1,1);else if(e.key==='ArrowLeft')go(cur-1,-1)});
 }
 function paint(){
  cards.forEach(function(c,i){var d=(i-cur+cards.length)%cards.length;c.style.setProperty('--d',d);c.classList.toggle('top',d===0);c.setAttribute('aria-hidden',d===0?'false':'true');c.inert=d!==0});
  [].forEach.call(nav.querySelectorAll('.dk-dots button'),function(b,i){b.classList.toggle('on',i===cur);b.setAttribute('aria-current',i===cur?'true':'false')});
  try{sessionStorage.setItem('deckI',cur)}catch(e){}
 }
 function go(n,dir){
  if(busy)return;n=(n+cards.length)%cards.length;if(n===cur)return;
  if(reduce){cur=n;paint();return}
  busy=true;
  if(dir>0){ // 撕掉最上面那張
   var t=cards[cur];t.classList.add('tear');t.classList.toggle('tear-r',false);
   setTimeout(function(){cur=n;paint();t.classList.add('tuck');t.classList.remove('tear');
    requestAnimationFrame(function(){requestAnimationFrame(function(){t.classList.remove('tuck');busy=false})})},560);
  }else{ // 把上一張貼回來
   cur=n;var b=cards[cur];b.classList.add('stick');paint();
   setTimeout(function(){b.classList.remove('stick');busy=false},520);
  }
 }
 addEventListener('scroll',function(){document.body.classList.toggle('cv-scrolled',scrollY>4)},{passive:true}); // 封面下緣的淡出只在捲動後出現
 // home.html 先用內建清單畫一次、抓到 trips/index.json 後會再畫一次，所以每次卡片換掉都重新整理
 if(up.querySelector('article.entry'))setup();
 new MutationObserver(function(){setup()}).observe(up,{childList:true});
})();
