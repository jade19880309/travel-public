import pathlib as _pl, os as _os
HERE=_pl.Path(__file__).resolve().parent
APP_URL=(HERE.parent/__import__('os').environ.get('APP','DETOUR.html')).as_uri()
CHROME=_os.environ.get('CHROME','/usr/bin/google-chrome')
import asyncio,json
exec(open(HERE/'t8.py').read().split('async def main')[0])
MOCK2=MOCK.replace("sample.json=async(p,o)=>{window.__lastPrompt=p;","sample.json=async(p,o)=>{window.__lastPrompt=p;if(p.includes('你在幫忙修改一份旅遊訂單資料'))return {summary:'飯店改已付款並新增門票',ops:[{op:'set',coll:'ht',id:db.ht[0].id,patch:{paid:true}},{op:'add',coll:'ot',item:{trip:db.trips[0].id,type:'門票',title:'測試門票',date:'2027-07-03',status:'已確認',paid:true,cur:'JPY',total:3000,pax:{}}},{op:'del',coll:'tr',id:'nope'}]};")
assert MOCK2!=MOCK
VIEWS=['home','fl','ht','tr','ot','mem','cost','plan','person','cip','cis','mail','cia','cih','cit','cio','add','up']
from playwright.async_api import async_playwright
async def sweep(pg,tag,errs):
    bad=[]
    for v in VIEWS:
        await pg.evaluate(f"go('{v}')");await pg.wait_for_timeout(120)
        ov=await pg.evaluate("document.documentElement.scrollWidth-innerWidth")
        if ov>1: bad.append((v,ov))
    if 'add' in VIEWS:
        for t in ['trip','mem','ord','bk']:
            await pg.evaluate(f"go('add');adGo('{t}')");await pg.wait_for_timeout(80)
            ov=await pg.evaluate("document.documentElement.scrollWidth-innerWidth")
            if ov>1: bad.append(('add-'+t,ov))
    print(tag,'overflow:',bad,'errors:',errs[:5])
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path=CHROME,args=['--no-sandbox'])
        for scheme in ['light','dark']:
            ctx=await b.new_context(viewport={'width':390,'height':844},color_scheme=scheme);pg=await ctx.new_page();errs=[]
            pg.on('pageerror',lambda e:errs.append(str(e)))
            await pg.add_init_script(MOCK2);await pg.goto(APP_URL);await pg.wait_for_timeout(1200)
            await sweep(pg,scheme+' empty',errs)
            await pg.evaluate("go('up');ADS.text='x'");await pg.evaluate("adRun()");await pg.wait_for_timeout(400)
            # preview: skip one member, change nothing else
            await pg.evaluate("ADS.res.skip['m1']=true");await pg.evaluate("adApply()");await pg.wait_for_timeout(400)
            print('after apply members',await pg.evaluate("db.members.length"),'pax of skipped removed?',await pg.evaluate("JSON.stringify(db.fl[0].pax)"))
            await sweep(pg,scheme+' data(all)',errs)
            await pg.evaluate("S.trip=db.trips[0].id");await sweep(pg,scheme+' data(one trip)',errs)
            await pg.evaluate("go('plan')");await pg.evaluate("plGen()");await pg.wait_for_timeout(500)
            await sweep(pg,scheme+' with plan',errs)
            if scheme=='dark': await b.close() if False else None; 
            if scheme=='dark': break
            # AI edit
            await pg.evaluate("go('add');ADS.ai='x'");await pg.evaluate("aiEdit()");await pg.wait_for_timeout(300);await pg.evaluate("aiApply()")
            print('aiEdit: ht paid',await pg.evaluate("db.ht[0].paid"),'ot count',await pg.evaluate("db.ot.length"))
            # trip form edit
            await pg.evaluate("go('add');adGo('trip');ADS.tf=JSON.parse(JSON.stringify(db.trips[0]));render()");await pg.wait_for_timeout(100)
            await pg.fill('#tf_name','東京改名');await pg.check('#tf_fam');await pg.evaluate("tripSave()")
            print('trip after edit',await pg.evaluate("[db.trips[0].name,db.trips[0].fam]"))
            # new trip without date -> should refuse
            await pg.evaluate("ADS.tf={};render()");await pg.fill('#tf_name','x');await pg.evaluate("tripSave()");print('refuse no date trips',await pg.evaluate("db.trips.length"))
            await pg.evaluate("ADS.tf=null;render()")
            # member add
            await pg.evaluate("adGo('mem');ADS.mf={};render()");await pg.fill('#mf_zh','測試人');await pg.fill('#mf_last','test');await pg.fill('#mf_grp','王家');await pg.evaluate("memSave()")
            print('member add',await pg.evaluate("[db.members.length,db.members.at(-1).last,FAM.map(f=>f[0]+':'+f[1].length)]"))
            # order edit JSON + fields
            await pg.evaluate("adGo('ord');ADS.edit='ht:'+db.ht[0].id;render()");await pg.wait_for_timeout(100)
            await pg.evaluate("const t=document.getElementById('oe_js');const o=JSON.parse(t.value);o.zh='改名飯店';t.value=JSON.stringify(o)")
            await pg.select_option('#oe_st','待確認');await pg.evaluate("ordSave('ht',db.ht[0].id)")
            print('order edit',await pg.evaluate("[db.ht[0].zh,db.ht[0].status]"))
            await pg.evaluate("ADS.edit='ht:'+db.ht[0].id;render()");await pg.evaluate("document.getElementById('oe_js').value='{bad'");await pg.evaluate("ordSave('ht',db.ht[0].id)")
            print('bad json kept',await pg.evaluate("db.ht[0].zh"))
            await pg.evaluate("ordDel('ot',db.ot[0].id)");print('ord del',await pg.evaluate("db.ot.length"))
            # backup/restore
            js=await pg.evaluate("JSON.stringify(db)")
            await pg.evaluate("ADS.imp=JSON.stringify({trips:[],members:[]});ADS.impOk=true");await pg.evaluate("bkImport()");print('restore empty',await pg.evaluate("db.trips.length"))
            await pg.evaluate(f"ADS.imp={json.dumps(js)};bkImport()");print('restore back',await pg.evaluate("[db.trips.length,db.fl.length,db.ht.length]"))
            await pg.evaluate("ADS.imp='not json';bkImport()");print('restore bad ok',await pg.evaluate("db.trips.length"))
            # large data chunking
            n=await pg.evaluate("""(async()=>{for(let i=0;i<400;i++)db.ot.push({id:'ot-x'+i,trip:db.trips[0].id,type:'門票',title:'很長的測試門票名稱'.repeat(5)+i,date:'2027-07-03',status:'已確認',paid:true,cur:'JPY',total:100,pax:{},note:'備註'.repeat(40),lines:[]});
               cloudFlush();await CLD.q;const parts=(await uref('detour').get()).data().n;const c=db.ot.length;db={};await cloudLoad();return [parts,c,db.ot.length]})()""")
            print('chunk parts/count/reloaded',n)
            await sweep(pg,'light big data',errs)
            # ended trip
            await pg.evaluate("db.trips[0].start='2024-01-01';db.trips[0].end='2024-01-05';render()");await sweep(pg,'light ended trip',errs)
            await ctx.close()
        # signed out
        ctx=await b.new_context(viewport={'width':390,'height':844});pg=await ctx.new_page();errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
        await pg.add_init_script("window.claude={use:async n=>null}");await pg.goto(APP_URL);await pg.wait_for_timeout(1500)
        print('signed out msg:',await pg.evaluate("CLD.st+' / '+CLD.msg"),errs);await pg.screenshot(path='q_signedout.png')
        await pg.evaluate("go('up')");await pg.wait_for_timeout(200);print('up disabled', await pg.evaluate("!!document.querySelector('.adpick.dis')"),errs)
        ctx2=await b.new_context(viewport={'width':390,'height':844});pg2=await ctx2.new_page();e2=[];pg2.on('pageerror',lambda e:e2.append(str(e)))
        await pg2.goto(APP_URL);await pg2.wait_for_timeout(800);print('no claude:',await pg2.evaluate("CLD.st+' / '+CLD.msg"),e2)
        await b.close()
asyncio.run(main())
