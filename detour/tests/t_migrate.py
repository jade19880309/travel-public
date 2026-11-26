# 舊名搬家測試：雲端主文件 tob（舊名）＋ localStorage stob_*，載入後應讀得到、第一次儲存寫到 detour、舊資料保留
import sys,asyncio,json,pathlib,runpy
T=type('T',(),runpy.run_path(str(pathlib.Path(__file__).resolve().parent/'test.py'),run_name='mod'))
from playwright.async_api import async_playwright
SEED="""
(()=>{const fnv=s=>{let h=0x811c9dc5;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return (h>>>0).toString(16)};
const d=JSON.stringify({trips:[{id:'t1',name:'舊資料測試旅程',start:'2027-07-02',end:'2027-07-07'}],members:[]});
const a=d.slice(0,20),b=d.slice(20);
window.__seed={main:{v:2,rev:3,n:2,len:d.length,h:fnv(d),pk:'tob_r3_abc_p',t:1,by:'old',s:a},part:{s:b}};
try{localStorage.setItem('stob_sel','{"x":1}');localStorage.setItem('detour-theme','navy')}catch(e){}
})();"""
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path=T.CHROME,args=['--no-sandbox'])
        pg=await b.new_page(viewport={'width':390,'height':844})
        errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
        await pg.add_init_script(SEED+T.MOCK+"""
(()=>{const st=window.__store;st['data/users/u1/tob']=window.__seed.main;st['data/users/u1/tob_r3_abc_p1']=window.__seed.part})();""")
        await pg.goto(T.APP_URL);await pg.wait_for_timeout(1500)
        ok=[]
        print('trip shown:', '舊資料測試旅程' in await pg.content())
        print('ls:', await pg.evaluate("[localStorage.getItem('stob_sel'),localStorage.getItem('detour_sel'),localStorage.getItem('detour-theme')]"))
        print('lock:', await pg.evaluate("CLD.lock+'|'+CLD.st+'|'+CLD.rev"))
        await pg.evaluate("db.trips[0].note='edited';cloudSave()");await pg.wait_for_timeout(2500)
        print('keys:', await pg.evaluate("Object.keys(__store).sort()"))
        print('lock2:', await pg.evaluate("CLD.lock+'|'+CLD.st+'|'+CLD.rev"))
        await pg.evaluate("cloudLoad()");await pg.wait_for_timeout(800)
        print('after reload:', await pg.evaluate("(db.trips[0]||{}).note+'|'+CLD.rev+'|'+CLD.lock"))
        print('errs',errs);await b.close()
asyncio.run(main())
