# 第二輪測試：多分頁儲存、鎖定、斷線、下載失敗、個資過濾
import asyncio,json,os,time,copy
HERE=os.path.dirname(os.path.abspath(__file__))
exec(open(os.path.join(HERE,'t8.py')).read().split('async def main')[0])
URL=globals().get('APP_URL') or ('file://'+HERE+'/index.html')
CH=os.environ.get('CHROME','/usr/bin/google-chrome')
from playwright.async_api import async_playwright
R=[]
def ok(name,cond,info=''):R.append((name,bool(cond)));print(('PASS ' if cond else 'FAIL ')+name,info if info!='' else '')
# ---- 跨分頁共用的假 Claude db（在測試程式裡，所有分頁看到同一份），含 acquire 的租約語意 ----
S={'store':{},'leases':{},'lat':0,'fail':[],'noacq':False,'acqerr':None,'after_main':None,'sets':[]}
def now(): return time.time()*1000
async def dbop(src,op,path,data,opt):
    if S['lat']: await asyncio.sleep(S['lat'])
    for f in list(S['fail']):
        if f['op']==op and ((path==f['match']) if f.get('exact') else (f['match'] in path)):
            if f.get('n',1)<=0: continue
            f['n']=f.get('n',1)-1
            if f.get('apply'):
                if op=='set': S['store'][path]=copy.deepcopy(data)
            return {'__err':f['code']}
    if op=='get': return {'exists':path in S['store'],'data':copy.deepcopy(S['store'].get(path))}
    if op=='set':
        if len(json.dumps(data,ensure_ascii=False))>256*1024: return {'__err':'invalid_argument'}
        S['store'][path]=copy.deepcopy(data);S['sets'].append(path)
        if path.endswith('/tob') and S['after_main']: fn=S['after_main'];S['after_main']=None;fn()
        return {'ok':1}
    if op=='del': S['store'].pop(path,None);return {'ok':1}
    if op=='acq':
        if S['noacq']: return {'__noacq':1}
        if S['acqerr']: return {'__err':S['acqerr']}
        L=S['leases'].get(path);t=now();h=opt['holder'];ttl=min(600000,max(1000,opt.get('ttlMs') or 30000))
        if L and L['until']>t and L['holder']!=h: return {'acquired':False,'expiresAt':time.strftime('%Y-%m-%dT%H:%M:%S',time.gmtime(L['until']/1000))+'.%03dZ'%(L['until']%1000)}
        S['leases'][path]={'holder':h,'until':t+ttl};return {'acquired':True,'version':1,'holder':h}
DBX="""(()=>{const call=(op,p,d,o)=>window.__dbop(op,p,d===undefined?null:d,o||null).then(r=>{if(r&&r.__err)throw {code:r.__err,message:r.__err};return r});
 const mk=p=>{const x={id:p.split('/').pop(),path:p,get:async()=>{const r=await call('get',p);return {exists:r.exists,data:()=>r.data}},set:d=>call('set',p,d).then(()=>{}),delete:()=>call('del',p).then(()=>{}),
  acquire:o=>call('acq',p,null,o).then(r=>{if(r.__noacq)throw {code:'capability_removed'};return r})};return x};
 const DB={doc:mk,collection:c=>({doc:id=>mk(c+'/'+id)})};
 const wait=()=>new Promise(r=>{const t=setInterval(()=>{if(window.claude){clearInterval(t);r()}},5)});
 wait().then(()=>{const u=window.claude.use;window.claude={use:async n=>n=='db'?DB:n=='downloads'?(window.__dlMode=='none'?null:{save:async o=>{window.__dlTry=(window.__dlTry||[]).concat([o.data]);if(window.__dlMode=='fail')throw {code:'unavailable'};if(window.__dlMode=='declined')return {status:'declined'};window.__html=o.data;return {status:'saved'}}}):u(n)}});
 window.__copied=[];const cw=t=>{window.__copied.push(t);return Promise.resolve()};try{Object.defineProperty(navigator,'clipboard',{value:{writeText:cw},configurable:true})}catch(e){}
})();"""
MAIN='data/users/u1/tob'
async def newtab(ctx,errs):
    pg=await ctx.new_page();pg.on('pageerror',lambda e:errs.append(str(e)))
    await pg.add_init_script(MOCK);await pg.add_init_script(DBX);await pg.goto(URL);await pg.wait_for_timeout(1500);return pg
