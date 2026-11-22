/* STOB 行程檢視頁：把網址 # 後面的壓縮內容還原成行程網頁。資料只在這支手機裡解開，不會送到任何伺服器。 */
(function(){
var OKT={HEADER:1,MAIN:1,FOOTER:1,SECTION:1,ARTICLE:1,NAV:1,DIV:1,SPAN:1,H1:1,H2:1,H3:1,P:1,B:1,SMALL:1,EM:1,I:1,A:1,UL:1,OL:1,LI:1,DETAILS:1,SUMMARY:1,BUTTON:1,BR:1};
var OKA={'class':1,id:1,href:1,target:1,rel:1,'aria-label':1,'aria-hidden':1,'data-date':1,'data-act':1,open:1,hidden:1,type:1};
function clean(root){[].slice.call(root.querySelectorAll('*')).forEach(function(n){if(!n.parentNode)return;if(!OKT[n.tagName]){n.parentNode.removeChild(n);return}
 [].slice.call(n.attributes).forEach(function(a){var k=a.name.toLowerCase();if(!OKA[k]){n.removeAttribute(a.name);return}
  if(k=='href'&&!/^(https:\/\/|#)/i.test(a.value))n.removeAttribute('href');if(k=='target'){n.setAttribute('rel','noopener noreferrer')}})});return root}
var COL=/^(hsl\(\d{1,3} \d{1,3}% \d{1,3}%\)|#[0-9a-f]{3,8})$/i,KEYS=['bg','card','ink','mut','line','acc','hd','hdt','hdm','tag','tagt'];
function vars(o){return KEYS.filter(function(k){return o&&COL.test(String(o[k]||''))}).map(function(k){return '--'+k+':'+o[k]}).join(';')}
function fail(msg){document.getElementById('msg').textContent=msg;document.getElementById('msg').hidden=false}
function icon(c,nm){try{var cv=document.createElement('canvas');cv.width=cv.height=180;var x=cv.getContext('2d');x.fillStyle=c.hd;x.fillRect(0,0,180,180);x.fillStyle=c.tag;x.fillRect(0,150,180,30);
 x.fillStyle='#fff';x.textAlign='center';x.textBaseline='middle';x.font='700 64px "PingFang TC","Noto Sans TC",sans-serif';x.fillText(Array.from(nm||'行程').slice(0,2).join(''),90,80);
 x.fillStyle=c.tagt;x.font='700 16px sans-serif';x.fillText('STOB',90,165);return cv.toDataURL('image/png')}catch(e){return ''}}
function meta(n,v){var m=document.querySelector('meta[name="'+n+'"]');if(!m){m=document.createElement('meta');m.name=n;document.head.appendChild(m)}m.content=v}
async function go(){var h=location.hash.slice(1);if(!h){fail('這個連結沒有行程內容。請向分享的人重新要一次連結。');return}
 if(typeof DecompressionStream=='undefined'){fail('這個瀏覽器太舊，無法打開行程連結。請更新系統，或請對方改傳網頁檔。');return}
 try{var b=atob(h.replace(/-/g,'+').replace(/_/g,'/')),u=new Uint8Array(b.length);for(var i=0;i<b.length;i++)u[i]=b.charCodeAt(i);
  var txt=await new Response(new Blob([u]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).text(),o=JSON.parse(txt);
  if(!o||o.v!==1||typeof o.b!='string')throw 0;
  var st=document.createElement('style');st.textContent=':root{'+vars(o.c&&o.c.light)+'}@media (prefers-color-scheme:dark){:root{'+vars(o.c&&o.c.dark)+'}}';document.head.appendChild(st);
  var t=String(o.t||'行程').slice(0,80);document.title=t+'｜行程';meta('apple-mobile-web-app-title',String(o.s||t).slice(0,12));if(o.c&&o.c.light&&COL.test(o.c.light.hd||''))meta('theme-color',o.c.light.hd);
  var ic=o.c&&o.c.light?icon(o.c.light,String(o.n||t)):'';if(ic){['apple-touch-icon','icon'].forEach(function(r){var l=document.createElement('link');l.rel=r;l.href=ic;document.head.appendChild(l)})}
  var d=new DOMParser().parseFromString('<body>'+o.b+'</body>','text/html');clean(d.body);
  var app=document.getElementById('app');app.textContent='';while(d.body.firstChild)app.appendChild(document.adoptNode(d.body.firstChild));
 }catch(e){fail('行程連結不完整或已損壞。請確認整段連結都有複製到，或請對方重新分享。')}}
document.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('[data-act]');if(!b)return;document.querySelectorAll('details.day').forEach(function(x){x.open=true});if(b.getAttribute('data-act')=='print')print()});
addEventListener('hashchange',function(){location.reload()});go();
})();
