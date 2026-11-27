// 工具選單（首爾 index.html、港珠澳 hk.html）：把右側直排的懸浮鈕（換算 #fxb、字體 #fs、更新 #upd）收進一顆「工具」鈕，
// 點開才往上展開，避免在手機上蓋住航班卡、天氣卡的文字。做法同東京／露營車的 forest-v2.js tools()，
// 只改位置與顯示，按鈕本身與原本的點擊功能都沒動。外觀（底色、框線、字色、陰影、尺寸）直接複製 #fs，跟各頁主題一致。
// 2026-11-27 新增。
(function(){
 if(document.documentElement.classList.contains('fj2'))return; // 森林手帳頁已有自己的工具選單
 var IDS=['fxb','fs','upd'],tries=0;
 function init(){
  var bs=IDS.map(function(i){return document.getElementById(i)}).filter(Boolean);
  if((!document.getElementById('fxb')&&tries++<40)){setTimeout(init,100);return} // #fxb 由 app.js 載入行程後才產生
  if(bs.length<2||document.getElementById('tm-tools'))return;
  var ref=document.getElementById('fs')||bs[0],cs=getComputedStyle(ref),base=bs[bs.length-1];
  var bc=getComputedStyle(base),size=ref.offsetWidth||52,gap=8;
  var t=document.createElement('button');t.id='tm-tools';t.type='button';t.setAttribute('aria-expanded','false');t.setAttribute('aria-label','工具選單（換算、字體、更新）');
  t.innerHTML='<svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/></svg><small>工具</small>';
  ['backgroundColor','border','color','boxShadow','borderRadius','fontFamily','zIndex'].forEach(function(p){t.style[p]=cs[p]});
  t.style.width=t.style.height=size+'px';t.style.right=bc.right;t.style.bottom=bc.bottom;
  document.body.appendChild(t);
  var b0=parseFloat(bc.bottom)||70;
  bs.forEach(function(b,k){b.classList.add('tm-tool');b.style.setProperty('bottom',(b0+(bs.length-k)*(size+gap))+'px','important');b.style.setProperty('right',bc.right,'important')});
  var B=document.body,open=function(v){B.classList.toggle('tm-open',v);t.setAttribute('aria-expanded',v);bs.forEach(function(b){if(v)b.removeAttribute('tabindex');else b.setAttribute('tabindex','-1')});if(v)B.classList.remove('tm-hide')};
  open(false);requestAnimationFrame(function(){requestAnimationFrame(function(){B.classList.add('tm-ready')})});
  t.onclick=function(e){e.stopPropagation();open(!B.classList.contains('tm-open'))};
  document.addEventListener('click',function(e){if(!B.classList.contains('tm-open'))return;if(e.target.closest('#tm-tools,.tm-tool,.fxp'))return;open(false)});
  addEventListener('keydown',function(e){if(e.key==='Escape')open(false)});
  var ly=scrollY,tm=0;
  addEventListener('scroll',function(){var y=scrollY;if(!B.classList.contains('tm-open')&&y>ly+4&&y>200)B.classList.add('tm-hide');else if(y<ly-4)B.classList.remove('tm-hide');ly=y;clearTimeout(tm);tm=setTimeout(function(){B.classList.remove('tm-hide')},900)},{passive:true});
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
