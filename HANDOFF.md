# 交接紀錄（給下一位 AI）

> 這份檔案只記錄「還沒做完／還沒確認」的事。**做完的項目直接刪掉**，不用留紀錄，也不用下一位重複確認（使用者 2026-11-21 指示）。
> 專案說明請看 `README.md`（旅程 JSON 結構、新增旅程步驟、改動後 `sw.js` 的 `VERSION` 要加 1）。

## 常駐規則（每位 AI 都要遵守）
- **做不完就寫盡**：如果這次對話無法完成全部工作（用量快用完、被中斷、遇到阻礙），先停下手邊動作，把下列內容寫進本檔並推送，再回報使用者：
  1. 做到一半的項目：停在哪一步、下一步具體要做什麼、改了哪些檔案
  2. 沒做的項目與原因
  3. 未查證的事實與資料來源（價格、營業時間等不確定的要明講）
  4. 踩到的坑與下一位要避開的事
- 已完成的項目從本檔刪除，不要累積。
- 寫完後確認 `git log` 與遠端一致（已推送），本檔內容不要依賴對話紀錄才能看懂。

## 工作流程備忘
- 改 `trips/*.json` 用「精準字串取代」，不要整份 `json.dump`（檔案是手排格式，會造成整份 diff）。
- 改完一定跑：`python3 -c "import json;json.load(open('trips/XXX.json',encoding='utf-8'))"`，再用 Playwright 開 `python3 -m http.server` 實測（共用 `app.js` 的行程是點 `.dr[data-k]` 展開後才畫出來；京阪是點 `.tk[data-k]`）。
- 外網字型／天氣／匯率在沙盒會 `ERR_TUNNEL_CONNECTION_FAILED`，屬正常，不是 bug。
- 推送用：`git -c push.negotiate=true push origin main`；每次推送前把 `sw.js` 的 `VERSION` 加 1。
- 營業時間、價格皆來自網路整理，標了「依來源／需確認」的不要寫成確定事實。
- `keihan.html` 是獨立版型：旅程資料 `T` 只存在 `go(T)` 裡面，外層函式要用的話得先存成全域（例如語音用的 `HT`），否則整頁會顯示「行程資料載入失敗」。
- 新工作階段取得 repo：先用 `add_repo` 掛上 `jade19880309/travel-public`（要 push 權限），再 `git clone --depth 1`（timeout 設 10 分鐘）；Bash 沒網路、不能 pip／npm，但 Playwright 已裝好，用 `python3 -I 腳本.py` 執行，腳本放暫存目錄不要放 repo。站內連結（`a[data-to]` 捲到卡片、`a[data-day]` 切換日期）可用 Playwright 直接點來驗證。
- 純改 `HANDOFF.md`（沒動網頁、JSON、`app.js`）時不需要加 `sw.js` 的 `VERSION`，那只在網頁內容變動時才有意義。
- 京阪每日圖示：有 `choice` 的日子，選項若沒寫 `stk` 要退回當天的 `stk`（曾因此抓 `ic-undefined.svg`，9/9 圖示消失）。圖示出問題先查檔名，不要先怪快取。

## 五張行程插畫 Icon 整合（2026/11/26，使用者提供 `icons.zip`；**首頁部分待使用者決定**）
使用者原始要求：把 5 張 PNG（`seoul`、`hong-kong-zhuhai-macau`、`tokyo`、`kyoto-osaka`、`tokyo-camper`，各 512×512 RGBA，已是圓角＋透明邊的成品）依英文檔名對應各行程；**保留原插畫、色彩、圓角、比例，不重繪、不用 SVG／Emoji**；各入口 Icon 顯示尺寸統一；手機電腦都要能用；點 Icon 直接進行程；不動行程資料、功能與各頁主題；完成後確認路徑與連結。

