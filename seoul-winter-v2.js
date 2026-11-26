// 【備份】首爾冬日旅行手帳 V2.1 版面（2026/11/26 v198）。V3 起不再預設使用；網址加 ?theme=v2 時由 seoul-winter.js 載入。
// 只搬動／包裝 app.js 已畫好的元素，再加上素材插畫層（前景／中景／背景）；不改任何行程資料、id、事件。
// 樣式：theme-han.css「Seoul Winter」區塊（html.th-han.sw，內頁配色）＋ seoul-v2.css（使用者提供，原樣）＋ seoul-v2-site.css（版面重構，html.th-han.sw.sv2）。
// 恢復舊版：網址加 ?theme=classic（記在這支手機）；?theme=winter 改回。
(function(){
 if(!window.TRIP||!document.getElementById('hero'))return;
 var $=function(s,r){return (r||document).querySelector(s)},$$=function(s,r){return [].slice.call((r||document).querySelectorAll(s))};
 var IMG='images/seoul-2027/decor/';
 var deco=function(f,c,lazy){return '<img class="sw-deco '+(c||'')+'" src="'+IMG+f+'" alt=""'+(lazy?' loading="lazy"':'')+' aria-hidden="true">'};
 var H=TRIP.hero||{},M=TRIP.meta||{},DAYS=TRIP.days||[];
 // 開頭的表情符號（功能鍵、分頁、摺疊標題）：首爾手帳版改用插畫／線條圖示，不顯示表情符號
 var EMO=/^\s*(?:[←-⯿☀-➿️‍]|[\uD83C-\uDBFF][\uDC00-\uDFFF])+\s*/;
 var deEmoji=function(el){var n=el.firstChild;while(n&&n.nodeType===1&&!n.textContent.trim())n=n.nextSibling;if(n&&n.nodeType===3&&EMO.test(n.nodeValue))n.nodeValue=n.nodeValue.replace(EMO,'')};
 document.documentElement.classList.add('sw','sv2');
 document.body.classList.add('seoul-v2');

 // ===== 封面（hero2）：背景＝冬日韓屋全景；前景＝梅枝、飛機、雪花；標題文字取自行程資料 =====
 var hero=$('#hero'),bg=$('.hero-bg',hero);
 hero.classList.add('sw-hero','hero2');
 if(bg){var old=bg.getAttribute('src');bg.onerror=function(){bg.onerror=null;bg.removeAttribute('srcset');bg.src=old};bg.sizes='(min-width:1000px) 1100px, 100vw';bg.srcset=IMG+'hero-winter-m.jpg 1000w, '+IMG+'hero-winter.jpg 1672w';bg.src=IMG+'hero-winter.jpg';bg.alt=H.alt?'首爾封面：雪中的北村韓屋與南山首爾塔':'';bg.setAttribute('fetchpriority','high')}
 var ttl=H.title||M.title||'';
 hero.insertAdjacentHTML('beforeend','<div class="sv3-hfx" aria-hidden="true">'+deco('plum-branch.png','sv3-hplum1')+deco('plum-branch.png','sv3-hplum2')+deco('airplane.png','sv3-hplane')+deco('snowflake.png','sv3-hsnow')+deco('hotteok.png','sv3-hfood1')+deco('coffee.png','sv3-hfood2')+'</div>'
  +'<div class="sv2-title"><h1><span class="sv2-zh">首爾</span><span class="sv2-side"><small lang="ko">서울</small><em lang="en">Seoul</em></span></h1><p>'+ttl+'</p>'+(H.eyebrow?'<b>'+H.eyebrow+'</b>':'')+'</div>');

 // ===== 功能選單（nav2）：疊在封面下緣（保留同一組連結，捲動標示照常運作） =====
 var nav=$('#hd nav'),ICON={};
 if(nav){nav.classList.add('sw-nav','nav2');nav.setAttribute('aria-label','功能選單');
  $$('a',nav).forEach(function(a){var id=(a.getAttribute('href')||'').slice(1);a.dataset.ic=id;a.classList.add('tile');a.innerHTML='<i class="nav-icon" aria-hidden="true"></i><span>'+a.textContent+'</span>'});
  hero.after(nav);
  // 線條圖示（theme-han.css 的遮罩圖）也用在區塊標題
  $$('a',nav).forEach(function(a){var cs=getComputedStyle(a.querySelector('i'));ICON[a.dataset.ic]=cs.webkitMaskImage||cs.maskImage||''});
  var stk=function(){nav.classList.toggle('stuck',nav.getBoundingClientRect().top<=1&&scrollY>40)};addEventListener('scroll',stk,{passive:true});stk();
  new MutationObserver(function(){var a=$('a.on',nav);if(a&&nav.scrollWidth>nav.clientWidth){var l=a.offsetLeft-(nav.clientWidth-a.offsetWidth)/2;nav.scrollTo({left:l,behavior:'smooth'})}}).observe(nav,{subtree:true,attributes:true,attributeFilter:['class']});
  window.dispatchEvent(new Event('resize'))}

 // ===== 倒數卡（count2）：前景福袋（左）＋梅枝（左上）＋雪花 =====
 var cd=$('#cd'),note=$('#cdnote'),go=$('#gotoday'),sub=$('p',hero);
 var card=document.createElement('section');card.className='card sw-cd panel2 count2';
 card.innerHTML=deco('plum-branch.png','sv3-cplum')+deco('bokjumeoni.png','sv3-cbag')+deco('snowflake.png','sv3-csnow')+'<div class="sw-cdin"></div>';
 var inn=$('.sw-cdin',card);
 if(note){inn.append(note)}if(cd){cd.classList.add('numbers');inn.append(cd)}
 inn.insertAdjacentHTML('beforeend','<p class="sw-wish"><span lang="ko">새해 복 많이 받으세요!</span><small>新年快樂</small></p>');
 if(go){deEmoji(go);inn.append(go)}
 // 旅遊日期（info2）：景福宮雪景插畫壓在右下（去背版，不是整張白底圖）
 var info=document.createElement('section');info.className='card sw-info panel2 info2';
 var CDL=(H.cd||{}).label||'';
 info.innerHTML=deco('palace-cut.png','sv3-ipal')+deco('snowflake.png','sv3-isnow')
  +'<div class="sw-irow"><i class="sw-ical" aria-hidden="true"></i><div><small>旅遊日期</small><b>'+((H.sub||[])[0]||'')+'</b>'+((H.sub||[])[1]?'<span>'+H.sub[1]+'</span>':'')+'</div></div>'
  +(CDL?'<div class="sw-irow sv2-irow2"><img class="sv2-iplane" src="'+IMG+'airplane.png" alt="" aria-hidden="true"><div><small>出發</small><b>'+CDL+'</b></div></div>':'');
 if(sub)sub.remove();
 var top=document.createElement('div');top.className='sw-top';
 var p1=document.createElement('div');p1.className='pair';p1.append(card,info);top.append(p1);
 nav?nav.after(top):hero.after(top);
 // 天氣卡（整列，右側冬日旅行插畫）；換算／字體／更新維持右側懸浮鈕（使用者指定）
 var wx=$('#wx');if(wx){wx.classList.add('panel2','sv2-wx');wx.insertAdjacentHTML('afterbegin',deco('winter-travel-cut.png','sv3-wxi',true));top.append(wx)}

 // ===== 區塊標題：線條圖示＋文字放進水彩筆刷（brush2），右側素材貼紙 =====
 var DECO={flight:'airplane.png',hotel:'',plan:'',phr:'hanok-window.png',food:'hotteok.png',price:'coffee.png',tips:'mittens.png',todo:'plum-branch.png',apps:'snowflake.png'};
 var BR={flight:'blue',hotel:'green',plan:'rose',phr:'violet',food:'gold',price:'blue',tips:'green',todo:'rose',apps:'violet'};
 $$('main>section[id]>h2').forEach(function(h){
  h.innerHTML=h.innerHTML.replace(EMO,'');
  var id=h.parentNode.id,ic=ICON[id];
  h.innerHTML='<span class="brush2 sv2-'+(BR[id]||'rose')+'">'+(ic&&ic!=='none'?'<i class="sv3-hic" style="-webkit-mask-image:'+ic.replace(/"/g,"'")+';mask-image:'+ic.replace(/"/g,"'")+'" aria-hidden="true"></i>':'')+h.innerHTML+'</span>';
  var f=DECO[id];h.classList.add('sw-h');if(f)h.insertAdjacentHTML('beforeend',deco(f,'sw-hd',true))});
 // 功能鍵、分頁、摺疊標題去掉開頭表情符號（app.js 重畫分頁時再處理一次）
 var clean=function(){$$('main .btns>.b, main .tabs>button, main .seg>button, main details.fold>summary, main details.td>summary, main p.rate').forEach(deEmoji)};
 clean();var mo=new MutationObserver(function(){mo.disconnect();clean();watch()}),watch=function(){$$('main .tabs, main .seg, #pf, #ps').forEach(function(t){mo.observe(t,{childList:true,subtree:true})})};watch();

 // ===== 航班＋住宿並排（pair）：登機證 flight2、飯店卡 hotel2（照片沿用正式網站，南山塔拍立得） =====
 var fl=$('#flight'),ho=$('#hotel');
 if(fl&&ho){var p3=document.createElement('div');p3.className='pair sv2-fh';fl.before(p3);p3.append(fl,ho)}
 $$('#flight .bp').forEach(function(b){b.classList.add('flight2');var h=$('.bph',b);if(!h)return;
  // 日期文字搬到登機證本體（示意圖：深藍票頭＝航空公司＋去／回程，本體第一行＝日期）
  [].slice.call(h.childNodes).forEach(function(n){if(n.nodeType===3&&n.nodeValue.trim()){var d=document.createElement('div');d.className='sv3-fdate';d.textContent=n.nodeValue.trim();h.after(d);n.remove()}})});
 $$('#hotel details.hotel').forEach(function(d,i){var s=$('summary',d),o=(TRIP.hotels||[])[i]||{};if(!s)return;
  d.classList.add('sw-hotel','panel2','hotel2');
  var src=o.pic==='hpic'?'images/seoul-2027/hotel-2.jpg':'';
  if(src)s.insertAdjacentHTML('afterbegin','<button class="sw-hpic" data-sh="'+o.pic+'" onclick="event.preventDefault()" aria-label="飯店相片"><img src="'+src+'" alt="飯店外觀" loading="lazy"></button>')});
 if(ho)ho.insertAdjacentHTML('afterbegin','<div class="sv3-polar" aria-hidden="true">'+deco('namsan-tower.png','',true)+'</div>');

 // ===== 每日行程卡（days2／day2）：Day 筆刷標籤＋插畫（裝飾，依真實行程內容配圖，不代表新增景點）＋當日標題＋前三個行程點 =====
 // 圖：2/3 出發飛機、2/4 明洞、2/5 玩雪、2/6 景福宮、2/7 南山、2/8 機場返程
 var DIMG=['day-1','day-2','day-5','day-3','day-4','day-6'],ACC=['#a84d59','#497da6','#537c63','#a96730','#78618f','#537c63'],BRS=['rose','blue','green','gold','violet','green'];
 var plan=$('#plan');if(plan)plan.insertAdjacentHTML('afterbegin','<div class="sv3-pfx" aria-hidden="true">'+deco('hanok-street-cut.png','sv3-pst',true)+deco('plum-branch.png','sv3-pplum',true)+'</div>');
 var dbox=$('#days');
 if(dbox){dbox.classList.add('days2');
  $$('.dy',dbox).forEach(function(el,k){var r=$('.dr',el);if(!r)return;
   el.classList.add('day2','sv3-b-'+BRS[k%BRS.length]);el.style.setProperty('--accent',ACC[k%ACC.length]);
   var h=((DAYS[k]||{}).h||'').replace(/^Day\s*\d+\s*/i,'');
   r.insertAdjacentHTML('afterbegin','<strong class="sv2-dn">Day '+(k+1)+'</strong>');
   var D=DAYS[k]||{},its=(D.ab?D.A:D.i)||[],tx=function(s){var e=document.createElement('div');e.innerHTML=s||'';return (e.textContent||'').trim()};
   var li=its.map(function(x){return tx(x[1])}).filter(function(s){return s&&!/^(早餐|午餐|晚餐)$/.test(s)}).slice(0,3);
   var b=$('b',r);if(b)b.insertAdjacentHTML('afterend','<img class="sv2-dimg" src="'+IMG+(DIMG[k]||'day-1')+'.jpg" alt="" loading="lazy">'+(h?'<span class="sv2-dt">'+h+'</span>':'')+(li.length?'<span class="sv2-dl">'+li.map(function(s){return '<i>'+s.replace(/[<>&]/g,'')+'</i>'}).join('')+'</span>':''))})}

 // ===== 底部日期列（dock2）：加「總覽」回到每日行程；日期鍵加 D1～D6 =====
 var dk=$('#daybar');
 if(dk){dk.classList.add('dock2');var row=dk.firstElementChild;
  if(row)row.insertAdjacentHTML('afterbegin','<a class="tile sv2-all" href="#plan"><i aria-hidden="true"></i>總覽</a>');
  $$('#dbtn>button').forEach(function(b){b.classList.add('tile')});
  window.dispatchEvent(new Event('resize'))}

 // ===== 下半部：每區一張不同色調的韓紙紙卡＋紙膠帶（筆刷素材）＋角落貼紙＋底部插畫 =====
 var SHEET={phr:['violet',''],food:['gold','eomuk.png'],price:['blue','suitcase.png'],tips:['green',''],todo:['rose',''],apps:['violet','']};
 Object.keys(SHEET).forEach(function(id){var s=document.getElementById(id);if(!s||s.parentNode.tagName!=='MAIN')return;
  s.classList.add('sv2-sheet','sv3-t-'+SHEET[id][0]);
  if(SHEET[id][1])s.insertAdjacentHTML('beforeend',deco(SHEET[id][1],'sv3-sfoot',true))});
 var td=$('#todo');if(td&&td.classList.contains('sv2-sheet'))td.insertAdjacentHTML('beforeend','<div class="sv3-tdfx" aria-hidden="true">'+deco('new-year-cut.png','',true)+deco('winter-travel-cut.png','',true)+'</div>');

 // 價格／App 橫滑卡：容器高度跟著目前那一張（不被最高的一張撐出大片空白）
 $$('main .swipe').forEach(function(sw){var t,fit=function(){var c=[].slice.call(sw.children).filter(function(e){return e.offsetWidth}),x=sw.scrollLeft+sw.clientWidth*0.3,cur=c[0];c.forEach(function(e){if(e.offsetLeft-sw.offsetLeft<=x+1)cur=e});if(!cur)return;var cs=getComputedStyle(sw);sw.style.height=(cur.offsetHeight+parseFloat(cs.paddingTop)+parseFloat(cs.paddingBottom))+'px'};
  sw.classList.add('sv3-fit');sw.addEventListener('scroll',function(){clearTimeout(t);t=setTimeout(fit,90)},{passive:true});addEventListener('resize',fit);setTimeout(fit,50);fit()});

 // ===== 頁尾（footer2）：背景天際線、前景韓式小吃，中間手寫標語（文字取自行程資料） =====
 var ft=$('footer');
 if(ft)ft.insertAdjacentHTML('beforebegin','<div class="footer2"><div class="sv3-ffx" aria-hidden="true">'+deco('seoul-skyline-cut.png','sv3-fsky',true)+deco('street-food-cut.png','sv3-ffood',true)+deco('plum-branch.png','sv3-fplum',true)+deco('snowflake.png','sv3-fsnow',true)+'</div><div class="sv3-ftx"><b>首爾冬日・新春旅行</b>'+((H.sub||[]).length?'<small>'+H.sub.join('・')+'</small>':'')+'<span lang="ko">즐거운 여행 되세요</span></div></div>');
})();