async def settle(pg): await pg.evaluate("CLD.q.catch(()=>{})")
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path=CH,args=['--no-sandbox'])
    ctx=await b.new_context(viewport={'width':390,'height':844});await ctx.expose_binding('__dbop',dbop);errs=[]
    A=await newtab(ctx,errs)
    await A.evaluate("go('up');ADS.text='x'");await A.evaluate("adRun()");await A.wait_for_timeout(400);await A.evaluate("adApply()");await A.wait_for_timeout(1500);await settle(A)
    ok('A 首次儲存成功並寫入 pk',S['store'][MAIN]['rev']==1 and S['store'][MAIN]['pk'].startswith('tob_r1_'),{k:S['store'][MAIN][k] for k in ['rev','n','pk']})
    B=await newtab(ctx,errs)
    ok('B 分頁讀到 A 的資料',await B.evaluate("db.trips.length")==1 and await B.evaluate("CLD.rev")==1)
    # ===== 1. 多分頁：A 先存，B 用舊版本存 → B 鎖定、不覆蓋 =====
    await A.evaluate("db.trips[0].note='A改的';cloudFlush()");await settle(A)
    snap=json.dumps(S['store'][MAIN])
    await B.evaluate("db.trips[0].note='B改的';cloudFlush()");await settle(B)
    ok('多分頁：B 版本過舊 → 鎖定',await B.evaluate("CLD.lock")=='conflict')
    ok('多分頁：雲端保留 A 的修改',json.dumps(S['store'][MAIN])==snap and 'A改的' in S['store'][MAIN]['s'])
    # ===== 3. 重新讀取要先確認 =====
    await B.evaluate("document.querySelector('#lockbar button').click()");await B.wait_for_timeout(200)
    txt=await B.evaluate("document.getElementById('lockbar').innerText")
    ok('重新讀取：先顯示確認，不直接覆蓋',await B.evaluate("db.trips[0].note")=='B改的' and '確定重新讀取' in txt and '遺失' in txt,txt.replace('\n',' ')[:90])
    ok('重新讀取：提供「先複製目前資料」',await B.evaluate("!!document.querySelector('#lockbar [onclick^=\"cpText(bkPack()\"]')"))
    await B.evaluate("document.querySelector('#lockbar [onclick^=\"cpText(bkPack()\"]').click()");await B.wait_for_timeout(100)
    ok('先複製目前資料：含 B 未儲存的修改',any('B改的' in c for c in await B.evaluate("window.__copied")))
    await B.evaluate("[...document.querySelectorAll('#lockbar button')].find(x=>x.innerText=='取消').click()");await B.wait_for_timeout(100)
    ok('取消：維持鎖定、資料不變',await B.evaluate("[CLD.lock,db.trips[0].note,CLD.rconf]")==['conflict','B改的',False])
    await B.evaluate("document.querySelector('#lockbar button').click()");await B.wait_for_timeout(100)
    await B.evaluate("[...document.querySelectorAll('#lockbar button')].find(x=>x.innerText=='確定重新讀取').click()");await B.wait_for_timeout(2500)
    ok('確定：載入雲端最新資料並解鎖',await B.evaluate("[CLD.lock,db.trips[0].note,CLD.rev]")==['','A改的',2])
    # ===== 1b. 兩分頁同時儲存（寫入很慢）→ 只有一邊寫入，另一邊鎖定 =====
    await A.evaluate("cloudReload(1)");await A.wait_for_timeout(2500)
    S['lat']=0.4;S['sets']=[]
    await asyncio.gather(A.evaluate("db.trips[0].note='A同時';cloudFlush()"),B.evaluate("db.trips[0].note='B同時';cloudFlush()"))
    await asyncio.gather(settle(A),settle(B));S['lat']=0
    la,lb=await A.evaluate("CLD.lock"),await B.evaluate("CLD.lock");m=S['store'][MAIN]
    win='A同時' if 'A同時' in m['s'] else 'B同時' if 'B同時' in m['s'] else None
    ok('同時儲存：剛好一邊成功、另一邊鎖定',sorted([la,lb])==['','conflict'] and win and ((win=='A同時')==(la=='')),[la,lb,win,m['rev']])
    ok('同時儲存：主文件只被寫一次',S['sets'].count(MAIN)==1,S['sets'])
    loser=B if lb else A;winner=A if lb else B
    await loser.evaluate("cloudReload(1)");await loser.wait_for_timeout(2500)
    # ===== 1c. 拿不到鎖 → 不寫；鎖釋放後自動補存 =====
    S['leases']['data/users/u1/tob_lock']={'holder':'someone','until':now()+15000};S['sets']=[]
    await A.evaluate("db.trips[0].note='等鎖';cloudFlush()");await A.wait_for_timeout(300)
    await settle(A)
    ok('拿不到鎖：沒有寫入雲端',MAIN not in S['sets'],S['sets'])
    ok('拿不到鎖：顯示稍後重試、沒有鎖定',await A.evaluate("[CLD.st,CLD.lock,CLD.msg.includes('稍後自動重試')]")==['err','',True])
    await A.wait_for_timeout(7000);await settle(A)
    ok('鎖釋放後自動補存',await A.evaluate("CLD.st")=='ok' and '等鎖' in S['store'][MAIN]['s'])
    # ===== 1d. 不支援 acquire → 暫停儲存，不再當作成功 =====
    S['noacq']=True;S['sets']=[]
    await A.evaluate("db.trips[0].note='無鎖';cloudFlush()");await settle(A)
    ok('不支援鎖：暫停儲存且沒寫入',await A.evaluate("CLD.lock")=='nolease' and not S['sets'])
    S['noacq']=False;await A.evaluate("cloudReload(1)");await A.wait_for_timeout(2500)
    ok('不支援鎖：恢復後重新讀取解鎖',await A.evaluate("CLD.lock")=='')
    # ===== 2. 斷線 =====
    # 2a. acquire 一直連不上
    S['acqerr']='unavailable';S['sets']=[]
    await A.evaluate("db.trips[0].note='斷線1';cloudSave()");await A.wait_for_timeout(5000);await settle(A)
    ok('斷線（拿鎖失敗）：不寫入、標示未儲存',not S['sets'] and await A.evaluate("[CLD.st,CLD.dirty,CLD.lock]")==['err',True,''],await A.evaluate("CLD.msg"))
    S['acqerr']=None;await A.evaluate("dispatchEvent(new Event('online'))");await A.wait_for_timeout(1500);await settle(A)
    ok('恢復連線（online 事件）後自動補存',await A.evaluate("[CLD.st,CLD.dirty]")==['ok',False] and '斷線1' in S['store'][MAIN]['s'])
    # 2b. 大資料寫到一半斷線（分段失敗）→ 主文件不動、仍可讀
    await A.evaluate("for(let i=0;i<300;i++)db.ot.push({id:'ot-x'+i,trip:db.trips[0].id,type:'門票',title:'很長的門票名稱'.repeat(5)+i,date:'2027-07-03',status:'已確認',paid:true,cur:'JPY',total:100,pax:{},note:'備註'.repeat(40),lines:[]})")
    before=json.dumps(S['store'][MAIN]);S['fail']=[{'op':'set','match':'_p1','code':'unavailable','n':1}]
    await A.evaluate("cloudFlush()");await settle(A)
    ok('分段寫入斷線：主文件沒被改',json.dumps(S['store'][MAIN])==before)
    ok('分段寫入斷線：舊資料仍可完整讀取',await B.evaluate("(async()=>{await cloudReload(1);return [CLD.lock,db.ot.length<300]})()")==['',True])
    await A.evaluate("clearTimeout(CLD.timer);CLD.retry=0;cloudFlush()");await settle(A)
    ok('分段寫入斷線：重試後寫入完整',await A.evaluate("CLD.st")=='ok' and S['store'][MAIN]['n']>=2 and await B.evaluate("(async()=>{await cloudReload(1);return [CLD.lock,db.ot.length>=300]})()")==['',True])
    # 2c. 主文件其實寫進去了，但回應斷線 → 下次儲存認得是自己寫的，不誤判衝突
    S['fail']=[{'op':'set','match':MAIN,'exact':1,'code':'unavailable','n':1,'apply':True}]
    r0=S['store'][MAIN]['rev']
    await A.evaluate("db.trips[0].note='回應遺失';cloudFlush()");await settle(A)
    ok('主文件已寫入但回應遺失：雲端已是新版',S['store'][MAIN]['rev']==r0+1 and await A.evaluate("CLD.rev")==r0)
    S['fail']=[];await A.evaluate("clearTimeout(CLD.timer);db.trips[0].note='接著改';cloudFlush()");await settle(A)
    ok('回應遺失後：接手自己的版本、不鎖定、繼續儲存',await A.evaluate("[CLD.lock,CLD.st]")==['','ok'] and S['store'][MAIN]['rev']==r0+2 and '接著改' in S['store'][MAIN]['s'])
    # 2d. 沒用鎖的舊版程式在寫入後覆蓋 → 寫後檢查發現並鎖定
    def legacy_overwrite(): S['store'][MAIN]={'n':1,'s':'{"trips":[]}','t':1}
    S['after_main']=legacy_overwrite
    await A.evaluate("db.trips[0].note='被舊版覆蓋';cloudFlush()");await settle(A)
    ok('寫入後被其他程式覆蓋：立即鎖定',await A.evaluate("CLD.lock")=='conflict')
    S['store'][MAIN]=json.loads(before) if False else S['store'][MAIN]
    # 復原資料讓後面測試繼續
    await A.evaluate("(async()=>{CLD.lock='';CLD.rev=0;CLD.legacy=true;CLD.prevN=1;CLD.pk='tob_p';cloudFlush();await CLD.q})()");await settle(A)
    ok('（測試復原）重新寫入',await A.evaluate("[CLD.lock,CLD.st]")==['','ok'])
    # ===== 4. 個資格式偵測 =====
    POS=['0912-345-678','0912345678','0912 345 678','+886 912 345 678','+886-2-2345-6789','02-2345-6789','(02)2345-6789','+81 3-1234-5678','03-1234-5678','+852 2345 6789','電話：2345 6789','Tel 9123 4567','手機 0912345678','A123456789','F131104093','4111 1111 1111 1111','4111111111111111','5500-0000-0000-0004','卡號末四碼 1234','x.y@example.com']
    NEG=['BR198','CI 100','JL0802','BR 0198','2027-07-02','2027/07/02 – 2027/07/05','2027-07-02 2027-07-05','07/02-07/05','0702-0705','09:00-18:30','0900-1830','東京都台東区浅草1-2-3','〒111-0032','〒060-0005','1-1-1 Maihama, Urayasu, Chiba 279-0031','台北市信義區信義路五段7號89樓','台北市中正區重慶南路一段122號','¥12,000','NT$3,500','A123456788','訂房 3 晚 2 房','D1 → D2','1234567890123','第 3 天 10:30 集合','Suica 2,000 円','10-12 人','Room 1203','大阪市中央区難波5-1-60']
    pos=await A.evaluate(f"{json.dumps(POS,ensure_ascii=False)}.map(s=>[s,pubFind(s).map(x=>x.kind).join('+')])")
    neg=await A.evaluate(f"{json.dumps(NEG,ensure_ascii=False)}.map(s=>[s,pubFind(s).map(x=>x.kind+':'+x.v).join('+')])")
    miss=[s for s,k in pos if not k];fp=[(s,k) for s,k in neg if k]
    ok('個資偵測：電話（台灣、日本、香港、國際）、身分證、卡號、末四碼、Email 都抓到',not miss,miss or [k for _,k in pos])
    ok('個資偵測：航班編號、日期、時間、地址、郵遞區號、金額、錯誤檢查碼的身分證都不誤判',not fp,fp)
    # 整份行程：地址、航班、日期都在 → 不跳檢查
    await A.evaluate("S.trip=db.trips[0].id;go('plan')");await A.evaluate("plGen()");await A.wait_for_timeout(600)
    await A.evaluate("""(()=>{const pl=plOf(db.trips[0].id).plan;pl.days[0].items[0].detail='在東京都台東区浅草1-2-3集合，搭 JL0802 於 2027/07/02 09:30 出發，〒111-0032，預算 ¥12,000';plSave()})()""")
    hits=await A.evaluate("pubParts(T(db.trips[0].id)).hits.map(x=>x.kind+':'+x.v)")
    ok('整份行程：正常地址、航班、日期、金額不會被擋',not hits,hits)
    # 自由文字裡的電話 → 列出、遮蔽
    await A.evaluate("""(()=>{const pl=plOf(db.trips[0].id).plan;pl.days[0].items[0].detail+='，導遊電話 0912-345-678，香港朋友 Tel 9123 4567';pl.tips.push('身分證 A123456789');plSave();render()})()""")
    await A.evaluate("window.__dlMode='ok';window.__html='';window.__dlTry=[];plPub()");await A.wait_for_timeout(400)
    chk=await A.evaluate("document.querySelector('.pubchk')?document.querySelector('.pubchk').innerText:''")
    ok('自由文字電話與身分證：下載前列出',('電話號碼' in chk) and ('身分證字號' in chk) and not await A.evaluate("window.__dlTry.length"),chk.replace('\n',' ')[:120])
    await A.evaluate("plPub(1)");await A.wait_for_timeout(800);h=await A.evaluate("window.__html")
    ok('遮蔽後下載：不含電話與身分證，地址、航班保留',h and all(x not in h for x in ['0912-345-678','9123 4567','A123456789']) and '浅草1-2-3' in h and 'JL0802' in h)
    # ===== 2. 公開行程輸出：下載失敗 =====
    await A.evaluate("window.__dlMode='fail';window.__dlTry=[];window.__copied=[];plPub(1)");await A.wait_for_timeout(800)
    tried=await A.evaluate("window.__dlTry");box=await A.evaluate("document.querySelector('.pubchk')?document.querySelector('.pubchk').innerText:''")
    ok('下載失敗：不自動複製，顯示「再試一次／複製原始碼」',len(tried)==1 and not await A.evaluate("window.__copied.length") and '複製網頁原始碼' in box,box.replace('\n',' ')[:80])
    await A.evaluate("[...document.querySelectorAll('.pubchk button')].find(x=>x.innerText=='複製網頁原始碼').click()");await A.wait_for_timeout(200)
    cp=await A.evaluate("window.__copied")
    ok('下載失敗：複製的原始碼與嘗試下載的是同一份',cp and cp[-1]==tried[0])
    ok('下載失敗：複製的原始碼也已遮蔽',all(x not in cp[-1] for x in ['0912-345-678','A123456789']))
    await A.evaluate("window.__dlMode='ok';[...document.querySelectorAll('.pubchk button')].find(x=>x.innerText=='再試一次下載').click()");await A.wait_for_timeout(600)
    ok('再試一次下載：用同一份 HTML、成功後關閉提示',await A.evaluate("window.__html")==tried[0] and not await A.evaluate("PL.out"))
    await A.evaluate("window.__dlMode='none';window.__dlTry=[];plPub(1)");await A.wait_for_timeout(600)
    ok('不能下載的環境：同樣提供複製（同一份已檢查的 HTML）',await A.evaluate("!!PL.out&&PL.out.fail=='這裡不能下載檔案'&&pubLeak(PL.out.html).length==0"))
    await A.evaluate("window.__dlMode='declined';PL.out=null;plPub(1)");await A.wait_for_timeout(600)
    ok('使用者取消下載：不跳任何輸出',await A.evaluate("!PL.out&&!document.querySelector('.pubchk')"))
    # 檢查失敗不得輸出：讓最後一道檢查抓到個資
    await A.evaluate("window.__pubHtml0=pubHtml;pubHtml=t=>window.__pubHtml0(t).replace('</main>','<p>聯絡 0912-345-678</p></main>');window.__dlMode='ok';window.__dlTry=[];window.__copied=[];PL.out=null;plPub(1)");await A.wait_for_timeout(600)
    ok('最後檢查失敗：不下載、不複製、不留可輸出的內容',await A.evaluate("[window.__dlTry.length,window.__copied.length,PL.out]")==[0,0,None])
    await A.evaluate("pubHtml=window.__pubHtml0;1")
    await A.screenshot(path=str(HERE)+'/r2_pub.png')
    ok('沒有 JS 錯誤',not errs,errs[:3])
    await b.close()
  print('\n%d/%d passed'%(sum(1 for _,c in R if c),len(R)))
asyncio.run(main())