- 對應：`seoul`→`./?t=seoul-2027`、`hong-kong-zhuhai-macau`→`hk.html`、`tokyo`→`tokyo.html`、`kyoto-osaka`→`keihan.html`、`tokyo-camper`→`campervan.html`。
- **已完成並推送**
  - `images/home-journal/` 放了 5 張原檔（已用 `cmp` 確認與 zip 逐位元相同；`kyoto-osaka.png` 是這次新增）。
  - `travel-private` 的 `index.html`（TOB 行程卡）：`TIC` 改指這些 PNG（t1 首爾、t2 港珠澳、t3 東京、t4 京阪），統一 52px；`.tic` 拿掉 `overflow:hidden`／`border-radius`／`box-shadow`（會裁掉 PNG 自帶的圓角），改用 `drop-shadow`；東京卡（t3）多一顆露營車入口（`TIX`），`sw.js` V 101→102。細節見該 repo 的 `HANDOFF.md`。
- **未完成：公開首頁 `home.html`（卡在和平行工作階段的衝突）**
  - 我做的版本（露營車從 42px 小圖 `.subtrip` 改成與其他行程同尺寸的獨立入口卡 `.entry`＋`.stamp`；總覽列 `01 — 04`；`home-journal.css` 的 `.journal` 桌面改 `repeat(auto-fit,minmax(250px,1fr))`；`sw.js` CORE 加 `kyoto-osaka.png`）基於 `65f8dd5`，**只在遠端分支 `icons-home-unified`**，沒進 `main`。
  - 原因：我要推送時，`main` 已被另一個工作階段推了 3 個提交（「Update family travel journal home to v3 layout」、HZM Retro v1.1、「Refine home journal v3 to match reference mock」）。v3 的 `home.html`／`home-journal.css`／`journal-v3.css`／`journal-v3b.css` 大改，入口圖改用 `images/journal-v3/*.webp`（294×250、181×76 等**裁切過的另一份圖，不是使用者的 PNG**），所以 rebase 會衝突（`home.html`、`sw.js`），且直接疊上去會蓋掉 v3 版面。我沒有強推、沒有改 v3。
  - **待使用者三選一**（尚未回覆）：① 保留 v3 版面，入口圖換回 `images/home-journal/*.png` 原圖、露營車與其他行程同尺寸（AI 建議，符合原始要求）；② 維持 v3 現況（首頁就不是使用者的 PNG）；③ 放棄 v3，改用 `icons-home-unified`。
  - 若選①：v3 的 `.stamp` 版型是為非正方形 webp 設計的，換 PNG 時要改成 `aspect-ratio:1;object-fit:contain`，不能再裁切或加圓角遮罩；露營車要和其他卡同一個 `.stamp` 尺寸；`img src` 用 `images/home-journal/<檔名>.png`；`sw.js` 的 `VERSION` 加 1，CORE 補 `kyoto-osaka.png`（若首頁要用）。
- **京阪不放公開首頁是刻意的**（本檔「新增旅程」與 README：`keihan.html` 不放進 `trips/index.json`，只從私人訂單頁連過來）。`kyoto-osaka.png` 因此只用在 TOB 卡，不要為了「五張都出現」就加進公開總覽，除非使用者明講。
- 驗證方式：Playwright（`python3 -I`），首頁用 `http.server`；TOB 用 `file://` 開 `index.html`，並用 `context.route` 把 `https://jade19880309.github.io/travel-public/…` 對應到本機檔案（沙盒連不到外網）。檢查項：每張 `img.complete && naturalWidth>0`、各寬度（360／390／820／1280）`scrollWidth-clientWidth==0`、`pageerror` 為空、各連結 `href` 與目標檔存在。TOB 要先 `go('home')` 才有卡片。**沒有在 iPhone 實機確認。**
- 踩到的坑：推送前務必 `git fetch`——這個 repo 常有別的工作階段同時推送（這次就撞到）；淺 clone 要 rebase 得 `git fetch --depth=50 origin main`；撞到時不要強推。

