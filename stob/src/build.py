import re, sys, pathlib, os
HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parent.parent  # travel-public 根目錄
# STOB 以私人 repo travel-private 裡 TOB 的某一版為基礎：設定 TOB_REPO 指到 travel-private（預設與 travel-public 並排）
TOB = pathlib.Path(os.environ.get('TOB_REPO', str(ROOT.parent / 'travel-private')))
import subprocess
src = subprocess.run(['git','-C',str(TOB),'show','21ce4f8:index.html'],capture_output=True,check=True).stdout.decode('utf-8')
L = src.split('\n')

def find(prefix, start=0):
    for i in range(start, len(L)):
        if L[i].startswith(prefix):
            return i
    raise SystemExit('not found: ' + prefix)

# 1) drop embedded order screenshots
a = find('<script id="ordimg">'); b = find('</script>', a)
L[a:b+1] = ['<script>let ORDIMG={};</script>']

# 2) replace hardcoded data block (seed ... ORI forEach) with empty store
a = find('const seed=()=>'); b = find("db.ht.forEach(h=>{const o=ORI[h.en]", a)
L[a:b+1] = [(HERE / 'data_block.js').read_text(encoding='utf-8').rstrip('\n')]

s = '\n'.join(L)

def rep(old, new, count=1):
    global s
    n = s.count(old)
    if n < 1:
        raise SystemExit('missing: ' + old[:80])
    s = s.replace(old, new) if count == 0 else s.replace(old, new, count)

# head: no manifest/icons (not hosted here)
s = re.sub(r'<link rel="manifest"[^\n]*?<link rel="icon"[^>]*>', '', s, count=1)
rep('<title>TOB｜旅遊訂單查詢</title>', '<title>STOB 旅遊訂單</title>')
rep('content="TOB 旅遊訂單"', 'content="STOB 旅遊訂單"')
s = s.replace("localStorage.getItem('fth", "localStorage.getItem('stob").replace("localStorage.setItem('fth", "localStorage.setItem('stob").replace("localStorage.removeItem('fth", "localStorage.removeItem('stob").replace("sessionStorage.getItem('fth", "sessionStorage.getItem('stob").replace("sessionStorage.setItem('fth", "sessionStorage.setItem('stob").replace("sessionStorage.removeItem('fth", "sessionStorage.removeItem('stob")

# family groups / camper / areas / trip icons become data-driven
s = re.sub(r"const FAM=\[\['第1組[^\n]*?\]\];", "let FAM=[];", s, count=1)
s, k = re.subn(r"const CAMP=\[\{id:'camp-jp-c1'[^\n]*", "let CAMP=[];", s, count=1); assert k==1
s = re.sub(r"const AREA=\{[^\n]*?\};", "const AREA={};", s, count=1)
s = re.sub(r"const TIB='https://jade19880309[^\n]*?\};", "const TIB='',TIC={};", s, count=1)
rep("sub:'まちのキャンピングカー屋さん・'+l+'・¥22,858'", "sub:l")

# no forced "all flights paid"
rep('db.fl.forEach(f=>{f.paid=true});', '')
rep("const CUR=['TWD','JPY','KRW','HKD','CNY','USD'];", "const CUR=['TWD','JPY','KRW','HKD','CNY','MOP','USD','EUR','THB','SGD','MYR','VND','GBP','AUD'];")

# no service worker / update button inside Claude
s = re.sub(r"const httpOK=\(\)=>[^\n]*", "const httpOK=()=>false;", s, count=1)
s = re.sub(r"const pfab=\(\)=>\{", "const pfab=()=>'';const pfab0=()=>{", s, count=1)

# nav: 5th tab 新增
rep("['mail','mail','確認信']].map(", "['mail','mail','確認信'],['add','add','管理']].map(")
rep("const NAVK=()=>S.v=='cip'?'cip':", "const NAVK=()=>S.v=='add'||S.v=='up'?'add':S.v=='cip'?'cip':")
rep("const NAVS=['home','cip','cis','mail']", "const NAVS=['home','cip','cis','mail','add']")
s = s.replace('grid-template-columns:repeat(4,minmax(0,1fr))!important', 'grid-template-columns:repeat(5,minmax(0,1fr))!important')
rep("const NAVI={", "const NAVI={'add':'<path d=\"M4 7h10M18 7h2M4 17h4M12 17h8\"/><circle cx=\"16\" cy=\"7\" r=\"2\"/><circle cx=\"10\" cy=\"17\" r=\"2\"/>',")

