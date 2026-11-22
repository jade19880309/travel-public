"""產生 stob/DETOUR.html（偏航 DETOUR）。
以已提交的 stob/STOB.html 為底（不需要 travel-private），套上偏航的品牌、浪漫配色、版本號。
也會把 versions.json 的版本歷程寫進 stob/guide.html（<!--VER:START--> 與 <!--VER:END--> 之間）。
執行：cd stob/src && python3 detour.py
改版本：只改 versions.json（current、date、history 最上面一筆）；跑完會同步 App、說明頁。
"""
import json, pathlib, re

HERE = pathlib.Path(__file__).resolve().parent
STOB = HERE.parent / 'STOB.html'
OUT = HERE.parent / 'DETOUR.html'
GUIDE = HERE.parent / 'guide.html'
V = json.loads((HERE / 'versions.json').read_text(encoding='utf-8'))
VER = V['current']

s = STOB.read_text(encoding='utf-8')


def rep(old, new):
    global s
    if s.count(old) < 1:
        raise SystemExit('missing: ' + old[:90])
    s = s.replace(old, new, 1)


# 頁首設定
rep('content="STOB 旅遊訂單"', 'content="偏航 DETOUR"')
rep('<meta name="theme-color" content="#f3f6f5" media="(prefers-color-scheme: light)"><meta name="theme-color" content="#101719" media="(prefers-color-scheme: dark)">',
    '<meta name="theme-color" content="#F9F2ED" media="(prefers-color-scheme: light)"><meta name="theme-color" content="#1A1521" media="(prefers-color-scheme: dark)">')
rep('family=Noto+Sans+TC:wght@400;500;700&display=swap', 'family=Noto+Sans+TC:wght@400;500;700&family=Noto+Serif+TC:wght@500;600&family=Cormorant+Garamond:wght@500;600&family=Playfair+Display:ital,wght@1,500&display=swap')
rep('<title>STOB 旅遊訂單</title>', '<title>偏航 DETOUR</title>\n<script>(function(){var t="romantic";try{var v=localStorage.getItem("detour-theme");if(v==="navy"||v==="romantic")t=v}catch(e){}document.documentElement.setAttribute("data-theme",t);var m=t==="navy"?["#F7F4E9","#0A1526"]:["#FFF9F6","#1C1216"],q=document.querySelectorAll("meta[name=theme-color]");for(var i=0;i<q.length;i++)q[i].setAttribute("content",/dark/.test(q[i].getAttribute("media")||"")?m[1]:m[0])})()</script>')

def svg(n):
    return (HERE / 'assets' / n).read_text(encoding='utf-8').strip()


MARK = '<span class="th-r">' + svg('logo-romantic.svg') + '</span><span class="th-n">' + svg('logo-navy.svg') + '</span>'
# 頁首標誌（svg 航線）與名稱，副標帶版本號
rep('<span class="stm" role="button" tabindex="0" aria-label="回到頁首"', '<span class="stm dtl" role="button" tabindex="0" aria-label="偏航 DETOUR，回到頁首"')
rep('<i></i>STOB</span><span class="stw"><b>旅遊訂單</b><small>Share Travel Order Book</small></span>',
    MARK + '</span><span class="stw"><b>偏航</b><small>DETOUR<em>v' + VER + '</em></small></span>')

# 文案（只改畫面文字）
rep("return e<0?{k:2,big:'已結束',sub:'',c:'text-stone-400'}", "return e<0?{k:2,big:'已結束',sub:'我們抵達了目的地，也收藏了沿途。',c:'text-stone-400'}")
rep("if(db.trips.length)return warn+_home();", "if(db.trips.length)return dtrHero()+warn+_home()+dtrFoot();")
rep("return warn+(CLD.st=='load'?", "return dtrHero()+warn+(CLD.st=='load'?")
rep("onclick=\"go('up')\">上傳第一筆訂單</button></div>`)}}", "onclick=\"go('up')\">上傳第一筆訂單</button></div>`)+dtrFoot()}}")
rep("tip('已存入 '+n+' 筆訂單');", "tip('已存入 '+n+' 筆訂單・繁瑣的事都收好了，剩下的交給風景。');")
rep("render();tip('已儲存')}", "render();tip(f.id?'已儲存':'遠方已經選好，故事正要開始。')}")
rep("plOf(tid).at=Date.now();plSave()}", "plOf(tid).at=Date.now();plSave();setTimeout(function(){tip('一切都安排好了，現在可以亂來了。')},60)}")
rep("onclick=\"plDay(${i})\">${b=='d'+i?'重排中…':'↻ 換一個建議'}</button></div></details>`;",
    "onclick=\"plDay(${i})\">${b=='d'+i?'重排中…':'↻ 換一個建議'}</button></div><div class=\"dtr-alt\">多一條路，就多一種可能。</div></details>`;")
rep("x.fillText('STOB',90,165)", "x.fillText('DTR.',90,165)")
rep('不像是 STOB 的備份', '不像是偏航的備份')

# 附加樣式與程式
css = (HERE / 'detour.css').read_text(encoding='utf-8')
js = (HERE / 'detour.js').read_text(encoding='utf-8').replace('/*VERSIONS*/null', json.dumps(V, ensure_ascii=False))
js = js.replace('@@FLIGHT_ROMANTIC@@', svg('flight-romantic.svg')).replace('@@FLIGHT_NAVY@@', svg('flight-navy.svg'))
js = js.replace('</', '<\\/')
partA, partB = js.split('/*PART2*/')
boot = '(async function boot(){'
if s.count(boot) != 1:
    raise SystemExit('boot marker count != 1')
s = s.replace(boot, partA + '\n' + boot, 1)
tail = '</script></body></html>'
idx = s.rfind(tail)
if idx < 0:
    raise SystemExit('no script tail')
s = s[:idx] + '\n' + partB + '\n</script>\n<style>' + css + '</style>' + s[idx + len('</script>'):]
OUT.write_text(s, encoding='utf-8')
print('DETOUR.html', len(s.encode()), 'bytes, v' + VER)

# 說明頁：版本歷程
g = GUIDE.read_text(encoding='utf-8')
rows = ''.join(
    '<li%s><details%s><summary><b>v%s</b>%s<small>%s</small></summary><ul>%s</ul></details></li>' % (
        ' class="cur"' if i == 0 else '', ' open' if i == 0 else '', h['v'], h['t'], h['d'], ''.join('<li>%s</li>' % x for x in h['n']))
    for i, h in enumerate(V['history']))
block = '<!--VER:START--><ul class="vr">' + rows + '</ul><!--VER:END-->'
if '<!--VER:START-->' in g:
    g = re.sub(r'<!--VER:START-->.*?<!--VER:END-->', lambda m: block, g, flags=re.S)
    g = re.sub(r'(<span class="gv">)[^<]*(</span>)', r'\g<1>v%s\g<2>' % VER, g)
    g = re.sub(r"更新於 [0-9/]+(・v[0-9.]+)?'", "更新於 %s・v%s'" % (V['date'].replace('-', '/'), VER), g)
    GUIDE.write_text(g, encoding='utf-8')
    print('guide.html version history updated')
else:
    print('guide.html has no VER markers yet (skipped)')
