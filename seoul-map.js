// 首爾互動水彩地圖（2026/11/27）：只在首爾頁由 seoul-winter.js 載入。
// 底圖＝images/seoul-2027/map-city.jpg（使用者提供，1339×1174，不重繪、不旋轉、不拉伸）。
// 定位座標是依水彩地圖實際圖面逐一量的像素（地圖上各景點圖釘的釘頭），換成百分比使用；不是經緯度換算。
// 每日詳細行程：有對應景點的列加上建築貼紙（images/seoul-2027/v3/stickers/*-building.png），點貼紙開地圖並聚焦。
// 沒有獨立貼紙的地點（仁寺洞、首爾車站、飯店）只放「地圖位置」小按鈕，不拿別的建築代替。
// 不使用任何外部地圖服務；行程資料 trips/seoul-2027.json 不改。
(function(){
 if(!window.TRIP||!document.getElementById('days'))return;
 var MAP='images/seoul-2027/map-city.jpg',MW=1339,MH=1174,STK='images/seoul-2027/v3/stickers/';
 // id: [x 像素, y 像素, 中文名, 韓文名, 貼紙檔（無則空）]
 var PT={
  bukchon:[703,112,'北村韓屋村','북촌한옥마을','bukchon'],
  gyeongbokgung:[652,157,'景福宮','경복궁','gyeongbokgung'],
  unhyeongung:[760,228,'雲峴宮','운현궁','unhyeongung'],
  insadong:[718,267,'仁寺洞・Ssamziegil','쌈지길',''],
  history:[527,305,'首爾歷史博物館','서울역사박물관','history-museum'],
  cheonggyecheon:[634,343,'清溪廣場／清溪川','청계천','cheonggyecheon'],
  gwangjang:[912,318,'廣藏市場','광장시장','gwangjang'],
  ddp:[1045,388,'東大門 DDP','동대문디자인플라자','ddp'],
  myeongdong:[725,447,'明洞購物街','명동쇼핑거리','myeongdong'],
  hotel:[810,447,'明洞南山彩鴻酒店','트래블로지 명동 남산',''],
  station:[543,560,'首爾車站','서울역',''],
  namsangol:[755,608,'南山谷韓屋村','남산골한옥마을','namsangol'],
  tower:[768,668,'南山首爾塔','N서울타워','n-seoul-tower'],
  ipark:[510,945,'龍山 I’Park Mall','아이파크몰 용산점','ipark'],
  natmus:[606,1045,'國立中央博物館','국립중앙박물관','national-museum']
 };
 // 行程裡的地點代號（每列第 4 欄）→ 地圖點
 var BY={'Myeongdong Shopping Street':'myeongdong','Gwangjang Market':'gwangjang','N Seoul Tower':'tower','National Museum of Korea':'natmus',"I'Park Mall Yongsan":'ipark','Dongdaemun Design Plaza':'ddp','Gyeongbokgung Palace':'gyeongbokgung','Bukchon Hanok Village':'bukchon','Ssamziegil':'insadong','Unhyeongung':'unhyeongung','Namsangol Hanok Village':'namsangol','Seoul Museum of History':'history','Cheonggyecheon':'cheonggyecheon','Travelodge Myeongdong Namsan':'hotel','Lotte Rent-a-Car Seoul Station':'station'};
 window.SEOUL_MAP_POINTS=PT;
 var $=function(s,r){return (r||document).querySelector(s)},$$=function(s,r){return [].slice.call((r||document).querySelectorAll(s))};
 var esc=function(t){return String(t==null?'':t).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})};
 var PIN='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5a6.5 6.5 0 0 0-6.5 6.5c0 4.6 6.5 12.5 6.5 12.5S18.5 13.6 18.5 9A6.5 6.5 0 0 0 12 2.5z" fill="currentColor"/><circle cx="12" cy="9" r="2.4" fill="#fffdf8"/></svg>';

 // ===== 每日詳細行程：貼紙 =====
 function deco(){
  $$('#days .dy.on .dp .tl li').forEach(function(li){
   if(li.querySelector('.smk'))return;
   var dy=li.closest('.dy'),k=+dy.id.slice(2),d=TRIP.days[k];if(!d)return;
   var ab=d.ab?((dy.querySelector('.ab button.on')||{}).dataset||{}).v||'A':null;
   var items=d.ab?d[ab]:d.i,x=items&&items[+li.dataset.i];if(!x||!x[3])return;
   var id=BY[x[3]];if(!id||!PT[id])return;var p=PT[id],tc=li.querySelector('.tc');if(!tc)return;
   tc.insertAdjacentHTML('beforeend',p[4]
    ?'<button type="button" class="smk stk" data-mp="'+id+'" aria-label="在水彩地圖上看 '+esc(p[2])+' 的位置"><img src="'+STK+p[4]+'-building.png" alt="" loading="lazy"><span class="smk-t">'+PIN+'地圖位置</span></button>'
    :'<button type="button" class="smk smk-only" data-mp="'+id+'" aria-label="在水彩地圖上看 '+esc(p[2])+' 的位置"><span class="smk-t">'+PIN+'地圖位置</span></button>');
  });
 }
 var dbox=$('#days');
 new MutationObserver(deco).observe(dbox,{childList:true,subtree:true});deco();
 // 點貼紙：在 #days 的點擊處理之前攔下（不觸發展開／收合或美食跳轉）
 document.addEventListener('click',function(e){
  var b=e.target.closest('[data-mp]');if(b){e.preventDefault();e.stopPropagation();open(b.dataset.mp);return}
  var s=e.target.closest('[data-sh="seoul"]');if(s&&!e.target.closest('#smap')){e.preventDefault();e.stopPropagation();open(null)}
 },true);

 // ===== 地圖視窗 =====
 var V=null,st=null,img,layer,stage,lbl,ring,sc=1,fit=1,tx=0,ty=0,P=new Map(),pd=0,pm=null,moved=0,lt=0,cur=null,scrollY0=0,anim=0;
 function build(){
  document.body.insertAdjacentHTML('beforeend','<div id="smap" role="dialog" aria-modal="true" aria-label="首爾市區景點水彩地圖" hidden><div class="smv"><div class="sms"><img class="smi" src="'+MAP+'" alt="首爾市區景點水彩地圖" draggable="false"><div class="sml"></div></div></div>'
   +'<div class="smbar"><button type="button" class="smb sm-all" aria-label="回到全圖">'+'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg><span>全圖</span></button>'
   +'<button type="button" class="smb sm-reg" aria-label="首都圈區域地圖"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6.5 9 4l6 2.5L21 4v13.5L15 20l-6-2.5L3 20z M9 4v13.5 M15 6.5V20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg><span>區域圖</span></button>'
   +'<button type="button" class="smb sm-x" aria-label="關閉地圖"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg></button></div>'
   +'<div class="smlbl" aria-live="polite" hidden></div><p class="smh">雙指縮放・拖曳移動・點圖上景點看名稱</p></div>');
  V=$('#smap');stage=$('.sms',V);img=$('.smi',V);layer=$('.sml',V);lbl=$('.smlbl',V);
  // 透明定位圖層：每個點一個可點的熱區（看不見，不遮建築插畫），飯店加淡金色小圈當參考
  layer.innerHTML=Object.keys(PT).map(function(id){var p=PT[id];return '<button type="button" class="smhit'+(id==='hotel'?' smhotel':'')+'" data-pt="'+id+'" style="left:'+(p[0]/MW*100).toFixed(3)+'%;top:'+(p[1]/MH*100).toFixed(3)+'%" aria-label="'+esc(p[2])+'"></button>'}).join('')+'<div class="smring" hidden><i></i><i></i><b></b></div>';
  ring=$('.smring',layer);
  $('.sm-x',V).onclick=close;
  $('.sm-all',V).onclick=function(){reset(true)};
  // 「區域圖」：關掉互動地圖，開原本的地圖抽屜（首都圈區域圖＋市區圖、Google／Naver 連結）
  $('.sm-reg',V).onclick=function(){close();if(TRIP.sheets&&TRIP.sheets.seoul){$('#sbody').innerHTML=TRIP.sheets.seoul;$('#sheet').classList.add('on');$('#sheet .sp').scrollTop=0}};
  layer.addEventListener('click',function(e){var h=e.target.closest('[data-pt]');if(h&&moved<10)mark(h.dataset.pt,false)});
  var vp=$('.smv',V);
  vp.addEventListener('pointerdown',function(e){if(e.target.closest('.smhit'))return;try{vp.setPointerCapture(e.pointerId)}catch(_){}P.set(e.pointerId,[e.clientX,e.clientY]);stage.classList.remove('ease');
   if(P.size===1)moved=0;if(P.size===2){var a=[].slice.call(P.values());pd=Math.hypot(a[0][0]-a[1][0],a[0][1]-a[1][1])||1;pm=[(a[0][0]+a[1][0])/2,(a[0][1]+a[1][1])/2];moved=99}});
  vp.addEventListener('pointermove',function(e){var o=P.get(e.pointerId);if(!o)return;P.set(e.pointerId,[e.clientX,e.clientY]);
   if(P.size===1){tx+=e.clientX-o[0];ty+=e.clientY-o[1];moved+=Math.abs(e.clientX-o[0])+Math.abs(e.clientY-o[1]);apply()}
   else if(P.size===2){var a=[].slice.call(P.values()),d=Math.hypot(a[0][0]-a[1][0],a[0][1]-a[1][1])||1,m=[(a[0][0]+a[1][0])/2,(a[0][1]+a[1][1])/2];tx+=m[0]-pm[0];ty+=m[1]-pm[1];zoomAt(m[0],m[1],sc*d/pd);pd=d;pm=m}});
  var up=function(e){if(!P.has(e.pointerId))return;P.delete(e.pointerId);
   if(e.type==='pointerup'&&P.size===0&&moved<10){var t=Date.now();if(t-lt<320){lt=0;var r=vp.getBoundingClientRect();stage.classList.add('ease');zoomAt(e.clientX-r.left,e.clientY-r.top,sc>fit*1.6?fit:fit*2.6)}else lt=t}};
  vp.addEventListener('pointerup',up);vp.addEventListener('pointercancel',up);
  vp.addEventListener('wheel',function(e){e.preventDefault();var r=vp.getBoundingClientRect();stage.classList.remove('ease');zoomAt(e.clientX-r.left,e.clientY-r.top,sc*Math.exp(-e.deltaY*.0015))},{passive:false});
  ['gesturestart','gesturechange'].forEach(function(n){V.addEventListener(n,function(e){e.preventDefault()})});
  addEventListener('resize',function(){if(V&&!V.hidden){var c=cur;reset(false);if(c)focus(c,false)}});
  addEventListener('keydown',function(e){if(e.key==='Escape'&&V&&!V.hidden)close()});
 }
 function vw(){var v=$('.smv',V);return [v.clientWidth,v.clientHeight]}
 function apply(){var w=vw(),iw=MW*sc,ih=MH*sc,pad=40;
  tx=iw<=w[0]?(w[0]-iw)/2:Math.min(pad,Math.max(w[0]-iw-pad,tx));ty=ih<=w[1]?(w[1]-ih)/2:Math.min(pad,Math.max(w[1]-ih-pad,ty));
  stage.style.transform='translate('+tx+'px,'+ty+'px) scale('+sc+')';V.style.setProperty('--inv',(1/sc).toFixed(4))}
 function zoomAt(cx,cy,ns){ns=Math.min(fit*6,Math.max(fit,ns));var k=ns/sc;tx=cx-(cx-tx)*k;ty=cy-(cy-ty)*k;sc=ns;apply()}
 function reset(ease){var w=vw();fit=Math.min(w[0]/MW,w[1]/MH);sc=fit;tx=(w[0]-MW*sc)/2;ty=(w[1]-MH*sc)/2;stage.classList.toggle('ease',!!ease);apply()}
 function focus(id,ease){var p=PT[id],w=vw();if(!p)return;
  // 放大到看得清楚附近街區（手機約 2.4 倍全圖），把景點放在畫面中間偏上，下方留給名稱牌
  var z=Math.min(fit*6,Math.max(fit*2.4,Math.min(w[0],w[1])/520));sc=z;tx=w[0]/2-p[0]*sc;ty=w[1]*0.44-p[1]*sc;stage.classList.toggle('ease',!!ease);apply()}
 // 總覽：手機直式時全圖太小，先放大到填滿螢幕高度、以市中心景點群為中心；「全圖」鈕才縮到整張
 function overview(){var w=vw(),z=Math.max(fit,Math.min(w[1]/MH,fit*3));if(z<=fit*1.05)return;sc=z;tx=w[0]/2-740*sc;ty=w[1]/2-560*sc;stage.classList.remove('ease');apply()}
 function mark(id,move){var p=PT[id];if(!p)return;cur=id;
  ring.hidden=false;ring.style.left=(p[0]/MW*100).toFixed(3)+'%';ring.style.top=(p[1]/MH*100).toFixed(3)+'%';
  ring.classList.remove('go');void ring.offsetWidth;ring.classList.add('go');
  lbl.innerHTML='<b>'+esc(p[2])+'</b><span lang="ko">'+esc(p[3])+'</span>';lbl.hidden=false;
  $$('.smhit',layer).forEach(function(h){h.classList.toggle('on',h.dataset.pt===id)});
  if(move)focus(id,true)}
 function open(id){if(!V)build();scrollY0=window.scrollY;
  V.hidden=false;document.documentElement.classList.add('smap-open');
  var go=function(){reset(false);if(id&&PT[id]){mark(id,false);requestAnimationFrame(function(){focus(id,true)})}else{cur=null;ring.hidden=true;lbl.hidden=true;$$('.smhit',layer).forEach(function(h){h.classList.remove('on')});overview()}};
  if(img.complete&&img.naturalWidth)go();else img.onload=go;
  try{history.pushState({smap:1},'')}catch(_){}
 }
 function close(fromPop){if(!V||V.hidden)return;V.hidden=true;document.documentElement.classList.remove('smap-open');P.clear();window.scrollTo(0,scrollY0);
  if(fromPop!==true){try{if(history.state&&history.state.smap){rest=1;history.back()}}catch(_){}}}
 // 手機「返回」鍵／手勢：關掉地圖、回到原本位置
 var rest=0;addEventListener('popstate',function(){if(V&&!V.hidden)close(true);else if(rest){rest=0;window.scrollTo(0,scrollY0)}});
 window.openSeoulMap=open;
})();
