import pathlib as _pl, os as _os
HERE=_pl.Path(__file__).resolve().parent
APP_URL=(HERE.parent/__import__('os').environ.get('APP','DETOUR.html')).as_uri()
CHROME=_os.environ.get('CHROME','/usr/bin/google-chrome')
import asyncio,json,base64
src=open(HERE/'test.py').read()
ns={'__file__':str(HERE/'test.py')};exec(src.split('MOCK = ')[0].replace('from playwright.async_api import async_playwright',''),ns);CANNED=json.dumps(ns['CANNED'],ensure_ascii=False)
PLAN={"title":"東京親子 6 日遊","summary":"前三天露營車環富士山，後兩天住淺草走東京市區。","tips":["買 Suica 卡","晴空塔門票已訂，記得帶 QR","7 月很熱，午後安排室內"],
 "days":[{"date":f"2027-07-0{i}","title":t,"area":a,"hotel":"","items":[{"time":"09:00","title":f"景點{i}-A","detail":"慢慢逛約 1.5 小時，出發前確認營業時間。","move":"","q":f"景點{i}A 東京","booked":False,"cost":"免費"},{"time":"12:00","title":"午餐：拉麵","detail":"附近排隊名店。","move":"步行 10 分","q":"拉麵 東京","booked":False,"cost":"¥1,200/人"},{"time":"14:30","title":f"景點{i}-B","detail":"室內避暑。","move":"地鐵 15 分","q":"x","booked":i==6,"cost":""},{"time":"18:30","title":"晚餐","detail":"燒肉。","move":"步行 5 分","q":"燒肉","booked":False,"cost":""}]} for i,(t,a) in enumerate([("抵達・成田取車","千葉"),("河口湖","山梨"),("富士山五合目","山梨"),("還車・淺草","東京・淺草"),("上野・秋葉原","東京"),("晴空塔","東京・押上"),("回程","羽田")],start=1)]}
DAY={"date":"x","title":"新的一天：台場","area":"東京・台場","hotel":"","items":[{"time":"10:00","title":"teamLab","detail":"預約入場。","move":"百合海鷗線 20 分","q":"teamLab Tokyo","booked":False,"cost":"¥3,800"}]}
MOCK=src.split('MOCK = """')[1].split('"""')[0]
MOCK=MOCK.replace("sample.json=async(p,o)=>{window.__lastPrompt=p;window.__lastImgs=(o&&o.images||[]).length;return CANNED}",
 "sample.json=async(p,o)=>{window.__lastPrompt=p;if(p.includes('排出這趟旅程每天的建議行程'))return PLAN;if(p.includes('重新安排'))return DAY;if(p.includes('想修改已排好的行程'))return {summary:'第二天改台場',days:[Object.assign({},DAY,{date:'2027-07-02'})]};return CANNED}")
MOCK=MOCK.replace("n=='sample'?sample:null","n=='sample'?sample:n=='downloads'?{save:async({filename,data})=>{window.__fn=filename;if(typeof data=='string'){window.__html=data;return {status:'saved'}}const b=new Uint8Array(await data.arrayBuffer());let s='';for(let i=0;i<b.length;i+=32768)s+=String.fromCharCode.apply(null,b.subarray(i,i+32768));window.__pdf=btoa(s);return {status:'saved'}}}:null")
MOCK=MOCK.replace('CANNED',CANNED).replace('PLAN',json.dumps(PLAN,ensure_ascii=False)).replace('DAY',json.dumps(DAY,ensure_ascii=False))
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path=CHROME,args=['--no-sandbox'])
        pg=await b.new_page(viewport={'width':390,'height':844},device_scale_factor=2);errs=[]
        pg.on('pageerror',lambda e:errs.append(str(e)))
        await pg.add_init_script(MOCK)
        await pg.goto(APP_URL);await pg.wait_for_timeout(1000)
        await pg.evaluate("go('up');ADS.text='x'");await pg.evaluate("adRun()");await pg.wait_for_timeout(500);await pg.evaluate("adApply()");await pg.wait_for_timeout(500)
        await pg.screenshot(path='p0_home.png')
        await pg.evaluate("S.trip=db.trips[0].id;go('plan')");await pg.wait_for_timeout(300)
        await pg.screenshot(path='p1_prefs.png',full_page=True)
        await pg.evaluate("plGen()");await pg.wait_for_timeout(800)
        await pg.evaluate("document.getElementById('pld0').open=true");await pg.wait_for_timeout(200)
        await pg.screenshot(path='p2_plan.png',full_page=True)
        print('ctx has hotel/flight:', 'BR184' in await pg.evaluate('__lastPrompt'), '淺草測試飯店' in await pg.evaluate('__lastPrompt'))
        await pg.evaluate("plDay(2)");await pg.wait_for_timeout(500)
        await pg.evaluate("PL.edit='第二天改台場'");await pg.evaluate("plEdit()");await pg.wait_for_timeout(500)
        print(await pg.evaluate("plOf(oneT()).plan.days.map(d=>d.title)"))
        await pg.evaluate("plPub()");await pg.wait_for_timeout(500);h=await pg.evaluate('window.__html');open('/tmp/pub.html','w').write(h or '');print('pub',await pg.evaluate('window.__fn'),len(h or ''))
        print('safe has PNR?', 'ABC123' in h, 'F100' in h, 'H200' in h, '淺草測試飯店' in h)
        await pg.evaluate("PL.safe=false");await pg.evaluate("plPub()");await pg.wait_for_timeout(500);h2=await pg.evaluate('window.__html');print('full has PNR?', 'ABC123' in h2, 'H200' in h2)
        await pg.evaluate("PL.safe=true;render()");await pg.wait_for_timeout(200)
        await pg.screenshot(path='p5_pubbtn.png',full_page=True)
        await pg.evaluate("plPdf()");await pg.wait_for_timeout(6000)
        fn=await pg.evaluate('window.__fn');data=await pg.evaluate('window.__pdf')
        print('pdf',fn,len(data or ''))
        if data: open('/tmp/plan.pdf','wb').write(base64.b64decode(data))
        await pg.evaluate("PL.idel='0-0';render()");await pg.wait_for_timeout(100)
        await pg.evaluate("plItemDel(0,0)");print('items d0',await pg.evaluate("plOf(oneT()).plan.days[0].items.length"))
        await pg.evaluate("PL.delc=true;render()");await pg.wait_for_timeout(100);await pg.screenshot(path='p3_del.png')
        n=await pg.evaluate("(async()=>{await cloudFlush();await new Promise(r=>setTimeout(r,300));db={};await cloudLoad();return Object.keys(db.plans||{}).length})()")
        print('plans persisted',n)
        await pg.evaluate("plDel()");print('plan after del',await pg.evaluate("plOf(oneT()).plan"))
        tid=await pg.evaluate("oneT()");await pg.evaluate(f"go('add');adGo('trip');ADS.del='t{tid}';render()");await pg.wait_for_timeout(100)
        await pg.click('.adyes');await pg.wait_for_timeout(300);print('trips after del',await pg.evaluate("[db.trips.length,db.fl.length,db.ht.length]"))
        print(errs);await b.close()
asyncio.run(main())