# header label
rep("'旅遊訂單<span class=\"tobt\" title=\"Travel Order Book\">TOB</span>'", "'<span class=\"sth\"><span class=\"stm\" role=\"button\" tabindex=\"0\" aria-label=\"回到頁首\" onclick=\"toTop()\" onkeydown=\"if(event.keyCode==13||event.keyCode==32){event.preventDefault();toTop()}\"><i></i>STOB</span><span class=\"stw\"><b>旅遊訂單</b><small>Share Travel Order Book</small></span></span>'+(typeof cloudBadge=='function'?cloudBadge():'')")

# append cloud + upload script
cloud = (HERE / 'cloud.js').read_text(encoding='utf-8')
import json as _json
PUBCSS = (HERE / 'pub.css').read_text(encoding='utf-8')
cloud += '\nconst PUB_CSS=' + _json.dumps(PUBCSS, ensure_ascii=False).replace('</','<\\/') + ';\n' + (HERE / 'plan.js').read_text(encoding='utf-8')
css = (HERE / 'cloud.css').read_text(encoding='utf-8')
css += '\n' + (HERE / 'theme.css').read_text(encoding='utf-8')
idx = s.rfind('</script></body></html>')
s = s[:idx] + '</script>\n<style>' + css + '</style>\n<script>\n' + cloud + '\n</script></body></html>' + s[idx+len('</script></body></html>'):]

rep("[['fl','機票'],['ht','飯店'],['tr','交通'],['ot','其他']].map(([k,l])=>`<button type=\"button\" class=\"hcb\"", "[['fl','機票'],['ht','飯店'],['tr','交通'],['ot','其他'],['plan','行程']].map(([k,l])=>`<button type=\"button\" class=\"hcb\"")
rep('family=Noto+Sans+TC:wght@400;500;700&family=Noto+Serif+TC:wght@600;700', 'family=Huninn&family=Noto+Sans+TC:wght@400;500;700')
rep('<meta name="theme-color" content="#faf5ec" media="(prefers-color-scheme: light)"><meta name="theme-color" content="#1c1815" media="(prefers-color-scheme: dark)">', '<meta name="theme-color" content="#f3f6f5" media="(prefers-color-scheme: light)"><meta name="theme-color" content="#101719" media="(prefers-color-scheme: dark)">')
s = s.replace('"Noto Serif TC"','"Huninn","Noto Sans TC"').replace('"Songti TC",','').replace('"PMingLiU",','')
rep('content="width=device-width, initial-scale=1, viewport-fit=cover"', 'content="width=device-width, initial-scale=1"')
rep("tIc=n=>/韓國|首爾/.test(n)?", "tIc=n=>/台灣|臺灣|台北|臺北|新北|基隆|桃園|新竹|苗栗|台中|臺中|彰化|南投|雲林|嘉義|台南|臺南|高雄|屏東|墾丁|宜蘭|花蓮|台東|臺東|澎湖|金門|馬祖|綠島|蘭嶼|日月潭|阿里山|小琉球/.test(n)?'🇹🇼 ':/韓國|首爾/.test(n)?")
# 美化：交通／其他卡片只選一趟旅程時不再重複旅程名；個人單改成 STOB 配色
s = s.replace('<div class="text-xs text-stone-500 shrink-0">${esc(T(x.trip).name)}</div>', "${oneT()?'':`<div class=\"text-xs text-stone-500 shrink-0\">${esc(tShort(x.trip))}</div>`}")
for _a,_b in [('#1c2e42','#0f4c52'),('#2a4560','#146c72'),('#b08c4a','#e8a93a'),('#8a6a2e','#146c72'),('#e2d7c0','#dce6e6'),('#e8e1d3','#dce6e6'),('#66625a','#5f7075'),('#1f2630','#1c2529'),('#f7f2e8','#eef4f3'),('#c8b27e','#9cc7c4'),('#fbf6ea','#f2f8f7'),('#7a5a20','#0f5c62'),('#ece5d6','#e3ecec'),('#e2dccd','#dce6e6'),('#efe4cc','#e6f0ef'),('#2a3442','#1c2529'),('#f6efe0','#f3f6f5'),('#e3d6bd','#cfe2e1'),('#8a857b','#7a8b8f'),('#ece4d5','#e3ecec'),('#6f6255','#5f7075'),('#fffaf1','#ffffff')]:
    s = s.replace(_a, _b)