## HZM Retro v1.0／v1.1：港珠澳港片復古風（2026/11/26）
- `theme-hzm-retro.css` 只由 `hk.html` 載入（`<link id="theme-hzm-retro">`，在 `theme-bay.css` 之後），規則都加 `html.th-bay.hzm-retro` 前綴；`theme-bay.css`、`app.js`、`style.css`、`trips/hk-2027.json` 都沒改。
- 封面在 `hk.html` 載入資料後才換成 `images/hk-2027/retro/hero.webp`（JSON 的 `hero.img` 仍是水墨圖），分享縮圖 `og.jpg` 沒換。
- 素材在 `images/hk-2027/retro/`；`day-1~4.webp` 只是日卡右側的裝飾背景（`#dy0`～`#dy3 .dr`），不是景點照片。
- 恢復原版：`hk.html?theme=classic`（存 localStorage `hzmTheme`，和東京的 `theme` 分開）；`?theme=retro` 改回。永久拿掉＝刪 `hk.html` 那個 link 與緊接的 script。改版前版本：commit `c62b53b`（備份分支 `backup/hzm-before-retro-v1.0` 使用者同意刪除，但沙盒無法刪遠端分支，需使用者手動刪）。
- **v1.1（2026/11/26）手機版（≤759px）**：依使用者提供的手機示意圖改版，CSS 在 `theme-hzm-retro.css` 最後的 `@media (max-width:759px)`；電腦版維持 v1.0。
  - 上方功能列（`header nav`）在手機改為**底部固定導覽列**（含 `env(safe-area-inset-*)`），上方只剩品牌列（`header::before/::after` 文字）；日期列 `.dock` 移到導覽列上方（`bottom:67px`＝導覽列高度，改導覽列高度要一起改，含 `#fs/#upd/#fxb/.fxp` 與 `body` 的 padding）。
  - `hk.html` 的 `hzmMobile()`（app.js 載入後執行）：封面包成 `<picture>`（手機 `hero-m.webp`、電腦 `hero.webp`）、海報下方插入四個功能鍵 `.hzm-keys`（連到 `#plan/#hotel/#flight/#food`）、`#plan` 後插入裝飾照片 `.hzm-photos`。電腦版這兩個元件 `display:none`。
  - `hero-m.webp`、`photos-m.webp` 是從使用者手機示意圖裁切的裝飾圖（不含個資）；日卡右側城市圖仍用素材包 `day-1~4.webp`；導覽列與功能鍵的小圖示是 CSS mask 線條圖示。
  - 日卡票根：`#days` 用 CSS counter 顯示 D1～D4；票根缺口是 `.dr` 的 mask，展開時拿掉。
  - 手機版字級下限 14px（只剩高德地圖「高」字圖示 13px）。
- 未在 iPhone 實機確認（只用 Playwright 測 320／375／390／430／768／1440；安全區域 `env()` 在模擬器中是 0，未實測瀏海機）。

## 森林手帳風主題（2026/11/26，依使用者提供的素材包整合）
- `theme-forest-journal.css`＝素材包原 CSS（上半，原樣保留）＋「整合補充」精確 selector（下半，蓋過 theme-fuji.css 與露營車內嵌樣式）。只由 `tokyo.html`、`campervan.html` 載入；兩頁 `<html>` 加了 `forest-journal` class。
- 插畫在 `images/forest-journal/`：`campervan-scene.webp`（露營車頁封面下方）、`tokyo-footer.webp`、`campervan-footer.webp`（頁尾裝飾）。素材包原圖有龍貓／小黑炭等吉卜力角色（非授權），所以兩張 footer 是裁掉角色、只留風景的版本；`tokyo-scene.webp` 整張以角色為主，沒有上傳也沒有使用。示意圖（reference.jpg／approved-reference.png）只供驗收，沒放進 repo。
- 2026/11/26 第二版（依手機示意圖對齊）：CSS 末段新增「示意圖對齊」區塊——固定色票（#F6F1E5／#FFFDF6／#DCE5CF／#81966C／#536B49／#A8BFC8／#C7A384／#394638，小字橡實色改深一階 `--acorn-ink` 保對比）、東京封面圖移到頁首滿版、導覽改圓角紙卡、底部日期列圓角＋Safe Area、頁尾插畫滿版淡入、露營車封面插畫完整不裁切；每日行程橫幅用 CSS 把 banner-fuji.svg 換成 `campervan-footer.webp` 水彩湖景（JSON 沒改）；其餘貼紙圖降飽和。`leaf.webp`＝從 campervan-scene 樹葉裁出的去背葉片（標題裝飾）。
- 恢復原版：網址加 `?theme=classic`（停用樣式、移除 class、隱藏裝飾圖，記在該手機）；`?theme=forest` 改回。永久移除＝刪兩頁的 class、link＋script、`.forest-scene`／`.forest-footer` 圖，並把 sw.js CORE 裡這幾個檔案拿掉。
- 改這個 CSS 或圖片記得加 sw.js 的 VERSION。

