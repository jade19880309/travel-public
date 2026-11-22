# 新增測試：版本保護、讀取鎖定、舊格式升級、截圖失敗、AI 驗證、公開網頁遮蔽、手機表單
import asyncio,json,os
HERE=os.path.dirname(os.path.abspath(__file__))
exec(open(os.path.join(HERE,'t8.py')).read().split('async def main')[0])
from playwright.async_api import async_playwright
R=[]
def ok(name,cond,info=''):R.append((name,bool(cond)));print(('PASS ' if cond else 'FAIL ')+name,info)
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path=os.environ.get('CHROME','/usr/bin/google-chrome'),args=['--no-sandbox'])
    ctx=await b.new_context(viewport={'width':390,'height':844});pg=await ctx.new_page();errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
    await pg.add_init_script(MOCK);await pg.goto(STOB_URL);await pg.wait_for_timeout(1200)
    await pg.evaluate("go('up');ADS.text='x'");await pg.evaluate("adRun()");await pg.wait_for_timeout(400);await pg.evaluate("adApply()");await pg.wait_for_timeout(1500)
    main=await pg.evaluate("window.__store['data/users/u1/tob']")
    ok('新格式主文件 v2＋rev＋檢查碼',main and main.get('v')==2 and main.get('rev')>=1 and 'h' in main and 'len' in main,{k:main[k] for k in ['v','rev','n','len']})
    # 1) 另一台裝置寫入 → 本機下次儲存應該鎖定、不覆蓋
    await pg.evaluate("const m=window.__store['data/users/u1/tob'];m.rev=m.rev+5;m.by='other'")
    before=await pg.evaluate("JSON.stringify(window.__store['data/users/u1/tob'])")
    await pg.evaluate("db.trips[0].note='本機修改';cloudFlush()");await pg.wait_for_timeout(500);await pg.evaluate("CLD.q")
    after=await pg.evaluate("JSON.stringify(window.__store['data/users/u1/tob'])")
    ok('版本衝突時鎖定',await pg.evaluate("CLD.lock")=='conflict')
    ok('版本衝突時沒有覆蓋雲端',before==after)
    ok('鎖定提示列出現',await pg.evaluate("!!document.querySelector('#lockbar:not([hidden])')"))
    n0=await pg.evaluate("db.trips.length");await pg.evaluate("go('add');adGo('trip');ADS.tf={name:'x',start:'2027-01-01'};tripSave()")
    ok('鎖定中不能新增旅程',await pg.evaluate("db.trips.length")==n0)
    # 重新讀取 → 解鎖（因為檢查碼沒變，只改 rev，資料仍可讀）
    await pg.evaluate("cloudReload(1)");await pg.wait_for_timeout(2500)
    ok('重新讀取後解鎖',await pg.evaluate("CLD.lock")=='' ,await pg.evaluate("CLD.msg"))
    ok('解鎖後可再儲存',await pg.evaluate("(async()=>{db.trips[0].note='ok2';cloudFlush();await CLD.q;return window.__store['data/users/u1/tob'].rev==CLD.rev&&CLD.st=='ok'})()"))
    # 2) 檢查碼錯誤 → 讀取鎖定，並且不寫入
    await pg.evaluate("window.__store['data/users/u1/tob'].s='{\"trips\":[]}'")
    await pg.evaluate("cloudReload(1)");await pg.wait_for_timeout(4000)
    ok('檢查碼不符時鎖定',await pg.evaluate("CLD.lock")=='read',await pg.evaluate("CLD.msg"))
    snap=await pg.evaluate("JSON.stringify(window.__store)")
    await pg.evaluate("cloudSave()");await pg.wait_for_timeout(2500)
    ok('讀取鎖定時不寫入雲端',snap==await pg.evaluate("JSON.stringify(window.__store)"))
    # 3) 讀取失敗（網路）→ 重試一次後鎖定
    await pg.evaluate("window.__getFail=1;const d=window.claude;")
    r=await pg.evaluate("""(async()=>{const r=uref('tob'),g=r.get;let c=0;const orig=CLD.db.collection;CLD.db.collection=c0=>({doc:id=>{const x=orig(c0).doc(id);if(id=='tob')x.get=async()=>{c++;throw {code:'unavailable'}};return x}});
      const okk=await loadSafe();CLD.db.collection=orig;return [okk,c,CLD.lock]})()""")
    ok('讀取失敗會重試一次再鎖定',r==[False,2,'read'],r)
    # 4) 舊格式資料讀得到，存檔後升級並刪掉舊分段
    legacy=await pg.evaluate("""(async()=>{for(const k of Object.keys(window.__store))if(k.includes('/tob'))delete window.__store[k];
      const js=JSON.stringify(db),A=js.slice(0,60000),B=js.slice(60000);window.__store['data/users/u1/tob']={n:B?2:1,s:A,t:1};if(B)window.__store['data/users/u1/tob_p1']={s:B};
      const n=db.trips.length;db={};const okk=await loadSafe();return [okk,db.trips.length==n,CLD.legacy]})()""")
    ok('舊格式資料可讀取',legacy[0] and legacy[1] and legacy[2],legacy)
    up=await pg.evaluate("(async()=>{cloudFlush();await CLD.q;const m=window.__store['data/users/u1/tob'];return [m.v,m.rev,!('data/users/u1/tob_p1' in window.__store)]})()")
    ok('存檔後升級為新格式',up[0]==2 and up[1]==1 and up[2],up)
    # 5) 截圖存失敗 → 提示＋上傳頁卡片＋可重試
    tips=[];pg.on('console',lambda m:None)
    await pg.evaluate("""(()=>{const orig=CLD.db.collection;window.__orig=orig;CLD.db.collection=c0=>({doc:id=>{const x=orig(c0).doc(id);if(id.startsWith('img_'))x.set=async()=>{throw {code:'quota_exceeded'}};return x}})})()""")
    await pg.evaluate("imgSave('TESTORD1','data:image/jpeg;base64,AAAA')");await pg.wait_for_timeout(800)
    f=await pg.evaluate("[ADS.imgFail.length,ADS.imgFail[0]&&ADS.imgFail[0].why,db.imgs.includes('TESTORD1'),document.body.innerText.includes('沒有存到雲端')]")
    ok('截圖失敗有記錄與提示',f[0]==1 and f[1]=='雲端空間已滿' and not f[2] and f[3],f)
    await pg.evaluate("go('up')");await pg.wait_for_timeout(200)
    ok('上傳頁顯示失敗卡片與重試',await pg.evaluate("!!document.querySelector('[onclick=\"imgRetry()\"]')"))
    await pg.evaluate("CLD.db.collection=window.__orig;imgRetry()");await pg.wait_for_timeout(800)
    ok('重試成功後清除',await pg.evaluate("[ADS.imgFail.length,db.imgs.includes('TESTORD1')]")==[0,True])
    await pg.evaluate("imgSave('BIG','')");await pg.wait_for_timeout(500)
    ok('截圖太大也會提示',await pg.evaluate("ADS.imgFail.some(x=>x.k=='BIG'&&x.why.includes('太大'))"))
    await pg.evaluate("ADS.imgFail=[]")
    # 6) AI 修改驗證
    r=await pg.evaluate("""(()=>{const h=db.ht[0],t=db.trips[0];const res=aiCheck([
       {op:'set',coll:'ht',id:h.id,patch:{paid:true,cin:'2027/7/1'}},
       {op:'set',coll:'ht',id:'nope',patch:{paid:true}},
       {op:'set',coll:'trips',id:t.id,patch:{name:'新名字'}},
       {op:'set',coll:'ht',id:h.id,patch:{total:'abc'}},
       {op:'add',coll:'ot',item:{trip:t.id,type:'門票',title:'A',date:'2027-07-03',status:'已確認',paid:true,cur:'JPY',total:100}},
       {op:'add',coll:'ot',item:{trip:'zzz',title:'B'}},
       {op:'del',coll:'ot',id:db.ot[0].id},
       {op:'set',coll:'ht',id:h.id,patch:{hack:1}}]);return res.map(x=>[x.op,!!x.err])})()""")
    ok('AI 驗證：壞日期、找不到的 id、壞金額、壞旅程、未知欄位被排除',[e for _,e in r]==[True,True,False,True,False,True,False,True],r)
    await pg.evaluate("""go('add');ADS.aiRes={summary:'t',items:aiCheck([{op:'set',coll:'trips',id:db.trips[0].id,patch:{note:'AI改'}},{op:'del',coll:'ot',id:db.ot[0].id},{op:'set',coll:'ht',id:db.ht[0].id,patch:{cin:'bad'}}])};ADS.aiSel={};ADS.aiRes.items.forEach(x=>ADS.aiSel[x.i]=!x.err&&x.op!='del');render()""")
    await pg.wait_for_timeout(200)
    pv=await pg.evaluate("[document.querySelectorAll('.aio').length,document.querySelectorAll('.aio.bad').length,document.querySelectorAll('.aio input:checked').length,document.querySelector('.aiov s')&&document.querySelector('.aiov').innerText]")
    ok('AI 預覽逐欄位顯示，刪除預設不勾',pv[0]==3 and pv[1]==1 and pv[2]==1,pv)
    n=await pg.evaluate("db.ot.length");await pg.evaluate("aiApply()")
    ok('只套用勾選的項目',await pg.evaluate(f"[db.trips[0].note,db.ot.length=={n},db.ht[0].cin!='bad']")==['AI改',True,True])
    await pg.screenshot(path=str(HERE)+'/v2_ai.png',full_page=True)
    # 7) 公開網頁：個資白名單與遮蔽
    await pg.evaluate("""(()=>{const m=db.members[0];m.zh=m.zh||'王小明';m.pp='X12345678';db.fl[0].pnr=db.fl[0].pnr||'ABC123';S.trip=db.trips[0].id;go('plan')})()""")
    await pg.evaluate("plGen()");await pg.wait_for_timeout(600)
    toks=await pg.evaluate("""(()=>{const m=db.members[0],pl=plOf(db.trips[0].id).plan;pl.days[0].items[0].detail='跟 '+m.zh+' 會合，護照 '+m.pp+'，代碼 '+db.fl[0].pnr+'，卡號末四碼 1234';pl.tips.push('聯絡 a.b@example.com');plSave();render();return [m.zh,m.pp,db.fl[0].pnr,(db.fl[0].orderNo||'')]})()""")
    await pg.evaluate("plPub()");await pg.wait_for_timeout(400)
    ok('匯出前列出疑似個資',await pg.evaluate("!!document.querySelector('.pubchk')") and await pg.evaluate("!window.__html"),await pg.evaluate("document.querySelector('.pubchk')&&document.querySelector('.pubchk').innerText.slice(0,160)"))
    await pg.screenshot(path=str(HERE)+'/v2_pubchk.png',full_page=True)
    await pg.evaluate("plPub(1)");await pg.wait_for_timeout(800)
    h=await pg.evaluate("window.__html||''")
    leak=[t for t in toks if t and t in h]+[x for x in ['1234','a.b@example.com'] if x in h]
    ok('遮蔽後下載：檔案不含姓名、護照、PNR、訂單編號、卡號末四碼、Email',h and not leak,leak)
    ok('遮蔽後仍保留行程內容',('會合' in h) and ('＊＊' in h),[('景點1-A' in h),('＊＊' in h),h[h.find('會合')-40:h.find('會合')+80] if '會合' in h else 'no 會合'])
    ok('不改動原本資料',await pg.evaluate("plOf(db.trips[0].id).plan.days[0].items[0].detail.includes(db.members[0].pp)"))
    # 沒個資時直接下載、不跳檢查
    await pg.evaluate("window.__html='';const pl=plOf(db.trips[0].id).plan;pl.days[0].items[0].detail='自由活動';pl.tips.pop();plSave();plPub()");await pg.wait_for_timeout(800)
    ok('沒有個資時直接下載',await pg.evaluate("!!window.__html&&!document.querySelector('.pubchk')"))
    # 8) 手機表單：重畫不清空、FAB 隱藏、欄位屬性
    await pg.evaluate("go('add');adGo('mem');ADS.mf={};ADS.formTop=1;render()");await pg.wait_for_timeout(300)
    await pg.fill('#mf_zh','測試甲');await pg.fill('#mf_last','chen');await pg.evaluate("render()");await pg.wait_for_timeout(100)
    ok('表單重畫後內容保留',await pg.evaluate("document.getElementById('mf_zh').value+'|'+document.getElementById('mf_last').value")=='測試甲|chen')
    attrs=await pg.evaluate("['mf_last','mf_first','mf_pp'].map(i=>{const e=document.getElementById(i);return e.getAttribute('autocapitalize')+'/'+e.getAttribute('autocorrect')+'/'+e.getAttribute('spellcheck')})")
    ok('英文姓名、護照關閉自動校正並改大寫',all(a=='characters/off/false' for a in attrs),attrs)
    fs=await pg.evaluate("Math.min(...[...document.querySelectorAll('.adform input,.adform select')].map(e=>parseFloat(getComputedStyle(e).fontSize)))")
    ok('輸入框字級 ≥16px（iOS 不會放大）',fs>=16,fs)
    fab=await pg.evaluate("(()=>{const b=document.getElementById('fab')||document.querySelector('.fab');return b?b.hidden||getComputedStyle(b).display=='none':true})()")
    ok('表單開啟時隱藏 FAB',fab)
    bar=await pg.evaluate("getComputedStyle(document.querySelector('.adform .adbar')).position")
    ok('操作按鈕固定在底部',bar=='sticky',bar)
    await pg.evaluate("memSave()");ok('大寫儲存',await pg.evaluate("db.members.at(-1).last")=='CHEN')
    await pg.evaluate("go('add');adGo('trip');ADS.tf={};render()");await pg.wait_for_timeout(100)
    await pg.fill('#tf_name','回程較早');await pg.fill('#tf_start','2027-05-10');await pg.fill('#tf_end','2027-05-01');n=await pg.evaluate("db.trips.length");await pg.evaluate("tripSave()")
    ok('回程早於出發會擋下',await pg.evaluate("db.trips.length")==n)
    await pg.screenshot(path=str(HERE)+'/v2_form.png')
    ok('沒有 JS 錯誤',not errs,errs[:3])
    await b.close()
  print('\n%d/%d passed'%(sum(1 for _,c in R if c),len(R)))
asyncio.run(main())