rep('<span class="selm-d">✈️ ${n(f)}　🏨 ${n(h)}　🚃 ${n(t)}${o?\'　🎫 \'+n(o):\'\'}</span>', '<span class="selm-d"><i>✈️&nbsp;${n(f)}</i> <i>🏨&nbsp;${n(h)}</i> <i>🚃&nbsp;${n(t)}</i>${o?\' <i>🎫&nbsp;\'+n(o)+\'</i>\':\'\'}</span>')
# ---- 2026-11-23 從 TOB 移植：金額「當地貨幣 / TWD」、固定旅程列、已取消訂單區（只在飯店清單最下方、摺疊、依飯店分組）----
rep("const nights=h=>", "const byCur=(L,c0)=>{const by={};L.forEach(h=>by[h.cur]=(by[h.cur]||0)+htot(h));const e=Object.entries(by);if(!e.length)return money(0,c0)+(c0=='TWD'?'':' / TWD 0');const loc=e.map(([c,v])=>money(v,c)).join(' ＋ ');return e.length==1&&e[0][0]=='TWD'?loc:loc+' / TWD '+n(sum(L.map(h=>conv(htot(h),h.cur))))};\nconst nights=h=>")
rep("全部訂單 TWD ${n(sum(hs0.map(h=>conv(htot(h),h.cur))))}", "全部訂單 ${byCur(hs0,h0.cur)}")
rep("已選合計 <b>TWD ${n(tot)}</b>", "已選合計 <b>${byCur(list.filter(okH),h0.cur)}</b>")
# 飯店訂單卡：總額（含已付款狀態）放在付款日期正上方；展開後只留逐間房金額
rep("${ordBtn(h)}</div>${cxlLine(h)}</summary><div class=\"px-3 pb-3\">${h.rooms.map((r,i)=>`<div class=\"rounded-xl bg-stone-50 p-2 mb-2\"><div class=\"font-medium\">房間 ${i+1}：${esc(r.type)}",
    "${ordBtn(h)}</div><div class=\"text-sm mt-1\">總額 <b>${byCur([h],h.cur)}</b>　<span class=\"text-stone-500 whitespace-nowrap\">${h.paid?'已付款':'未付款'}</span></div>${cxlLine(h)}</summary><div class=\"px-3 pb-3\">${h.rooms.map((r,i)=>`<div class=\"rounded-xl bg-stone-50 p-2 mb-2\"><div class=\"font-medium\">房間 ${i+1}：${esc(r.type)}")
rep("<div class=\"text-sm mt-1 border-t border-stone-200 pt-2\">總額 <b>${money(htot(h),h.cur)}</b>　${h.paid?'已付款':'未付款'}${h.rooms.map((r,n2)=>`<br>房間 ${n2+1}：${money(rp(h,r),h.cur)}`).join('')}</div>${h.grp?nl(h.note):''}",
    "${h.rooms.length>1?`<div class=\"text-sm mt-1 border-t border-stone-200 pt-2 text-stone-600\">${h.rooms.map((r,n2)=>`房間 ${n2+1}：${money(rp(h,r),h.cur)}`).join('<br>')}</div>`:''}${h.grp?nl(h.note):''}")