## 東京方案一 ↔ 關東露營車頁（2026/11/25）
- `trips/tokyo-2027.json` 方案一（`plans[0]`，id `rv`）的 7/2～7/4 三天加了 `"go": "campervan.html#d1..d3"`：點日期列或下方日期按鈕會直接開 `campervan.html` 對應 DAY，不再展開東京自己的行程（原本的 `i`/`x`/`n` 資料還留著，只是不顯示）。連續有 `go` 的日子在列表上併成一張卡（第一天的 `gc`：`t` 日期、`s` 標題、`href` 卡片本身連到哪），卡片只有一顆「關東露營車行程」按鈕（不列各天）；其餘天留空的隱藏 `.dy` 佔位，讓索引對齊。下方日期按鈕仍是每天一顆。方案一說明裡原本的「露營車行程」按鈕已刪。`app.js` 的 `.dr.go` 處理，其他旅程沒有 `go` 不受影響。
- 露營車行程內容只在 `campervan.html`（`const D`）維護；改這三天請改那邊。
- `campervan.html` 的「參考」分頁＝RV Park／酒藏巡禮兩個切換按鈕（`rvSub`）。RV Park 卡片是 `<details>` 折疊。
- 2026/11/25 細查：GNOME 露營車只能訂 G-1/G-2（團體）、D-1/D-3（雙人），一般區位車高 2.4 m 以上不可；報到 13:00～15:00（15:00 後沒聯絡＝取消）；30 天前開放、線上刷卡。クラフトパーク 車中泊 ¥2,500/台、報到 14:00～17:00、Carstay 有上架。仍未查證：GNOME 團體區位能否停兩台露營車、いずみの湯費用時間；兩處能否晚到；クラフトパーク 是否有電源（官網說有、2025 某網站說沒有）、BUS CAMP 2027 是否恢復。

## 語音按鈕（目前做法，改版時參考）
- 樣式：`keihan.html` 用 `.sp`，`app.js`／`style.css` 用 `.vo`（**不能用 `.sp`**：共用頁的美食詳情抽屜本身就是 `#sheet .sp`，撞名會讓抽屜縮成一條）；線條喇叭圖示、無底色，顏色跟主題（京阪 `--ai`，其他頁 `--red2`）；圖示字串 `SPI` 在 `keihan.html` 與 `app.js` 各一份。
- 點擊統一由 `[data-say]` 的 capture 監聽處理（不會觸發外層 `<summary>` 或行程列）。
- 會出現喇叭的地方：常用語句、放大畫面、行程地點（京阪 `m`、首爾 `kop` 韓文名、東京第 4 欄日文）、飯店當地名稱、美食／景點詳情標題（有當地名稱時）。過濾規則：日文要有假名或漢字、不含英文、不含「機場／航廈／淺／臺／灣」；韓文要有諺文。港珠澳沒設語言，不顯示。
- 東京飯店名稱是中文（`meta.single`），所以飯店不顯示喇叭；若要加，請在飯店資料補 `ja` 欄位。

