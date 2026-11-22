/* ===== 偏航 DETOUR：品牌區塊、版本號、關於頁（只加畫面文字，不碰資料） ===== */
const DTR_V=/*VERSIONS*/null;
const DTR_ST='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5l2.2 6.3 6.3 2.2-6.3 2.2L12 19.5l-2.2-6.3-6.3-2.2 6.3-2.2z" fill="#E0C496"/></svg>';
function dtrGreet(){const h=new Date().getHours();return h<5?'夜深了，適合夢見下一站。':h<11?'早安，晨光正好，遠方在等你。':h<17?'午後的光很柔，適合想想遠方。':h<20?'晚霞正好，今天想去哪裡？':'夜色溫柔，把想去的地方收進口袋。'}
function dtrCd(){try{const L=(db.trips||[]).map(t=>({t,a:dayD(t.start)})).filter(x=>x.a>0).sort((x,y)=>x.a-y.a);if(!L.length)return '';const x=L[0];return `<div class="dtr-cd">離「${esc(tShort(x.t.id))}」出發還有 <b>${x.a}</b> 天</div>`}catch(e){return ''}}
function dtrHero(){return `<section class="dtr-hero"><div class="dtr-stars" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div><svg class="dtr-rt" viewBox="0 0 48 48" aria-hidden="true"><path d="M6 40 L38 12" fill="none" stroke="#C99AA8" stroke-width="1.5" stroke-linecap="round" stroke-dasharray="2 3.6" opacity=".8"/><path d="M6 40C10 26 22 44 30 31S38 22 39 15" fill="none" stroke="#C9A25F" stroke-width="2.4" stroke-linecap="round"/><path d="M39.5 5l1.4 4 4 1.4-4 1.4-1.4 4-1.4-4-4-1.4 4-1.4z" fill="#C9A25F"/></svg><div class="dtr-g">${dtrGreet()}</div><div class="dtr-t">我們計畫了遠方，卻愛上了沿途。</div><div class="dtr-en">All planned. Free to wander.</div>${dtrCd()}</section>`}
function dtrFoot(){return `<div class="dtr-foot">${DTR_ST}<p>一切都安排好了，現在可以亂來了。</p><button type="button" class="dtr-ver" onclick="ADS.tab='ab';go('add')">DETOUR・v${DTR_V.current}</button></div>`}
function dtrAbout(){return `<div class="${CC} dtr-ab"><h3>偏航 DETOUR</h3><div class="en">版本 v${DTR_V.current}・${DTR_V.date}</div><p class="text-sm text-stone-500 mt-2">前身是 STOB 旅遊訂單。把訂單收好，把心留給沿途。完整使用說明與版本歷程也在說明頁。</p>
 <ul class="dtr-vr">${DTR_V.history.map((h,i)=>`<li${i?'':' class="cur"'}><b>v${h.v}</b>${esc(h.t)}<small>${esc(h.d)}</small><ul>${h.n.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></li>`).join('')}</ul></div>`}
/*PART2*/
adTabs.push(['ab','關於']);
{const _va=VIEWS.add;VIEWS.add=()=>{if(ADS.tab!='ab')return _va();const tabs=`<div class="xchips adtabs">${adTabs.map(([k,l])=>`<button type="button" class="xchip${ADS.tab==k?' on':''}" onclick="adGo('${k}')">${l}</button>`).join('')}</div>`;return `<h2 class="sr">⚙️ 管理</h2>${tabs}${dtrAbout()}`}}
