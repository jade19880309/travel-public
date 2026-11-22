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
rep("'旅遊訂單<span class=\"tobt\" title=\"Travel Order Book\">TOB</span>'", "'<span class=\"sth\"><span class=\"stm\" aria-hidden=\"true\"><i></i>STOB</span><span class=\"stw\"><b>旅遊訂單</b><small>Share Travel Order Book</small></span></span>'+(typeof cloudBadge=='function'?cloudBadge():'')")

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
# privacy check
bad = sorted(set(re.findall(r"mkP\('m\d+','([^']+)'", src) + re.findall(r"pp:'(\w{6,})'", src) + re.findall(r"orderNo:'(\d{6,})'", src)[:20]))
hits = [w for w in bad if w in s]
(ROOT / 'stob' / 'STOB.html').write_text(s, encoding='utf-8')
print('size', len(s.encode()), 'leftover:', hits)