## 美食兩層分頁
- 美食分頁名稱含「・」會自動分兩層（`明洞・早餐`、`明洞・其他` → 上層「明洞」、下層「早餐／其他」，下層是 `#fsub`）。行程用餐列的自動連結（`foodKey`／`goFood`）會切到正確的兩層。
- 常用語句、美食、備用景點清單可左右滑動切換分頁（`app.js` 的 `swipeTabs`／`tabMove`；美食先切下層再切上層）。
- 常用語句折疊：旅程 `meta.phrFold`＝數字，每個分類只先顯示前幾句，下方「看全部 N 句」展開（東京設 4）。

## 待確認（資料沿用舊估、尚未查證）
- **京阪 Day 2（9/10）、Day 4（9/12）的 `budget` 仍沿用舊數字沒重算**（Day 2 `[1600,2200]`、Day 4 `[1700,2100]`）。網頁註明「只算交通」，但數字沒有明細，無法判斷舊值含不含門票（如鞍馬寺愛山費 ¥500）。我自己粗估 Day 4 純交通約 ¥1,100～1,500，舊值可能偏高，但各段車資沒逐一查證，所以**沒有改**。要重算請先和使用者確認「budget 要不要含門票／早餐」。
  - 2026/11/23 已查到的車資／時間（ekitan、京阪官網）：淀屋橋 → 丹波橋 特急 40 分、¥480；淀屋橋 ⇄ 祇園四條 快速特急「洛楽」43 分、¥490（行程文字寫的「祇園四條 → 淀屋橋」因此成立）；伏見稻荷 → 丹波橋 普通 8 分。
  - 沒查到：祇園四條 → 伏見稻荷、伏見稻荷 → 淀屋橋的**單段車資**（京阪運賃表 PDF 讀不出文字、ekitan 站名 ID 不明）。
- 京阪 9/12 伏見稻荷：祇園四條 → 伏見稻荷普通車「約 10～20 分」仍是區間值（kyoto.travel 寫約 22 分、ekitan 普通車 9 分），沒再縮小。
- 京都飯店早餐（影響 9/12 06:20 退房）：已把 ikyu 頁面的資料寫進 9/12 行程說明——早餐平日 06:00～10:00、土日祝 06:00～10:30，大人 ¥2,000（**未稅**，頁面沒寫含稅價）。這是第三方訂房站資料，**未對照飯店官網**；待辦清單裡的「京都飯店早餐時間」仍留著，請使用者向飯店確認，特別是「含早餐方案」是否 06:00 就能入座。
- 貴船川床 2027 年營業日期**仍未公布**（watabi.org 2026/11/2 更新的文章也寫 2027 年各店尚未公布；2026 年多數店為 5/1～9/30）。2027 年春天後再查一次各店官網（ひろ文、ふじや、べにや等）。
- 首爾「廣藏市場」美食分頁 8 家：價格與營業時間多數來自 funliday 2026 整理（標「依來源」），僅富村生拌牛肉的地址與時段對照過米其林指南。**艾草姊妹糖餅營業時間 2026/11/23 又查過一次仍查不到**（韓文、中文各搜一次，找到的文章都沒寫）；trip.com 指南寫廣藏市場整體約 09:00～23:00、週日一般店休但美食區全年無休（該文日期標示不一致，僅供參考）。2/4（四）出發前請再確認。