# 已取消的飯店訂單：主清單不列，統一放最下方（整區摺疊，裡面依飯店分組再摺疊，記取消日 cxlAt）
rep("let out=grp(listH(),hKey)", "let out=grp(listH().filter(h=>h.status!='已取消'),hKey)")
rep("還沒有飯店訂單。</div>'}</div></div>`;", "還沒有飯店訂單。</div>'}${cxlHt()}</div></div>`;")
rep("const tbar=()=>", r"""const cxlHt=()=>{if(S.focus)return '';const L=db.ht.filter(h=>h.status=='已取消'&&inTS(h.trip)).sort(hSort),mt=TSEL().length>1;if(!L.length)return '';const md=x=>d(x).slice(5);return `<details class="col-span-full mt-6"><summary class="cursor-pointer text-lg font-medium text-stone-500 py-1">已取消（${L.length} 筆）</summary><div class="${GR} mt-2">`+grp(L,h=>h.trip+'|'+(h.zh||h.en)).map(l=>{const h0=l[0];return `<details class="${CC} opacity-70"><summary class="cursor-pointer"><div class="flex items-start justify-between gap-2"><div class="min-w-0"><div class="font-bold text-lg">${esc(h0.zh||h0.en)}</div>${mt?`<div class="text-xs text-stone-500">${esc(T(h0.trip).name)}</div>`:''}<div class="text-sm text-stone-500">${l.length} 筆訂單・${d(l[0].cin)} → ${md(l[l.length-1].cout)}</div></div><span class="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-800 shrink-0">❌ 已取消</span></div></summary><div class="mt-3">${l.map(h=>`<div class="${BK} p-3"><div class="flex items-start justify-between gap-2"><div class="min-w-0"><div class="font-medium">${md(h.cin)} → ${md(h.cout)}・${nights(h)} 晚</div><div class="text-sm text-stone-500">${h.rooms.map(r=>esc(r.type)).join('、')}</div></div>${h.cxlAt?`<span class="text-xs text-red-800 shrink-0 whitespace-nowrap">取消日 ${md(h.cxlAt)}</span>`:''}</div><div class="text-sm break-all mt-1" ${lpA(h.orderNo)}>訂單 <b>${esc(h.orderNo)}</b></div></div>`).join('')}</div></details>`}).join('')+`</div></details>`};
const tbar=()=>""")
# 固定：旅程選單＋子分頁列跟在固定頁首下方不隨頁面捲動
rep("return `<div class=\"tpick${ended", "return `<div class=\"tsk\"><div class=\"tpick${ended")
rep("</div>`+fbar()};", "</div>`+fbar()+`</div>`};")
rep(".stk .xnav{position:static!important;margin-bottom:.6rem!important}", ".stk .xnav{position:static!important;margin-bottom:.6rem!important}\n.tsk{position:sticky;top:var(--stkh,0px);z-index:25;margin:0 -.75rem;padding:.1rem .75rem 0;background:rgb(var(--s50));box-shadow:0 6px 10px -10px rgb(60 40 20/.35)}\n.tsk .tpick{margin-top:0}\n@media(min-width:640px){.tsk{margin:0 -1.5rem;padding-left:1.5rem;padding-right:1.5rem}}\n@media(min-width:1024px){.tsk{margin:0 -2rem;padding-left:2rem;padding-right:2rem}}")
rep(".stk{box-shadow:0 6px 10px -10px rgb(0 0 0/.8)}", ".stk,.tsk{box-shadow:0 6px 10px -10px rgb(0 0 0/.8)}")
rep("function go(v,x){", "function stkH(){const e=document.querySelector('#app .stk');if(e)document.documentElement.style.setProperty('--stkh',e.getBoundingClientRect().height+'px')}\naddEventListener('resize',stkH);addEventListener('orientationchange',stkH);addEventListener('load',stkH);try{document.fonts&&document.fonts.ready.then(stkH)}catch(e){}\nfunction go(v,x){")
rep("${pfab()}`;", "${pfab()}`;stkH();")
# privacy check
bad = sorted(set(re.findall(r"mkP\('m\d+','([^']+)'", src) + re.findall(r"pp:'(\w{6,})'", src) + re.findall(r"orderNo:'(\d{6,})'", src)[:20]))
hits = [w for w in bad if w in s]
(ROOT / 'stob' / 'STOB.html').write_text(s, encoding='utf-8')
print('size', len(s.encode()), 'leftover:', hits)
