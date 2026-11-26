// 檢查更新（所有旅程網頁共用）：比對網站上的 sw.js 版本和手機裡的快取版本，
// 有新版就清掉舊快取並重新載入；沒有就提示已是最新版。
// 用法：任何元素加上 data-upd 屬性，點了就會檢查。
(function(){
 function toast(msg){
  var t=document.getElementById('updtoast');
  if(!t){t=document.createElement('div');t.id='updtoast';t.setAttribute('role','status');
   t.style.cssText='position:fixed;left:50%;top:calc(env(safe-area-inset-top,0px) + 18px);transform:translateX(-50%);z-index:200;max-width:calc(100% - 32px);padding:10px 18px;border-radius:999px;background:var(--card,var(--bg2,#fff));color:var(--ink,#222);border:1px solid var(--line,rgba(0,0,0,.12));font-size:15px;line-height:1.4;text-align:center;box-shadow:0 8px 24px rgba(0,0,0,.18);transition:opacity .3s;pointer-events:none';
   document.body.appendChild(t)}
  t.textContent=msg;t.style.opacity='1';clearTimeout(t._h);t._h=setTimeout(function(){t.style.opacity='0'},2600)}
 var busy=false;
 async function check(){
  if(busy)return;busy=true;toast('檢查更新中…');
  try{
   var txt=await (await fetch('sw.js?ts='+Date.now(),{cache:'no-store'})).text();
   var v=(txt.match(/VERSION\s*=\s*'([^']+)'/)||[])[1];
   var ks=('caches' in window)?await caches.keys():[];
   var cur=ks.indexOf('trip-'+v)>=0?'trip-'+v:ks.filter(function(k){return k.indexOf('trip-')===0})[0];/* 有新版快取就算最新（舊快取可能暫時保留當備援） */
   if(!v){toast('無法取得版本，請稍後再試');busy=false;return}
   if(cur==='trip-'+v){toast('已是最新版（'+v+'）');busy=false;return}
   toast('發現新版，更新中…');
   if(navigator.serviceWorker){var r=await navigator.serviceWorker.getRegistration();if(r){try{await r.update()}catch(e){}}}
   await Promise.all(ks.map(function(k){return caches.delete(k)}));
   setTimeout(function(){location.reload()},600);
  }catch(e){toast('沒有網路，連上網路後再試');busy=false}
 }
 window.checkUpdate=check;
 document.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('[data-upd]');if(b){e.preventDefault();check()}});
})();