## Workman 專區（東京，2026/11/22 新增；2026/11/23 檢查並擴充路線店家，sw v135）
- 2026/11/23 東京區塊檢查結果：四個方案（rv／car-k／car-y／tokyo）逐日展開皆無 JS 錯誤、無死連結、圖示檔都在；日期星期（7/2 五～7/7 三）與各方案住宿晚數正確。專區簡介原寫「官方列為免稅店」已改成「取自 FUN! JAPAN 名單、未逐店查證」。航班時刻（BR184／BR189）沒有查證，沿用使用者提供的資料。
- 做法：`trips/tokyo-2027.json` 的 `workman`（`routes[]` 路線＝`id/name/short/sub/color`；`groups[]` 用 `route` 指到路線；`stores[]` 欄位 `n/ja/type/acc/tip/q/lat/lon`，`rough:1`＝座標只是概略）＋ `nav`、`titles`。**Workman 在 `nav` 最後一個，頁面也就排在最後**（頁面順序跟 `nav`）。`tokyo.html` 有 `<section id="workman">`；`app.js` 在 `HT.apps` 那行後面渲染（依路線分區、編號連續、圖釘依路線上色、圖例按鈕可開關各路線並重新縮放；虛線邊圖釘＝概略位置）；樣式在 `style.css` 最後（`.wm*`）。整區與每個分區都是 `<details>` 預設折疊；地圖是 Leaflet 1.9.4（cdnjs）＋OpenStreetMap，**打開「看地圖」才載入**，沒網路顯示提示、用各店 Google 地圖按鈕。
- **2026/11/23 新增的路線店家（共 12 間＝東京 5＋以下 7）與來源**：
  - 輕井澤路線（方案一、二A，中部橫斷道經佐久）：佐久平 Colors、佐久岩村田 Plus（官網地址在中込）、佐久野沢、小諸 Plus。來源是 Workman 官網店舖清單（長野縣 20 市町村 29 間，2026/11/23 查看）；佐久 3 間的地址、營業時間 7:00／10:00～20:00、電話、停車位都來自官網。**官網清單裡沒有輕井澤町、御代田町，輕井澤本身沒有店**。小諸地址 `小諸市加増二丁目11-10` 取自 tiendeo 目錄頁，未對照官網。
  - 富士五湖路線：Workman Colors カインズ都留店（Fashionsnap 2025/2/28：2025/3/13 開幕、山梨縣第一間 Colors；**地址、營業時間沒查到**）、ワークマン 富士吉田松山店（只有 Tokubai 周邊店家列表的店名＋「離富士急ハイランド約 900 m」，**地址、營業時間、店型都沒查到**）。**大月市內沒查到店**。河口湖町也沒查到。
  - 橫濱路線：Workman Colors コレットマーレ桜木町店（原 #ワークマン女子 1 號店；Travel Watch 2020/10 寫地址桜木町 1-1-7；PR TIMES 2025/3/7 全面改裝重開）。營業時間沒查到。
- **座標**：官網只有佐久平店有經緯度（36.2715, 138.4626），其餘是憑記憶估的位置；佐久岩村田／野沢、小諸、富士吉田、都留標了 `rough:1`（可能差數公里，都留只標在市區），桜木町與東京 5 間是車站附近估算（誤差可能數百公尺）。導航請用各店的 Google 地圖按鈕。
- 要加店：在對應 `groups[].stores` 加一筆即可（編號、地圖圖釘自動算）；別的旅程要用，只要加 `workman` 資料、`nav` 與 HTML 的 `<section id="workman">`。
- **資料來源與未查證**：5 間店（ソラマチ、錦糸町 Arkakit、銀座イグジットメルサ、池袋サンシャイン Alpa、吉祥寺東急）取自 FUN! JAPAN 2026/7/16 文章「全國 14 間免稅店」名單（店型 Colors／女子也是照該文）。**沒有**逐店查證：地址、樓層、營業時間、電話。
  - 銀座店只查證了：地址銀座 5-7-10、イグジットメルサ 5 樓，2023/9/1 開幕為 Workman Colors 1 號店（Fashionsnap 2023/8/30、Travel Watch 2023/8/31 兩處一致）。**營業時間仍沒查到**；舊的 11:00～20:00 是改裝前資料，網頁已改成提醒出發前確認。其餘 4 間仍完全沒逐店查證。
  - Travel Watch 提到 Workman Colors 之後會在新宿、澀谷等地開店（未列地址），到 2027 年東京可能有更多 Colors，未查證。
