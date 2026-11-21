// 旅程網站離線快取（所有旅程共用）。更新網頁後請把 VERSION 數字加 1，手機才會換成新版。
// 新增旅程時，把 trips/<代號>.json、圖示與圖片加進 CORE。
const VERSION='v85';
const CACHE='trip-'+VERSION;
const CORE=['./','./?t=seoul-2027','./index.html','./hk.html','./home.html','./style.css','./app.js','./theme-bay.css','./theme-han.css','./tokyo.html','./theme-fuji.css','./trips/tokyo-2027.json','./manifest-tokyo-2027.webmanifest','./icon-tokyo-180.png','./icon-tokyo-192.png','./icon-tokyo-512.png','./icon-tokyo-maskable-512.png','./images/tokyo-2027/hero.jpg','./images/tokyo-2027/banner-fuji.svg','./images/tokyo-2027/banner-karuizawa.svg','./images/tokyo-2027/banner-kaminarimon.svg','./images/tokyo-2027/ic-plane.svg','./images/tokyo-2027/ic-van.svg','./images/tokyo-2027/ic-fuji.svg','./images/tokyo-2027/ic-forest.svg','./images/tokyo-2027/ic-city.svg','./images/tokyo-2027/ic-port.svg','./keihan.html','./trips/keihan-2027.json','./manifest-keihan-2027.webmanifest','./icon-keihan-180.png','./icon-keihan-192.png','./icon-keihan-512.png','./icon-keihan-maskable-512.png','./images/keihan-2027/cover.jpg','./images/keihan-2027/ic-dango.svg','./images/keihan-2027/ic-kyoto_tower.svg','./images/keihan-2027/ic-moon_stars.svg','./images/keihan-2027/ic-osaka_dotonbori.svg','./images/keihan-2027/ic-pagoda_sunset.svg','./images/keihan-2027/ic-sakura.svg','./images/keihan-2027/ic-torii_gate.svg','./images/keihan-2027/ic-train.svg','./images/keihan-2027/ic-umbrella.svg','./images/keihan-2027/umbrella.webp','./trips/index.json','./trips/seoul-2027.json','./trips/hk-2027.json','./manifest.webmanifest','./manifest-hk-2027.webmanifest','./manifest-home.webmanifest','./icon-home-180.png','./icon-home-192.png','./icon-home-512.png','./icon-home-maskable-512.png','./icon-180.png','./icon-192.png','./icon-512.png','./icon-maskable-512.png','./icon-hk-180.png','./icon-hk-192.png','./icon-hk-512.png','./icon-hk-maskable-512.png','./images/hk-2027/hero-ink.jpg','./images/seoul-2027/hero-snow.jpg','./images/seoul-2027/map-hotel.jpg','./images/seoul-2027/map-seoul.jpg','./images/seoul-2027/hotel-1.jpg','./images/seoul-2027/hotel-2.jpg','./images/seoul-2027/hotel-3.jpg','./images/seoul-2027/hotel-4.jpg'];
self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE).then(c=>Promise.all(CORE.map(u=>c.add(new Request(u,{cache:'reload'})).catch(()=>{})))).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>(k.startsWith('trip-')||k.startsWith('seoul27-'))&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',e=>{
  const r=e.request;
  if(r.method!=='GET')return;
  const u=new URL(r.url);
  // 網頁本身：先連網取最新版，沒網路才用快取。每個入口頁（index.html、hk.html）各存各的，
  // 找不到時才退回對應的備用頁，避免打開港珠澳卻跑出首爾
  if(r.mode==='navigate'){
    const fb=()=>caches.match(r,{ignoreSearch:true}).then(x=>x||caches.match(u.pathname.endsWith('hk.html')?'./hk.html':u.pathname.endsWith('tokyo.html')?'./tokyo.html':u.pathname.endsWith('keihan.html')?'./keihan.html':u.pathname.endsWith('home.html')?'./home.html':'./index.html')).then(x=>x||caches.match('./'));
    // 連網 3 秒內沒回應（訊號很弱）就先用快取版
    const net=fetch(r).then(res=>{if(res.ok){const cp=res.clone();caches.open(CACHE).then(c=>c.put(r,cp))}return res});
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
