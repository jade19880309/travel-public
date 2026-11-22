/* ===== 偏航 DETOUR：品牌區塊、版本號、關於頁（只加畫面文字，不碰資料） ===== */
const DTR_V=/*VERSIONS*/null;
const DTR_ST='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5l2.2 6.3 6.3 2.2-6.3 2.2L12 19.5l-2.2-6.3-6.3-2.2 6.3-2.2z" fill="#E0C496"/></svg>';
const DTR_TH={romantic:{n:'浪漫',d:'奶油白・酒紅・玫瑰粉・香檳金',m:['#FFF9F6','#1C1216']},navy:{n:'深藍',d:'象牙白・海軍藍・暖金',m:['#F7F4E9','#0A1526']}};
function dtrTheme(){const t=document.documentElement.getAttribute('data-theme');return DTR_TH[t]?t:'romantic'}
function dtrMeta(){const t=DTR_TH[dtrTheme()],a=document.getElementById('dtr-ati');if(a)a.setAttribute('href',dtrTheme()=='navy'?'@@ICON_N@@':'@@ICON_R@@');document.querySelectorAll('meta[name=theme-color]').forEach(m=>m.setAttribute('content',/dark/.test(m.getAttribute('media')||'')?t.m[1]:t.m[0]))}
function dtrSetTheme(t){if(!DTR_TH[t])return;document.documentElement.setAttribute('data-theme',t);try{localStorage.setItem('detour-theme',t)}catch(e){}dtrMeta();render()}
function dtrAppear(){const cur=dtrTheme();return `<div class="${CC}"><div class="font-bold mb-1">外觀設定</div><p class="text-sm text-stone-500 mb-3">選擇偏航的風格。只記在這支裝置的瀏覽器，不會同步到帳號。</p><div class="dtr-th" role="radiogroup" aria-label="外觀主題">${Object.keys(DTR_TH).map(k=>`<button type="button" role="radio" aria-checked="${k==cur}" class="dtr-tb dtr-${k}" onclick="dtrSetTheme('${k}')"><span class="dtr-sw"><i></i><i></i><i></i></span><b>${DTR_TH[k].n}${k==cur?'・使用中':''}</b><small>${DTR_TH[k].d}</small></button>`).join('')}</div></div>`}
function dtrHero(){return `<section class="dtr-hero"><div class="dtr-fl" aria-hidden="true"><span class="th-r">@@FLIGHT_ROMANTIC@@</span><span class="th-n">@@FLIGHT_NAVY@@</span></div><div class="dtr-g">夜色溫柔，把想去的地方收進口袋。</div><div class="dtr-t">我們計畫了遠方，<br>卻愛上了<em>沿途</em>。</div><div class="dtr-en">All planned. Free to wander.</div></section>`}
function dtrFoot(){return `<div class="dtr-foot">${DTR_ST}<p>一切都安排好了，現在可以亂來了。</p><button type="button" class="dtr-ver" onclick="ADS.tab='ab';go('add')">DETOUR・v${DTR_V.current}</button></div>`}
function dtrAbout(){return `<div class="${CC} dtr-ab"><h3>偏航 DETOUR</h3><div class="en">版本 v${DTR_V.current}・${DTR_V.date}</div><p class="text-sm text-stone-500 mt-2">前身是 STOB 旅遊訂單。把訂單收好，把心留給沿途。完整使用說明與版本歷程也在說明頁。</p>
 <ul class="dtr-vr">${DTR_V.history.map((h,i)=>`<li${i?'':' class="cur"'}><details${i?'':' open'}><summary><b>v${h.v}</b>${esc(h.t)}<small>${esc(h.d)}</small></summary><ul>${h.n.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></details></li>`).join('')}</ul></div>`}
/*PART2*/
adTabs.push(['ap','外觀設定'],['ab','關於']);
{const _va=VIEWS.add;VIEWS.add=()=>{const P={ap:dtrAppear,ab:dtrAbout}[ADS.tab];if(!P)return _va();const tabs=`<div class="xchips adtabs">${adTabs.map(([k,l])=>`<button type="button" class="xchip${ADS.tab==k?' on':''}" onclick="adGo('${k}')">${l}</button>`).join('')}</div>`;return `<h2 class="sr">⚙️ 管理</h2>${tabs}${P()}`}}