- **地圖座標 `lat/lon` 是憑記憶估的車站附近位置（誤差可能數百公尺）**，只用來畫圖釘；導航請用各店的 Google 地圖按鈕（以店名搜尋）。
- 沒做到的「所有店家」：東京、橫濱、山梨的一般 Workman／Workman Plus（路邊店）沒有逐一列出，橫濱市只列了桜木町 1 間。**Workman 官網的山梨縣、神奈川縣、東京都店舖清單頁沒抓到**（見下方踩坑）；長野縣的清單抓到了。若要補，先用 WebSearch 找到官網該縣清單頁的網址，再用 WebFetch 抓；另外輕井澤⇄淺草回程（上信越道・關越道，群馬、埼玉）沿線完全沒查。
- 踩到的坑：沙盒連不到 cdnjs／OSM，也不能 `npm i leaflet`（本帳號 Bash 沒網路）。2026/11/23 地圖測試是用 Playwright `route` 攔截 leaflet.js、換成只記錄呼叫的假 `L`（驗證分層、圖例開關、`fitBounds` 邏輯），**沒有用真的 Leaflet 與圖磚測過**。`http.server` 在背景啟動後下一次指令會被收掉，要和測試放同一個指令裡。
- 查店家的坑：WebSearch 只回標題，要再 WebFetch 內文；WebFetch 只能抓「搜尋結果裡出現過」的網址（`workman.co.jp/store/area/200000` 與佐久平店頁可以，直接輸入 `area/190000`、`area/140000`、其他店頁會 `URL_NOT_ON_ALLOWLIST`）；國土地理院地址轉座標 API 也在白名單外。查店名時用「店名 - ワークマン公式サイト」這種標題格式最容易讓官網頁出現在搜尋結果。
- 未在實機確認：手機上的地圖手勢（單指拖曳會捲動頁面還是地圖）。

## 已知待辦／未解
- `jade19880309/travel-private` 的舊分支 `add-trip-web-links` 刪除失敗（連線中斷），不影響功能，可日後 `git push origin --delete add-trip-web-links`。（2026/11/24 的工作階段只掛了 travel-public，沒有 travel-private 的權限，所以沒動。）
- 京阪 9/11（嵐山・金閣寺，週六）未依人潮調整；若要調整可另議。
- 語音按鈕新版（v100）未在 iPhone 實機確認；使用者需完整關閉主畫面 App 後重開兩次才會換新版。

## 露營車（東京方案一，2026/11/25 改版）
- `campervan.html` 換成「路線更新版」（道之驛／SA 仮眠、7/4 橫濱膠囊旅館；日期星期與里程加總已核對）；`trips/tokyo-2027.json` 方案一（`plans[rv]` 與頂層 `days`／`hotels` 兩份要同步）、`todo`、開車須知已同步改成同一套安排。
- **未查證**：各道之驛／SA 現在能不能仮眠（來自業者回覆）、兩台大車的車位、HESTA 價格（2026/4 資料）。里程與時間是粗估，**清里 → 河口湖估得偏低**（實際可能約 125～135 km、2～2.5 小時），尚未用地圖實測。
- Day 1 候選的佐久南、雷電くるみの里在輕井澤更遠處，睡那邊 7/3 要折返；已在方案內註明，尚未決定要不要刪。
- Workman 路線的說明文字（`workman.routes`）仍寫「富士五湖 → 中部橫斷道 → 輕井澤」，與新路線方向相反，尚未調整。
- 御殿場蒸餾所（7/4 選項，2026/11/25 加進東京頁方案一 7/4 的行程、`x` 區塊與 `todo`，兩份 `days` 都有改）：資料只來自 gojapan.com.tw 2026/10 的文章，**沒對照麒麟官網**。未查證：導覽場次時間（文章沒寫）、7/4 場次是否 6/1 08:00 JST 開放（文章寫「參觀月前 1 個月的 1 日 08:00」，這是文章的規則、2027 年可能變）、小孩能否參加（文章兩處寫法矛盾：500 圓導覽寫 20 歲以上，FAQ 寫未滿 20 歲免費）、兩台露營車停車。露營車頁 `campervan.html` 原本就有這段，內容與文章一致，但「未滿 20 歲免費」那句同樣沒確認。

