import pathlib as _pl, os as _os
HERE=_pl.Path(__file__).resolve().parent
STOB_URL=(HERE.parent/'STOB.html').as_uri()
CHROME=_os.environ.get('CHROME','/usr/bin/google-chrome')
import json, asyncio
from playwright.async_api import async_playwright

CANNED = {
 "summary":"東京家族旅行：長榮來回機票、淺草飯店兩間房、露營車",
 "questions":["第二間房的入住者看不清楚"],
 "trips":[{"ref":"new1","name":"日本東京","start":"2027-07-02","end":"2027-07-07","note":"6天5夜","curs":["JPY"]}],
 "members":[{"ref":"p1","zh":"王小明","last":"WANG","first":"XIAOMING","sex":"M","dob":"1990-01-02","pp":"A123","ppExp":"2032-01-01","grp":"王家"},
            {"ref":"p2","zh":"李美美","last":"LI","first":"MEIMEI","sex":"F","dob":"","pp":"","ppExp":"","grp":"王家"}],
 "orders":[
  {"kind":"fl","trip":"new1","img":[0],"platform":"Trip.com","orderNo":"F100","airline":"長榮航空 EVA Air","pnr":"ABC123","ticketNo":"","status":"已確認","paid":True,"cur":"TWD","total":"24,000","note":"付款 2026/07/17・Visa 末四碼 1234",
   "segs":[{"dir":"去程","airline":"","no":"BR184","date":"2027-07-02","dep":"07:55","arr":"12:25","from":"桃園 TPE T2","to":"成田 NRT T1"},{"dir":"回程","airline":"","no":"BR189","date":"2027-07-07","dep":"10:50","arr":"13:30","from":"東京羽田 HND T3","to":"台北松山 TSA T1"}],
   "pax":{"p1":12000,"p2":12000},"pp":{"p1":{"pnr":"ABC123","tkt":"","kind":"成人","note":""}}},
  {"kind":"ht","trip":"new1","img":[1],"zh":"淺草測試飯店","en":"Asakusa Test Hotel","ori":"浅草テストホテル","addr":"Taito, Tokyo","area":"東京・淺草","platform":"Agoda","orderNo":"H200","cin":"2027-07-05","cout":"2027-07-07","status":"已確認","paid":False,"free":True,"cancelBy":"2027-07-03","payDate":"2027-07-01","rep":"p1","cur":"JPY","total":30000,"note":"不含早餐・現場付款",
   "rooms":[{"type":"雙人房","beds":"","bf":False,"price":"","members":["p1","p2"],"note":""}]},
  {"kind":"tr","trip":"new1","img":[],"type":"露營車","company":"Camper Co","title":"7/2-7/5 露營車","platform":"","orderNo":"C1","code":"","no":"","date":"2027-07-02","dep":"13:30","arr":"","from":"成田機場","to":"淺草","status":"已確認","paid":False,"cur":"JPY","total":200000,"pax":{"p1":"","p2":""},"note":"","lines":["取車：7/2 13:30 成田"],
   "pays":[{"l":"訂金","d":"2026-11-27","amt":20000,"paid":"2026-11-19","url":""},{"l":"尾款","d":"2027-06-02","amt":180000,"paid":"","url":""}],"camp":{"cin":"2027-07-02","cout":"2027-07-05","zh":"露營車"}},
  {"kind":"ot","trip":"new1","img":[],"type":"門票","title":"晴空塔門票","company":"Skytree","platform":"KKday","orderNo":"K9","code":"QR","date":"2027-07-06","dep":"10:00","status":"已確認","paid":True,"cur":"TWD","total":1200,"pax":{},"note":""}
 ]}

MOCK = """
(()=>{const store={};const mk=p=>({id:p.split('/').pop(),path:p,
 get:async()=>({exists:p in store,data:()=>store[p]&&JSON.parse(JSON.stringify(store[p]))}),
 set:async d=>{if(JSON.stringify(d).length>256*1024)throw {code:'invalid_argument'};store[p]=JSON.parse(JSON.stringify(d))},
 delete:async()=>{delete store[p]},
 acquire:async({holder,ttlMs})=>{const L=leases[p],now=Date.now();if(L&&L.until>now&&L.holder!==holder)return {acquired:false,expiresAt:new Date(L.until).toISOString()};const t=Math.min(600000,Math.max(1000,ttlMs||30000));leases[p]={holder,until:now+t};return {acquired:true,version:1,expiresAt:new Date(now+t).toISOString(),holder}}});
 const leases={};window.__leases=leases;
 window.__store=store;
 const dbx={doc:mk,collection:c=>({doc:id=>mk(c+'/'+id)})};
 const sample=async()=>({text:'x'});sample.json=async(p,o)=>{window.__lastPrompt=p;window.__lastImgs=(o&&o.images||[]).length;return CANNED};sample.limits=async()=>({images:{maxCount:8}});
 window.claude={use:async n=>n=='db'?dbx:n=='user'?{id:async()=>'u1',can:async()=>true}:n=='sample'?sample:null};
})();
""".replace('CANNED', json.dumps(CANNED, ensure_ascii=False))

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path=CHROME, args=['--no-sandbox'])
        pg = await b.new_page(viewport={'width':390,'height':844}, device_scale_factor=2)
        errs=[]
        pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.on('console', lambda m: m.type=='error' and errs.append('console:'+m.text))
        await pg.add_init_script(MOCK)
        await pg.goto(STOB_URL)
        await pg.wait_for_timeout(1200)
        await pg.screenshot(path='s0_home.png')
        await pg.evaluate("go('up')"); await pg.wait_for_timeout(300)
        await pg.fill('#adtx', '測試確認信內容')
        await pg.evaluate("ADS.text='測試確認信內容'")
        await pg.evaluate("adRun()"); await pg.wait_for_timeout(800)
        await pg.screenshot(path='s1_preview.png', full_page=True)
        await pg.evaluate("adApply()"); await pg.wait_for_timeout(1200)
        await pg.screenshot(path='s2_home.png')
        for v in ['fl','ht','tr','ot','mem','cost','cip','cis','mail','cia','cih','cit','cio','person']:
            await pg.evaluate(f"go('{v}')"); await pg.wait_for_timeout(250)
            if v in ('ht','cip','cis','cih','tr'):
                await pg.screenshot(path=f'v_{v}.png', full_page=True)
        await pg.evaluate("go('add');adGo('ord')"); await pg.wait_for_timeout(200)
        await pg.screenshot(path='s3_ord.png', full_page=True)
        await pg.wait_for_timeout(1000)
        st = await pg.evaluate("Object.keys(window.__store)")
        badge = await pg.evaluate("CLD.st")
        # reload & ensure persisted (store lost on reload in mock, so re-load via cloudLoad)
        n = await pg.evaluate("(async()=>{db={members:[],trips:[],fl:[],ht:[],tr:[],ot:[],imgs:[],rates:{}};await cloudLoad();return [db.trips.length,db.fl.length,db.ht.length,db.tr.length,db.ot.length,db.members.length,CAMP.length,FAM.length]})()")
        print('store', st, 'st', badge, 'reload', n)
        print('ERRORS', errs[:20])
        await b.close()
asyncio.run(main())
