// 2027 首爾春節自由行：離線快取。更新網頁後請把 VERSION 數字加 1，手機才會換成新版。
const VERSION='v31';
const CACHE='seoul27-'+VERSION;
const CORE=['./','./index.html','./app.js','./trips/index.json','./trips/seoul-2027.json','./manifest.webmanifest','./icon-180.png','./icon-192.png','./icon-512.png','./icon-maskable-512.png','./images/seoul-2027/day-0.jpg','./images/seoul-2027/day-1.jpg','./images/seoul-2027/day-2a.jpg','./images/seoul-2027/day-2b.jpg','./images/seoul-2027/day-3.jpg','./images/seoul-2027/day-4.jpg','./images/seoul-2027/day-5.jpg','./images/seoul-2027/hero.jpg','./images/seoul-2027/map-hotel.jpg','./images/seoul-2027/map-seoul.jpg'];
self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE).then(c=>Promise.all(CORE.map(u=>c.add(new Request(u,{cache:'reload'})).catch(()=>{})))).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith('seoul27-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',e=>{
  const r=e.request;
  if(r.method!=='GET')return;
  const u=new URL(r.url);
  // 網頁本身：先連網取最新版，沒網路才用快取
  if(r.mode==='navigate'){
    const fb=()=>caches.match('./index.html').then(x=>x||caches.match('./'));
    // 連網 3 秒內沒回應（訊號很弱）就先用快取版
    const net=fetch(r).then(res=>{if(res.ok){const cp=res.clone();caches.open(CACHE).then(c=>c.put('./index.html',cp))}return res});
    const slow=new Promise(ok=>setTimeout(()=>fb().then(x=>ok(x||undefined)),3000));
    e.respondWith(Promise.race([net.catch(()=>fb()),slow]).then(x=>x||net));
    return;
  }
  // 行程資料與程式：先連網取最新版，沒網路才用快取
  if(u.origin===location.origin&&(u.pathname.includes('/trips/')||u.pathname.endsWith('/app.js'))){
    // cache:'no-cache'：跟伺服器確認是否有新版，避免瀏覽器 10 分鐘 HTTP 快取拿到舊檔
    e.respondWith(fetch(r,{cache:'no-cache'}).then(res=>{if(res.ok){const cp=res.clone();caches.open(CACHE).then(c=>c.put(r,cp))}return res}).catch(()=>caches.match(r)));
    return;
  }
  // 同網站檔案（圖示等）與 Google 字型：先用快取，背景更新
  if(u.origin===location.origin||u.hostname==='fonts.googleapis.com'||u.hostname==='fonts.gstatic.com'){
    e.respondWith(caches.open(CACHE).then(c=>c.match(r).then(hit=>{
      const net=fetch(r).then(res=>{if(res&&(res.ok||res.type==='opaque'))c.put(r,res.clone());return res}).catch(()=>hit);
      return hit||net;
    })));
  }
  // 其他（匯率 API、地圖等）直接走網路
});