## 公開首頁 `home.html`「家庭旅行手帖」v3 整合紀錄（2026/11/26，使用者提供 `family-journal-final.zip`、`family-journal-v3.zip` 與一張範例稿）
**使用者要求**：美編素材與 CSS 都由使用者提供，不得自行重畫、替換圖片或簡化版面；保留首爾／港珠澳／東京三大旅程，露營車為東京子項目，京阪不列入總覽；DETOUR（`stob/`）、各旅程內頁、`trips/` 資料不得修改；保留倒數、離線、檢查更新；先備份舊首頁；手機與電腦都要實測。

**已完成並推送到 `main`（`65f8dd5`、`4f3be8c`、`c689d72`）**
- 備份：`backups/home-before-journal-20261126.html`（final 版整合前）、`backups/home-before-v3-20261126.html`（v3 整合前）。
- 現行檔案：`home.html`、`journal-v3.css`（使用者提供，未改）、`journal-v3b.css`（我加的疊加層）、`images/journal-v3/`（使用者提供 7 張 webp + 我裁的 7 張 `deco-*.png`）。`home-journal.css` 與 `images/home-journal/` 是上一版（final）遺留，`sw.js` 仍在快取。
- `home.html` 相對於包內版本**刻意補回**的原有功能（包內版缺少）：OG／Twitter／apple-touch metadata、`theme-color:#14110f`、倒數的 `cdStart/cdEnd` 邏輯、頁尾「離線查看」字樣、`sw.js` 註冊與 `upd.js`（檢查更新）。之後再換新包，這幾項要再補一次。
- 倒數資料來自 `trips/index.json`（fetch 失敗時用 `fallback` 陣列，離線也能顯示三張卡）。
- `journal-v3b.css`：依範例稿加景點剪影（`.sil`）、雪花（`.snow`）、行事曆圖示（`.cal`）、英文名同行、露營車按鈕放大。`deco-*.png` 是從範例稿用「飽和度去背」裁出，不是重畫；`.sil`／`.snow` 放在 `.entry-main` 的 `<a>` 內、`position:absolute`、`pointer-events:none`。
- 桌機版 `.entry-main` 是 `1fr 30px` 單欄、`.stamp` 滿寬在上，剪影靠右下；手機版 40% 圖 + 資訊欄，剪影與倒數標籤同一排。
- 實測（本機 `http.server` + Playwright）：320／390／768／1440 無水平溢出、圖片無 404、連結為 `./?t=seoul-2027`、`hk.html`、`tokyo.html`、`campervan.html`；檢查更新按鈕與離線重新整理正常。

**與範例稿仍有的落差（缺素材，使用者未提供，不要自行重畫）**
- 桌機版頁首左半是純深藍底（`hero.webp` 只有 434×270）；範例是滿版插畫（樹葉、露營車、人物）。需要無文字的滿版頁首圖。
- 範例的毛筆標題、手寫字體、迴紋針、不同顏色紙膠帶未做（沒有素材／字體檔）。目前英文名用 `'Snell Roundhand','Segoe Script','Apple Chancery',Georgia`。

**未驗證**
- GitHub Pages 線上畫面與 `sw.js` 線上版本（沙盒連不到 github.io）；iPhone 實機 PWA 更新流程。

**與上一節「五張行程插畫 Icon」的關係**：v3 首頁入口圖用的是 `images/journal-v3/*.webp`（使用者提供的另一套裁切圖），**不是** `images/home-journal/*.png` 的原 PNG。那一節的三選一仍待使用者決定；在使用者回覆前不要把 v3 入口圖換成 PNG。

**踩到的坑**
- 推送前必須 `git fetch`：這次 `sw.js` 與別的工作階段同時改（對方升 `VERSION` 並加了港珠澳圖）。處理方式是以 `origin/main` 的 `sw.js` 為底，再只加首頁資源並把 `VERSION` 再加 1，沒有覆蓋對方內容。
- v3 包的 `.hero`／`.footer-art` 在 final 包時曾有 `max-height` 裁切導致文字被切；v3 已不是這寫法，但再換新包時要檢查標題與木牌有沒有被裁。
- 範例稿的剪影旁邊有箭頭按鈕與文字殘影，去背時要用 `erase` 區塊遮掉，否則會帶出殘字（如 "Macau"）。
