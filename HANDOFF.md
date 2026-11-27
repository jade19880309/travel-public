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

## 電腦版加寬＋手機重疊修正（2026/11/27，sw v210）
- **新檔**：`layout-fix.css`（總覽、首爾、港珠澳、東京、露營車在 `</head>` 前載入，放在各頁樣式最後）、`tools-menu.js`（只有首爾 `index.html`、港珠澳 `hk.html`，在 `upd.js` 前）。兩檔已加進 `sw.js` CORE。京阪 `keihan.html` 本來就 1160px，沒套 `layout-fix.css`。
- **電腦版（≥1200px）**：總覽 1240、首爾 1320、港珠澳／東京 1280、露營車 1180（都再用 `calc(100vw - 48px)` 留邊）。港珠澳／東京每日行程、露營車 DAY 卡改兩欄；東京住宿卡兩欄、常用日語三欄、封面改「左圖右（快捷鍵＋倒數）」兩欄；首爾常用韓語四欄。頁面用 `:has()` 辨識（iOS 16.4+）；東京封面選擇器要用 `html.fj2.th-fuji.forest-journal` 開頭才蓋得過 `theme-forest-v2.css`。
- **手機**：首爾／港珠澳右側三顆懸浮鈕收進「工具」鈕（同東京 `forest-v2.js` 的做法，外觀複製 `#fs`；`#fxb` 是 app.js 晚產生，腳本會等最多 4 秒）。總覽地標線稿在 <760px 淡成 .32、`.info` 右側留 40px＋`text-wrap:balance`。京阪住宿卡郵戳 `.pm` 移到郵票左下（`theme-kyoto-classic.css` 最後一行）。
- 已測：Chrome 模擬 390／820／1280／1440／1920，六頁無 pageerror、無橫向溢出，工具鈕開合正常。**未測**：iPhone Safari、iPad 實機。

## 京阪「京都、慢日子。」V2 首頁還原暨品質改善（2026/11/26，sw v179；依使用者 `kyoto-v2-handoff.zip` 的 CLAUDE-KYOTO-V2.md）
- **範圍**：`keihan.html`、`theme-kyoto-classic.css`（整份重寫成 V2）、新增 `images/keihan-2027/v2/`（15 張 JPEG）、`images/keihan-2027/classic/hero.png`（診斷用）、新增 `kyoto-diag.html`、`sw.js`（v179＋CORE＋activate）、`upd.js`（一行版本判斷）。`trips/`、`home.html`、`detour/`、其他旅程頁都沒改；京阪仍不在公開總覽。
- **回復方式**：①只要舊版樣式：`keihan.html?theme=classic`（`?theme=kyoto` 改回，存 localStorage `kyotoTheme`；**2027/10/01 再評估要不要移除舊版**）。②整個退回 V1：還原點分支 `backup/keihan-before-kyoto-v2`（commit `ed6dc8b`，已推送）；V1 以前的原版另有 `backup/keihan-before-kyoto-classic`、`backups/keihan-before-kyoto-classic-20261126.html`。退回後 `sw.js` 的 VERSION 要再加 1。
- **做法重點**
  - 主題規則全部 `html.kyoto-theme` 開頭；新元件都帶 `.kc`，經典版 `html:not(.kyoto-theme) .kc{display:none!important}`。
  - 手機首頁：頁首單列 58px（品牌、集章、選單）；主視覺 340–400px，`classic/hero.jpg`（678px，比 V2 包的 487px 清楚，所以保留）以 `object-fit:cover` 鋪滿，標題、日期、印章、標語是 HTML 文字疊在圖上，用徑向漸層（左上）和底部短漸層融合；統計緊接主視覺；快捷 4 欄（<360px 時 2×2）；下方山水＋抹茶收尾。
  - 標題字體 Yuji Syuku（Google Fonts，只下載「京都、慢日子。」7 個字的子集），備援 LXGW WenKai TC／標楷體／Noto Serif TC。
  - 主題下由頁尾輔助 script 把 `#qb`（原快捷選單）搬到頁首當「選單」、把 `#dch`（日期列）搬到每日行程區並 sticky；id 不變，原本的程式照常運作。經典版位置不變。
  - 底部導覽改成貼底 58px＋`env(safe-area-inset-bottom)`：行程／航班／首頁（`.kc-home`，回封面，用 button 以免影響原本 `#bar a` 的捲動高亮）／住宿／道具；平板以上回到置中浮動列。集章在頁首、檢查更新移進選單（`.kc-qupd`，顯示目前快取版本）；原本右下角的更新鈕在主題中隱藏。
  - 每日卡（依 JSON，不改資料）：9/9 京都塔、9/10 鞍馬寺（當日明信片：貴船神社）、9/11 嵐山竹林（明信片：金閣寺）、9/12 清水寺（明信片：伏見稻荷）、9/13 飛機。住宿郵票：京都塔、大阪城。`shinsekai`、`sagano-train`、`stone-lantern` 有放在補充包裡但行程沒對應或用不到，`sagano-train`、`shinsekai` 沒有複製進 repo。V1 的 122–158% 放大已移除，改 `background-size:cover`（效果等同 object-fit:cover）。
  - 響應式：≤767 單欄橫式卡；768–1199 兩欄、最後一張滿寬（2+2+1）；≥1200 五欄。電腦版 ≥1024 文字左、插畫右，左上風鈴、左下山水、統計壓在主視覺下緣、快捷旁抹茶。
  - 和紙底紋用 `v2/washi.jpg`（疊 86% 米白），青海波用 `v2/seigaiha.jpg`。
- **PWA**
  - `keihan.html` 新增一段 script：SW 接管（controllerchange）時只重載一次；第一次安裝不重載；輸入框有內容時延後到離開輸入框或切到背景；sessionStorage `kh27-swreload` 20 秒內不重複；回到前景時呼叫 `registration.update()`。
  - `sw.js` activate：新版快取 CORE 全部到齊才刪舊快取，否則保留舊快取當離線備援（install／fetch 策略沒改，skipWaiting＋clients.claim 原本就有）。CORE 每個檔案都確認存在（有缺檔會讓舊快取一直留著）。
  - `upd.js`：若已有 `trip-<網站版本>` 快取就判定為最新（以前只看第一個 trip- 快取，保留舊快取時會誤判）。
  - `kyoto-diag.html`（noindex，已加進快取）：同一張主視覺 JPEG／PNG／WebP 的直接下載（狀態、Content-Type、大小）、快取有無、decode、快取內容 decode、SW 註冊／控制、sw.js 版本、快取名稱、主畫面模式、安全區數值，可「複製報告」。PNG 872KB 沒放進預先快取。
- **測試（本機 PowerShell HttpListener＋headless Edge 158，用 DevTools Protocol 驅動；這台沒有 Playwright／Node／Python）**
  - 375／390／768／1024／1200／1440：無橫向捲動、無破圖、頁首 58px、底部導覽 58px、主視覺 368／382／430／560px、標題 40／41／54／58–86px；全頁截圖並與定稿並排比對（截圖在工作階段暫存，未放進 repo）。
  - 功能：日卡、日期列、上下一天、HARUKA/JR 選項（預算同步）、蓋章與歸零、選單開關、夜間、字級、旅費入口切分頁、日圓換算、待辦勾選（localStorage）、首頁鈕、住宿 6 顆按鈕、2 張航班卡，全部正常；`?theme=classic`、`?theme=kyoto` 正常，經典版日期列與快捷鈕回到原位。
  - 離線（`Network.emulateNetworkConditions offline`，頁面已受 SW 控制，`trip-v175`）：京阪頁重新整理後 5 張日卡圖、主視覺、JSON、換日期都正常、顯示離線提示；首頁、首爾、港珠澳、東京、露營車離線導航也正常、無破圖。
  - 更新：暫時把 sw.js 改成 v175test1 → 頁面只重載一次、之後穩定、舊快取已清；v175test2＋輸入框有字 → 10 秒內不重載、離開輸入框後重載；清空後首次安裝 → 取得控制且不重載。測完已改回 v175。
  - 診斷頁：JPEG／PNG／WebP 直接與快取 decode 都成功（Edge）。
- 測試大多在合併前的 v175 完成；推送前其他工作階段把 sw.js 升到 v178，已以遠端版本為底重新套用京阪的 CORE 與 activate 改動成 v179，並重跑功能、離線重載、各旅程離線導航（通過，`trip-v179` 228 項）。更新接管（重載一次／延後／首次不重載）的測試是在 v175 做的，邏輯沒變但未在 v179 重測。
- 2026/11/26 部署後線上（GitHub Pages，headless Edge）：390px 無溢出、無破圖、Yuji Syuku 載入；首次造訪 SW 背景安裝、不重載，重新整理後受控（`trip-v179`）；**線上離線重新整理通過**（5 張日卡圖、主視覺、JSON、換日期）；`kyoto-diag.html` 線上報告正常（JPEG／PNG／WebP 解碼都成功，PNG 不在預先快取）。
- **主畫面圖示（2026/11/26，sw v191）**：舊的紫色「京阪」圖示換成 `icon-keihan-v2-180/192/512.png`，由 `classic/hero.jpg` 正方形裁切（x 78、455×455，和服雙人背影＋五重塔），不是重畫；maskable 與 512 共用同一檔。`manifest-keihan-2027.webmanifest` 的 theme_color 改苔綠 `#414a36`、background_color 改米白 `#f4eddf`；`keihan.html` 的 apple-touch-icon／icon 與 `sw.js` CORE 已改用新檔名（換檔名避免 iOS／Android 沿用舊圖快取）。舊的 `icon-keihan-*.png` 保留在 repo 沒刪（沒有其他頁引用）。**已加到主畫面的 App 不會自動換圖示，要刪掉重新「加入主畫面」**；iPhone 實機顯示未驗證。
- **未驗證（需使用者）**：iPhone Safari 與主畫面 App 實機（瀏海、底部安全區、Yuji Syuku 在 iOS 的載入、之前 WebP 破圖的真正原因——請在 iPhone 開 `kyoto-diag.html` 複製報告）；GitHub Pages 線上的更新接管流程只做了部署後檢查（見下一點），沒有在線上模擬兩次版本更新。
- **與定稿仍有的落差（缺素材，未自行重畫）**：楓葉、秋葉角落裝飾、日卡撕紙邊、卡片內小插圖（人力車、章魚燒）、標題旁朱色筆刷圈、「查看完整行程」按鈕（單頁版沒有獨立行程頁，加了等於無作用按鈕）；日卡項目列是 JSON 的路線文字，不是定稿的三點條列；統計是 4 格（京都 3 晚／大阪 1 晚分開，依資料）。

## 主畫面圖示更新：首爾、港珠澳、東京（2026/11/26，sw v192；使用者指示「三個都換」）
- 舊的 11/20 宣紙水墨字樣圖示（`icon-*.png`、`icon-hk-*.png`、`icon-tokyo-*.png`）換成各自改版主視覺的正方形裁切，不是重畫：
  - 首爾 `icon-v2-180/192/512.png` ← `images/seoul-2027/decor/hero-winter.jpg`（x 560、941×941：雪中韓屋巷弄＋南山塔）
  - 港珠澳 `icon-hk-v2-180/192/512.png` ← `images/hk-2027/retro/hero-m.webp`（x 54、500×500：香港霓虹招牌、叮叮車、「港珠澳」題字、維港夜景）。原圖是寬幅海報，正方形裁切時左側霓虹框、上方英文副標與「三城一程・4天3夜」標籤會被切到一點，這是取捨。
  - 東京 `icon-tokyo-v2-180/192/512.png` ← `images/forest-journal-v2/tokyo-hero.webp`（x 600、941×941：淺草雷門＋晴空塔；這張沒有吉卜力角色，只有一般路人）
- 三個 manifest 的 maskable 改指向同一張 512（不另存一份）；theme_color／background_color **沒改**。`index.html`（id ti/fi，沒有程式在用）、`hk.html`、`tokyo.html` 的 apple-touch-icon／icon 與 `sw.js` CORE 已改新檔名。舊檔保留在 repo。
- 現況：首頁（11/26 皮革手帳版）、京阪（V2）、首爾、港珠澳、東京都已是新版；**露營車 `campervan.html` 沒有 manifest 和圖示**（使用者這次沒要求，未處理）；偏航 `detour/` 動態圖示不動。
- 已加到主畫面的 App 要刪掉重加才會換圖示；iPhone 實機顯示未驗證。
## 首爾 V3 底色（2026/11/26，sw v208）
- 使用者要求底色偏白、接近概念圖。概念圖取色約 #fdf4ee～#fff6ee（暖白帶淡粉）。頁面底色改 #fdf8f3＋三處極淡粉色 radial 水彩暈；黏頂功能列與底部日期列同色。

## 首爾 V3 文字質感重排（2026/11/26，sw v207）
- 使用者回饋：粗體沒有質感，間距改回適當。`seoul-v3-site.css` 最後「文字質感重排」區塊：內文 400、標籤 500，標題、日期、時間、飯店英文名改 Noto Serif TC 600（已載入），不再大量 700／800；行距 1.55、紙卡內距 9～10×12～13、區塊間距 12～14px。390px 全頁 5426px（v201 原版 6243、v202 緊湊 5087）。觸控目標仍 ≥44px，天氣卡連網三種字級不重疊。

## 登機證航程圖示（2026/11/26，sw v206）
- 使用者 iPhone 截圖：中間飛機壓到「2 小時 40 分」。原因：theme-han.css 的 `.fl .mid::after` 飛機動畫＋V3 的手繪 plane.png 背景兩架疊在一起，間距不足。改成只留手繪飛機（`::after` 改為右半段虛線），虛線在飛機兩側斷開，時間在飛機下方；機型前 style.css 的「✈」字元（iPhone 顯示成彩色表情）在 V3 隱藏。

## 開啟速度修正（2026/11/26，sw v205）
- 使用者回報 iPhone「還是打不太開、耗太多時間」。量測：離線快取 CORE 297 檔約 **30MB**；v204 以前 install 用 `cache:'reload'` 每次強制全部重抓，且 297 個請求同時發出。當天連續更新 v199～v204，iPhone 每次開頁都在背景重下載 30MB、搶走頁面頻寬。
- `sw.js` install 改為：`cache:'no-cache'`（以 ETag 向伺服器確認，沒變的檔案用瀏覽器 HTTP 快取，不重新下載）；**同時最多 3 個請求**，首爾頁相關檔案排最前。fetch／activate 邏輯不變。
- `index.html` 載入器：首爾手帳版（非 classic）在記憶體裡把 `TRIP.hero.img` 先換成 `decor/hero-winter-m.jpg`，不再先下載 347KB 的舊封面 `hero-snow.jpg` 再被換掉（`trips/seoul-2027.json` 沒改）。
- `decor/bokjumeoni.png` 224→42KB、`plum-branch.png` 151→22KB（256 色量化；首屏與 V2 共用）。
- **之後盡量合併修改再升一次版號**，減少使用者端重新驗證整包快取的次數。

## 首爾 V3 天氣卡重疊修正（2026/11/26，sw v204）
- 使用者 iPhone（大字體）截圖：天氣面板疊在「目前當地天氣」標題上。原因：v202 緊湊版把 `#wx.quick3` 設成左右 flex，離線時只有一行文字看不出來，連網後 app.js 會換成「`.wxh` 標題列＋`.wxg` 天氣面板」兩塊而並排重疊（雪花小圖示也會被 innerHTML 蓋掉）。
- 改成 block 上下排列，標題列左右對齊；離線只剩一行時允許換行。倒數卡韓文祝福語在大字體時維持一行（`calc(14px / var(--z))`）。
- 測試：Playwright 攔截 open-meteo 回傳模擬天氣，字級 1／1.15／1.3 都檢查標題列與面板不重疊、無溢出；功能 25 項通過。**以後改天氣卡要用模擬資料測連網狀態。**

## 首爾 V3 每日卡節日標籤位置（2026/11/26，sw v203）
- 使用者 iPhone 截圖：右欄的節日標籤（韓國春節前夕／台灣除夕）一個一行把卡片撐高，左欄插畫下方留白（手機開了大字體更明顯）。
- 改法：`seoul-winter.js` 把 `.tg` 移到左欄 `.dl3`（插畫正下方，靠左一列、不夠寬才換行、不截字）；右欄只留標題與三項摘要。字體鍵放大（`--z` 1.15／1.3）時 Day 標籤與日期用 `calc(… / var(--z))` 維持原大小，避免頂到右欄標題，行程文字照常放大。
- 已用 Chromium 測三種字級（1／1.15／1.3）：無溢出、標籤完整顯示；功能 25 項通過。

## 首爾 V3 緊湊版文字排版（2026/11/26，sw v202）
- 使用者要求文字排版更緊湊。只改 `seoul-v3-site.css` 最後的「緊湊版」區塊（手機 ≤759px），電腦版不變；390px 全頁 6243px → 5108px（約 -18%）。
- 內容：內文 14.5px／行距 1.4；紙卡內距 8×11px、區塊間距 8px、標題筆刷 18px；倒數卡改成「祝福語＋新年快樂」在左、「看每日行程」在右同一列；日期卡天數標籤與日期同列；天氣一行；登機證機型與艙等合併一行（取消 theme-han 在 small 上的打孔圓點）、字級縮小；住宿兩顆地圖鍵並排；每日卡摘要 13px、圖示 18px、節日標籤 10.5px；韓語、美食、價格、注意、待辦的卡片內距與間距收緊（摺疊箭頭位置同步調整）；頁尾 176px。
- 觸控目標維持 ≥44px（功能測試檢查通過）。

## 首爾 V3.1 補充素材（2026/11/26，sw v201，使用者提供 seoul-winter-v3.1.zip）
- 包內 10 張 RGBA PNG（README 註明：由新生成總圖裁切、去背後放大到指定尺寸，非原生 1800px 原畫）。合併到 `images/seoul-2027/v3/`，網頁版縮小並量化為 256 色（10 張原約 12MB → 約 0.9MB）：scene-1～6 1800×540→900×270、snowman 800→320、flag／camera 600×450→280×210、food-spread 1600×600→1000×375。原尺寸檔不放 repo（在 zip 內）。
- 每日插畫依正式日期：2/3 scene-1 飛機、2/4 scene-2 明洞＋南山塔、2/5 scene-3 雪橇、2/6 scene-4 景福宮、2/7 scene-5 韓屋與溪流（新版符合行程，**不再用 v199 代用的 scene-5-hanok.png，已刪除**）、2/8 scene-6 機場。舊 scene-*.webp 已刪除，引用全部是 PNG。
- 手機 1.9:1 裁切逐張對準主體：`seoul-winter.js` 的 `SPOS`＝44%／46%／30%／66%／50%／42%（飛機、街景、雪橇孩童、宮殿、溪橋、登機口＋飛機）；≥1100px 三欄用原比例不裁切。插畫不加圓角、陰影、白框，保留手撕邊與透明背景。
- 新裝飾：`flag.png` 封面書法標題右側（手機 50px、標題縮為 68%）；`camera.png` 每日行程標題旁 58px；頁尾左 `food-spread.png`（64%）、右 `snowman.png`（34%），取代 v199 的 decor 小吃與天際線。
- 順手修正：電腦版封面圖寬度被舊規則限制在 820px（封面框 1076px），改為滿版。
- 測試：375／390／768／1440 無溢出、無錯誤、無破圖；功能 25 項通過；SW v201 快取 297 檔，斷網重新整理 V3.1 新圖全部顯示。**未測**：iPhone 實機。

## 首爾 V3 iPhone 修正（2026/11/26，sw v200）
- 使用者回報 iPhone 讀不到（v199 上線後）。GitHub Pages 部署成功（run #208）；雲端環境連不到 github.io，也沒有 WebKit 可測，以下是依程式碼判斷的原因與修正；**使用者已在 iPhone 實機確認 v200 可正常開啟**。
- 原因（推測）：v199 的 `.paper3`／`.sheet3`／展開日卡都用兩層 `filter:drop-shadow`，iOS Safari 會替每個元素開獨立合成圖層；高的卡片（展開日卡約 1000px、美食、價格區塊）一多就記憶體不足，分頁出現「重複發生問題」並不斷重新載入，或卡片整塊空白。
- 修正：新增 `v3/paper-s.png`（paper.png 外加 10px 柔和陰影，烘進圖片），紙卡改用 `border-image: url(paper-s.png) 34 fill / 17px / 0 stretch` 九宮格繪製，四角與手撕邊不隨卡片高度變形；拿掉紙卡、紙卡區塊、展開日卡、福袋的 filter（展開日卡改為標題變主色）。只剩封面書法標題一個小 filter。
- 測試：Chromium 375／390／768／1440 無溢出、無錯誤；功能 25 項通過。**之後若再加卡片陰影，不要用 filter，用 paper-s.png。**

## 首爾 V3.0 韓系新春水彩手帳（2026/11/26，sw v199，使用者提供 seoul-winter-v3.zip；目前預設版面）
- 使用者指示：停止沿用 V2.1 版型，改以 V3.0 為基準；依序讀 `V3-CLAUDE.md`、`V3-design-reference.webp`、`reference-v3.html`、`seoul-v3.css`、`images/seoul-2027/v3/`。不得重畫或簡化美術元件；每日卡依新版 HTML 結構重建視覺層；設計稿的航班、日期、行程文字、人數只是排版示意，**沒有寫進網站**。zip 的 decor 31 張與 `seoul-v2.css` 與 repo 相同；參考圖、參考 HTML、`seoul-v3.css` 原檔**不放進 repo**（數值已照搬進 `seoul-v3-site.css`）。
- 檔案：
  - `seoul-winter.js`：**V3 版面**（只搬動／包裝 app.js 畫好的元素並插入 V3 素材，不改資料、id、事件）。`<html>` 加 `sv3`、`<body>` 加 `seoul-v3`；**不再加 `sw`／`sv2`**，所以 theme-han.css 舊「Seoul Winter」區塊與 seoul-v2*.css 都不作用。
  - `seoul-v3-site.css`（新檔，全部 `html.th-han.sv3` 開頭）：`seoul-v3.css` 的數值改成正式頁 scope；沒有直接載入 `seoul-v3.css`，因為它的 `.seoul-v3 h2,h3,p{margin:0}`、`.seoul-v3 *` 等通用規則會打亂內頁。`index.html` 只多一行 link。
  - `seoul-winter-v2.js`：V2.1（v198）備份，原 `seoul-winter.js` 改名（git mv）。網址 `?theme=v2` 時由 `seoul-winter.js` 載入；`seoul-v2.css`／`seoul-v2-site.css` 仍保留供備份使用。
  - 切換：`?theme=classic` 原始版、`?theme=v2` V2.1、`?theme=v3`（舊連結 `?theme=winter` 也算）V3；存 localStorage `seoulTheme`。
- 版面（手機 390px 基準，照 V3-CLAUDE.md）：背景 #F8F5EF、卡片 paper.png（手撕紙，100% 100%）＋輕薄 drop-shadow、左右 8px、卡片間距 6px。封面＝hero-winter 全景＋`title.png`（alt「首爾 서울 Seoul」，取代明體 h1），**不加霧化遮罩**（只給標題白色光暈 drop-shadow）；下方玫瑰色帶＝JSON 標題、英文 eyebrow。功能列 `nav3` 用手繪圖示，疊在封面下緣、捲動後黏頂。倒數 `count3`（29% 福袋＋倒數＋新年祝福＋看每日行程）、日期 `info3`（景福宮去背，只放日期與出發地，JSON 沒有人數）、天氣 `quick3`。換算／字體／更新維持右側懸浮鈕（使用者先前指定）。
- **每日卡 `day3`**（依 reference-v3.html）：在原本的 `button.dr` 內插入 `.dl3`（Day 水彩標籤 badge-N＋日期同列、下方 scene 插畫 aspect 1.9）與 `.dr3r`（當日標題＋三項摘要），原本的 `b`／`.ds` 隱藏、`.tg` 節日標籤移到右欄底部。左欄 46%、圖示 21px、文字 14px、自然換行不截斷。按鈕本身沒換，所以點擊展開、鍵盤 Enter、底部日期列都照舊（app.js render 只重畫 `.dp`）。電腦 ≥760px 兩欄、≥1100px 三欄（設計稿樣式：插畫在上、標題置中）。
  - 摘要＝JSON `i`（二選一取 `A`）前三個非「早餐／午餐／晚餐」項目，去掉 `💰 參考價` 連結與表情符號。圖示依文字判斷（`pickIc`）：機場／KE／報到→plane、飯店／入住／退房→bed、行李→luggage、醫美→medical、玩雪／Vivaldi→ski、宮→palace、韓屋／北村／仁寺洞／博物館→hanok、購物／明洞→shopping、餐／市場→food、地鐵／AREX→train、其他→map。
  - 插畫依正式行程：2/3 scene-1 飛機、2/4 scene-2 明洞、2/5 scene-3 玩雪、2/6 scene-4 景福宮、**2/7 scene-5 是南山塔＋摩天輪（行程沒有樂園）→ 依指示改用 decor 原圖 `hanok-street.jpg` 裁成同比例並套 scene-5 的手撕邊遮罩（`v3/scene-5-hanok.png`）**、2/8 scene-6 機場。
- 素材處理（未重畫）：12 個圖示去掉圖邊的鄰圖碎片（bed、hanok、medical、palace、train）；scene-1～6 WebP 另存同尺寸 PNG（網頁用 PNG，WebP 原檔保留）；badge 縮到 320×94、title／paper／scene-5-hanok 量化為 256 色 PNG。
- **素材使用對照表（v199）**

| 素材 | 位置 | 尺寸／裁切 |
|---|---|---|
| v3/title.png | 封面書法標題 `h1.t3 img` | 寬 75%（≥1100px 44%），max 440px |
| decor/hero-winter.jpg（-m.jpg） | 封面背景 `<img>` | cover，object-position 40% 70%，手機 ≥290px、平板 360、電腦 400 |
| v3/paper.png | 所有 `paper3` 卡片、下半部 `sheet3` | center/100% 100% |
| v3/badge-1～6.png | Day 1～6 標籤（HTML 疊字 Day N） | 100% 100%，字 23px Georgia 斜體 |
| v3/scene-1～4、6.png、scene-5-hanok.png | 每日卡插畫 | 手機 aspect 1.9 cover；≥1100px 原比例 |
| v3/plane map bed hanok food shopping snow luggage train | 功能列（航班 行程 住宿 韓語 美食 價格 注意 待辦 App）、區塊標題圓章、日期列「總覽」 | 30×24／30×30 |
| v3/medical ski palace（＋上列） | 每日卡摘要圖示 | 21×21 |
| v3/plane.png | 登機證票頭（反白）、中間航程圖示 | 22px／34px |
| decor/bokjumeoni.png | 倒數卡左欄 29% | 轉 -5° |
| decor/plum-branch.png | 倒數卡左上、住宿卡右上、頁尾左上 | 76～86px |
| decor/palace-cut.png | 日期卡右下 | 32%，max 180px |
| decor/street-food-cut.png、seoul-skyline-cut.png | 頁尾左／右 | 50%／54%（電腦 36%） |
| decor/brush-rose/blue/green/gold/violet.png | 區塊標題 `section3` | 100% 100% |
| images/seoul-2027/hotel-2.jpg | 住宿照片 | 40% 欄寬、4:5 |

- 測試（雲端 session：python http.server＋Playwright Chromium）：375／390／768／1440 全頁截圖無橫向溢出、無 pageerror、無 4xx、無破圖（唯一空 src 是原本就有的燈箱 `#lb img`）；390 與 V3 設計稿並排比對（首屏、Day 卡）。功能 25 項通過：倒數、點日卡展開、鍵盤 Enter 展開、日期列 D4、總覽、功能列跳住宿、換算、字體（main zoom）、待辦勾選、韓語分頁、住宿展開、價格卡高度跟隨、主要按鈕 ≥44px、每日卡摘要三項且不截斷、`?theme=v2`／`classic`／`v3`、hk／tokyo／keihan／campervan／home／detour 載入。SW v199 快取 293 檔，斷網重新整理仍是 V3、V3 圖全部顯示。**未測**：iPhone 實機、GitHub Pages 線上。
- V3 未還原（素材／資料限制）：設計稿的國旗、雪人、相機、飯店霓虹招牌照片（無獨立素材，不自行繪製；飯店照片用正式網站的 hotel-2.jpg）；「旅遊成員 9 人（6 大 3 小）」（JSON 無人數）；設計稿的行程文字與航班時間（示意，用正式資料）；scene 插畫只有約 300×90，電腦三欄放大偏糊、手機 1.9 比例會裁掉左右手撕邊（需要高解析原稿，建議每張 ≥ 900×270）。設計稿的功能列有「首頁／地圖／更多」，正式頁沿用原本 9 個功能連結。

## 首爾 V2.1 韓系新春水彩手帳（2026/11/26，sw v193～v198；V3 起改為備份 `?theme=v2`）
- **2026/11/26 手機調整（sw v195）**：①手機整頁比螢幕寬 7px（可左右晃、整頁被縮小）：style.css 的 `.tabs`／`.swipe` 用 -16px 滿版，但 V2 頁面左右留白是 9px（手機）／12px，改用 `--gut` 對齊，320／375／390／430 皆無橫向溢出。②換算／字體／更新**改回右側懸浮鈕**（使用者指定方便使用），只換成韓紙圓鈕外觀；天氣卡改整列。③每日卡手機收合時只顯示標題＋標籤（路線小字展開後才顯示）；有一天展開時改單欄清單，其他天變左圖右文小卡，不留空洞。④底部日期列總覽＋D1～D6 在 375px 一排放得下（320px 才橫滑）。⑤倒數梅枝縮小、320px 倒數標題改 14px 不斷行；住宿卡南山塔縮小；喇叭鍵去掉 seoul-v2.css 通用 button 的框；價格、待辦等其餘卡片也套韓紙紋理。下方「原本右下角三顆懸浮鈕搬進天氣旁的工具列」一段已作廢。
- **2026/11/26 熱鬧版／Design-to-Code 調整（sw v197）**：使用者回饋「整體空蕩、跟示意圖差太多」並要求以 390px 為基準高還原。重新解壓 zip 逐檔比對：31 張 decor 與 repo 完全相同、全部都有被頁面引用。手機左右留白改 12px、區塊間距 16px、卡片間距 10px；封面手機 320px 滿版；**手機每日卡改成示意圖的「左圖右文」摘要卡**（插畫約 36% 寬、Day 水彩筆刷＋日期、JSON 標題、當日前三個行程點〔取自 `i`／二選一取 `A`，略過單純「早餐／午餐／晚餐」〕），點開後下方展開完整行程；電腦版維持三欄。下半部（韓語、美食、價格、待辦、注意、App）做成韓紙紙卡＋角落貼紙；頁尾上方加冬日小吃貼紙列；電腦版兩側固定梅枝與雪花（≥1180px）。`new-year.webp` 另轉 `new-year.jpg`（同尺寸 506×500）。白底插畫在卡片內用 multiply 融入；在頁面底上 multiply 無效，改用 radial mask 淡出邊緣。
- **2026/11/26 Design-to-Code 重構（sw v198，取代上面 v197 的版面與對照表）**：使用者對美編仍不滿意，要求把設計稿當規格、逐區高還原（不是風格參考），允許重建首爾專屬視覺 DOM。zip 由使用者在雲端 session 重新上傳並解壓：31 張 decor 與 `seoul-v2.css` 和 repo 逐檔相同；`reference.html`、`V2-design-reference.webp`、`mobile-design-reference.webp`、`design-reference.webp`、`seoul-winter.css`（舊版）仍**不放進 repo**。
  - `seoul-v2-site.css` **整份重寫**（舊版是多輪補丁疊加）：依圖層分 11 段（封面→功能列→紙卡→標題→航班→住宿→每日→下半部→頁尾→日期列→懸浮鈕）。`seoul-winter.js` 改成插入實際 `<img>` 圖層（封面梅枝×2／飛機／雪花／咖啡／糖餅、倒數卡梅枝＋福袋＋雪花、日期卡景福宮、天氣卡冬日行李、每日行程標題的巷弄＋梅枝、住宿拍立得、待辦底部福袋＋行李、頁尾天際線＋小吃＋梅枝＋雪花），不再全用 background 疊圖。
  - **新增去背素材** `images/seoul-2027/decor/{palace,hanok-street,seoul-skyline,street-food,winter-travel,new-year}-cut.png`：由同名白底 JPG 自動去背（只去掉與圖邊相連的白色、邊緣羽化、去白邊），裁掉鄰圖殘片（new-year 左側的宮殿碎片），縮到 400px、256 色 PNG（各約 70KB）。不是重畫，內容與原圖相同。白底 JPG 原檔保留。
  - 版面：封面手機 330～380px 高滿版、標題「首爾」約 78px，功能列往上疊在封面下緣 46px；手機左右 12px、區塊 18px、卡片 10px；航班改白色票身＋深藍票頭（航空公司在左、去／回程在右），日期移到票身第一行（JS 把 `.bph` 內的日期文字搬成 `.sv3-fdate`）；住宿卡英文名在前、中文名加地點圖示、韓文名＋喇叭在下，`📷` 小鈕隱藏（左邊照片本身就能點開相片）；手機每日卡＝Day 筆刷＋日期同列、插畫 42% 寬、右側深藍標題＋主色底線＋三個行程點；下半部六區各用不同色調紙卡（韓語紫、美食金、價格藍、注意綠、待辦玫瑰、App 紫）、圓角左右交錯、分頁選中色＝區塊色；注意事項用彩色序號圓章、待辦用勾選框＋虛線分隔。
  - 功能鍵、分頁、摺疊標題、說明文字開頭的表情符號，在首爾手帳版由 JS 拿掉（`deEmoji`；app.js 重畫分頁時 MutationObserver 再處理）；美食清單裡每家店名後面的 🦐 等是 JSON 資料，沒動。區塊標題的線條圖示取自功能列同一組遮罩圖（JS 讀 computed mask-image）。
  - 價格／App 橫滑卡：容器高度跟著目前那張（JS `.sv3-fit`），不再被最高的一張撐出大片空白。
- **素材使用對照表（v198）**（圖層：背＝背景、中＝內容卡、前＝前景裝飾）

| 素材 | 位置 | 尺寸／裁切 | 圖層 |
|---|---|---|---|
| hero-winter（.jpg／-m.jpg） | 封面 `hero2` 的 `<img>`（srcset） | cover，object-position 38% 70%；手機 clamp(330px,92vw,380px)、電腦 clamp(340px,44vw,470px)；上方白霧、下方淡出到頁面底色 | 背 |
| plum-branch.png | 封面左上（翻轉）＋右上、倒數卡左上、每日行程標題、注意事項左下、頁尾左上、電腦版兩側 | 封面 140～150px（電腦 210～230）；倒數 96～118px | 前 |
| airplane.png | 封面標題左側；日期卡「出發」圖示；登機證淡浮水印 | 封面 84px（電腦 120）；圖示 40px；浮水印 16% 透明 | 前 |
| snowflake.png | 封面、倒數卡右上、日期卡右上、App 貼紙、頁尾右上、電腦兩側 | 28～46px | 前 |
| coffee.png | 封面右下；價格貼紙 | 92px（電腦 140）；84px | 前 |
| hotteok.png | 美食貼紙；電腦封面右下 | 84px；130px | 前 |
| bokjumeoni.png | 倒數卡左側 `<img>`，傾斜 -6° | 卡寬 32～35% | 前 |
| palace-cut.png | 日期卡右下 `<img>` | 卡寬 50～52% | 前 |
| winter-travel-cut.png | 天氣卡右側；待辦底部右 | 寬 30%；高 120px | 前 |
| new-year-cut.png | 待辦底部左 | 高 120px | 前 |
| hanok-street-cut.png | 每日行程標題右側（手機 112px、電腦 124px，radial mask 淡邊）；電腦住宿欄下方 220px | contain | 背 |
| namsan-tower.png | 住宿標題右側拍立得（白框、紙膠帶、轉 7°） | 78px（電腦 96px） | 前 |
| hanok-window／mittens.png | 韓語、注意事項貼紙 | 84px，±8° | 前 |
| eomuk.png、suitcase.png | 美食、價格紙卡右下角貼紙 | 76px，-8° | 前 |
| seoul-skyline-cut.png | 頁尾右側 | 手機 58%、電腦 40% | 背 |
| street-food-cut.png | 頁尾左側（壓在天際線前） | 手機 50%、電腦 38% | 前 |
| brush-rose/blue/green/gold/violet.png | 區塊標題 `brush2`、Day 標籤（依日輪替）、封面副標、拍立得紙膠帶 | 100% 100% 拉伸 | 中 |
| day-1～6.jpg（.webp 原檔） | 每日卡插畫（2/3 day-1、2/4 day-2、2/5 day-5、2/6 day-3、2/7 day-4、2/8 day-6） | 手機左欄 42%、cover；電腦 2.4:1 | 中 |
| hanji-texture.jpg | 頁面底、所有紙卡（multiply） | 平鋪 | 背 |
| hotel-2.jpg（正式網站照片） | 住宿卡照片 | 40% 欄寬、4:5 | 中 |
| palace.jpg／hanok-street.jpg／street-food.jpg／seoul-skyline.jpg／winter-travel.jpg／new-year.jpg（白底原檔） | v198 起頁面改用 -cut.png，原檔留在 repo 與快取 | — | — |

- v198 測試（雲端 session：python http.server＋Playwright Chromium）：375／390／768／1440 全頁截圖，無橫向溢出、無 pageerror、無 4xx、無破圖；390 與手機設計稿、1440 與 V2 設計稿並排比對。功能：倒數、點日卡展開、日期列 D4、總覽回行程、功能列跳住宿、換算面板、字體（main zoom 1→1.15）、待辦勾選、韓語分頁、住宿展開、價格卡高度跟隨、主要按鈕高度 ≥44px、`?theme=classic`／`?theme=winter`、hk／tokyo／keihan／campervan／home／detour 載入皆正常；SW v198 快取 264 檔，斷網重新整理首爾頁仍是新版、去背圖全部顯示。**未測**：iPhone 實機（Snell Roundhand／韓文手寫字型、安全區）、GitHub Pages 線上畫面。
- v198 仍未還原（素材或資料限制）：設計稿的韓國國旗、雪人、石像（無素材，不自行繪製）；「旅遊成員 9 人（6 大 3 小）」與氣溫（JSON 無此資料）；每日卡行程點前的小線條圖示（設計稿每點不同圖示，資料無分類，改用主色圓點）；day-1～6 只有 278×96，電腦版放大偏糊，需要高解析原稿（建議每張 ≥ 1000×420）。
- 素材包內容：`CLAUDE-INSTRUCTIONS.md`、`CHECKLIST.md`、`reference.html`、`seoul-v2.css`、`V2-design-reference.webp`（＋ `mobile-design-reference.webp`）、decor 素材。參考圖／參考 HTML **沒放進 repo**；`seoul-v2.css` 原樣放在根目錄（路徑本來就是相對根目錄，不用改）。
- 新素材：`images/seoul-2027/decor/brush-{rose,blue,green,gold,violet}.png`、`day-1～6.webp`（原檔）＋ `day-1～6.jpg`（瀏覽器 canvas 同尺寸轉出，品質 0.92；比照 v170 iPhone WebP 破圖紀錄，網頁實際用 JPEG）。其他 decor 檔與包內相同（已逐檔比對）。day 圖是示意圖裁切，只有約 278×96，電腦版放大略糊（CHECKLIST 已註明非高解析原稿）。
- 做法：沿用上一版的 `seoul-winter.js`（只搬動／包裝 app.js 畫好的元素），改成套 `reference.html` 的 class：`<html>` 加 `sw sv2`、`<body>` 加 `seoul-v2`；封面 `hero2`、功能列 `nav2`＋`tile`／`nav-icon`（沿用原本的功能線條圖示）、倒數 `panel2 count2`（`#cd` 加 `numbers`）、日期 `panel2 info2`、航班登機證 `flight2`、飯店卡 `panel2 hotel2`（照片仍是正式網站 `hotel-2.jpg`）、標題文字包 `span.brush2`（五色筆刷輪替）、`#days` 加 `days2`、每張 `.dy` 加 `day2`＋`--accent`、底部日期列 `dock2`、頁尾 `footer2`。所有原有 id、事件、資料都沒動。
- `seoul-v2-site.css`（新檔，全部 `html.th-han.sw.sv2` 開頭）：把 V2 版型對應到正式頁並蓋過 theme-han.css 舊「Seoul Winter」區塊中衝突的規則（舊規則權重較高，所以 V2 的數值在這裡重寫一次）；背景圖改用同圖 `.jpg`；修正 `seoul-v2.css` 通用 `button`（nowrap）與 `panel2`（padding）規則在正式頁造成的擠壓。舊 Seoul Winter 區塊仍負責內頁（韓語、美食、價格、待辦等）的配色，**不要刪**。
- 版面：航班＋住宿改成並排 `.pair.sv2-fh`（手機上下排），所以 DOM 順序變成 航班→住宿→行程；倒數＋日期一組、天氣＋工具鍵一組。原本右下角三顆懸浮鈕（換算／字體／更新）搬進天氣旁的工具列（同一個元素，事件不變；換算面板仍從右下彈出）。日期列多一個「總覽」鍵（連到 `#plan`；沒選日期時是深藍），日期鍵前面用 CSS counter 加 D1～D6。每日卡標題用 JSON 的 `h`（去掉「Day N」），下方小字是原本的路線 `ds`；點開的那天跨滿整列。
- 每日卡配圖（裝飾，依實際行程配，不代表新增景點）：2/3 day-1 飛機、2/4 day-2 明洞、2/5 day-5 玩雪、2/6 day-3 景福宮、2/7 day-4 南山塔、2/8 day-6 機場。日數變動要改 `seoul-winter.js` 的 `DIMG`／`ACC`。
- `app.js` 改一行：上方功能列的捲動高亮改成「依畫面位置選最接近上方的已捲過段落」，因為首爾頁版面順序（航班→住宿→行程）和選單順序（航班→行程→住宿）不同；其他頁版面順序與選單一致，結果不變。航班與住宿在電腦版並排時同高，捲到那裡會亮「航班」。
- 示意圖中的「9 人（6 大 3 小）」、氣溫、航班時間、行程細項等**沒有寫進網站**（JSON 沒有人數資料）；頁尾文字用 JSON 的日期與天數。
- 測試（本機 PowerShell HttpListener＋Claude 內建瀏覽器，非 Playwright）：375／390／768／1440 無橫向溢出、無破圖、無 console error；功能列各段高亮正確（以 resize 事件觸發 spy 驗證）、點日卡展開／跨列、底部日期列切換、換算面板開關、字體 1→1.15、待辦勾選、`?theme=classic` 回舊版；hk／tokyo／keihan／campervan／home 頁可正常載入；SW 安裝後 260 個檔案（本機測試時為 v192；rebase 後正式為 v193），關掉伺服器重新整理仍顯示 V2.1 版面、無破圖。**未測**：GitHub Pages 線上畫面、iPhone 實機（安全區、Snell Roundhand 草寫字、JPEG 是否解決破圖）、320／430 寬度。

## Seoul Winter：首爾冬日旅行手帳（2026/11/26，使用者提供 seoul-winter-kit 素材包＋手機版示意圖）
- 做法：`index.html` 在 `app.js` 載入後，只有 `t=seoul-2027` 才載入 `seoul-winter.js`；它只搬動／包裝 app.js 畫好的元素（封面換 `hero-winter.webp`＋HTML 標題、功能列從頁首搬到封面下方並改 sticky 圖示鍵、倒數與日期移到 `.sw-top` 卡片、區塊標題去表情符號加小插畫、住宿卡插入 `hotel-2.jpg`、頁尾插畫），並在 `<html>` 加 `sw` class。樣式在 `theme-han.css` 最後的「Seoul Winter」區塊，全部以 `html.th-han.sw` 開頭。`app.js`、`style.css`、`trips/seoul-2027.json` 都沒改。
- 每日行程卡圖片是 CSS 依 `#dy0`～`#dy5` 指定（飛機／廣藏小吃／冬季行李／景福宮／韓屋巷弄／行李箱），只是裝飾，不代表新增景點；日數變動要改這段。「Day N」用 CSS counter。
- 恢復舊版：`?theme=classic`（存 localStorage `seoulTheme`），`?theme=winter` 改回。
- 2026/11/26 v170：使用者 iPhone 上封面 `hero-winter.webp` 顯示破圖（同資料夾的 PNG 正常）。原因未確認（可能該機 Safari 不解 WebP，例如鎖定模式），改用同圖轉出的 JPEG：封面 `hero-winter.jpg`／`hero-winter-m.jpg`（srcset），每日卡、頁尾、韓紙紋理也改 `.jpg`；封面載入失敗時退回舊的 `hero-snow.jpg`。WebP 原檔保留。**待使用者確認 iPhone 是否已正常**；首頁 `home.html` 的 `images/journal-v3/*.webp` 若在該機也破圖，原因相同。
- 素材在 `images/seoul-2027/decor/`（`new-year.webp` 有上傳但沒用到）；示意圖沒有放進 repo。示意圖裡的人數、氣溫、行程細項、航班時間都是排版示意，**沒有寫進網站**。
- 測試：Playwright 320／375／390／430／768／1280／1440 無橫向溢出、無 pageerror、無 404；展開日期、功能列跳轉、底部日期列、換匯、字體、待辦勾選、飯店相片、離線重新整理、`?theme=classic` 皆正常；其他旅程頁無錯誤。**未測**：GitHub Pages 線上畫面、iPhone 實機（含瀏海安全區域、毛筆／手寫字體在 iOS 的實際字型，`Seoul`／`Day N` 用的是 Snell Roundhand 等系統草寫字）。

## 旅程視覺素材（第四方案已執行並驗收，2026/11/26；規範見 `VISUAL-ASSET-GUIDELINES.md`）
- 已核對 `main` 的 V3／V3b 首頁符合規範，**沒有改網頁、CSS、素材，所以沒加 `sw.js` 的 `VERSION`**：三張主卡（首爾、港珠澳、東京，依日期）、露營車是東京卡內子入口（`.subtrip`，高 60px）、京阪不在公開首頁；PNG（`images/home-journal/`）與 WebP（`images/journal-v3/`）兩套並存。Playwright 測 320／360／390／430／768／1280／1440：無水平溢出、無 pageerror、圖片全載入、四個連結正確、倒數正常、`[data-upd]` 更新鈕在、離線重新整理仍顯示三卡且無破圖。截圖在驗收當次的暫存目錄，沒放進 repo。
- **未完成／待辦**
  - 線上（GitHub Pages）實際畫面與 iPhone 實機**都沒測**（沙盒連不到外網）。
  - 規範建議的獨立明信片素材（首爾／港珠澳／東京 1200×1000、露營車橫幅 1200×500，無文字、無 UI）**尚未製作**；目前用的是裁切自示意圖的小尺寸 WebP（約 300×250、露營車 181×76），大螢幕放大會偏糊。不要自行重畫或用原 PNG 裁切代替，等使用者提供素材。
  - 手機桌面圖示（`icon-*.png`、`manifest-*.webmanifest`）**沒有換成新插畫**；規範要求先核對 manifest 與平台規格，不擅自更換共用 App 圖示。
  - 遠端分支 `icons-home-unified` 已不採用，不要合併；沙盒無法刪遠端分支，使用者可日後 `git push origin --delete icons-home-unified`。
- 常駐事項：京阪 `keihan.html` 不放進 `trips/index.json` 與公開首頁（只從私人訂單頁連過來）；`kyoto-osaka.png` 只供私人訂單頁（`travel-private`）使用；偏航 `detour/` 不動。
- 驗證做法備忘：首頁用 `python3 -m http.server`（與測試放同一個指令）＋Playwright；離線測試要等 Service Worker ready 約 4 秒再 `set_offline(True)` 重新整理。

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

## 森林手帳 V2 版面重構（2026/11/26，sw v171；依 `FOREST-JOURNAL-V2-HANDOFF.md`＋使用者附的 `forest-journal-v2.zip` 與手機示意圖）
- 做法同首爾冬日：`forest-v2.js` 在頁面畫完後**只搬動／包裝元素、換圖**，樣式在 `theme-forest-v2.css`（全部 `html.fj2` 開頭，疊在 V1 `theme-forest-journal.css` 之後）。`app.js`、`style.css`、`trips/tokyo-2027.json`、`campervan.html` 的 `const D`／render 邏輯都沒改；`campervan.html`／`tokyo.html` 只改 `<html>` class、加 link 與 script。
- 東京：頁首改品牌列「東京旅遊」＋☰（捲回功能選單）；原頂部導覽搬到封面下方變 4＋3 水彩圖示紙卡（同一組 `<a>`，捲動高亮照常）；封面換 `tokyo-hero.webp`＋HTML 標題；日期／倒數／看每日行程包成紙卡；每日行程上方加「Day N」分頁（只是代按底部日期列 `#dbtn`）；日卡改縮圖卡（`ic-*.svg` → 同名水彩圖示：van→camper、port→harbor、其餘同名）；橫幅 `banner-fuji.svg`→`campervan-hero.webp`、`banner-kaminarimon.svg`→`asakusa-banner.webp`（圖說文字照舊）；頁尾 `footer-fuji.webp`。切換方案後頁面會重新載入：`tokyo.html` 先把 `sessionStorage` 的 `tyo27pgo` 存到 `window.FJ2_GO`，V2 版面排好後再捲到 `#plan`。
- 露營車：頂部改品牌列「露營車之旅」＋返回鍵；封面換 `campervan-hero.webp`＋標題；4 個圖示鍵（行程總覽 `ov`、里程地圖 `mp`、RV Park、酒藏巡禮＝`rvSet()`＋`go('rv')`，只放頁面原有的分頁，沒有新增「美食／購物／露營裝備」等示意圖裡的假功能）；原 `#tabs` 移到「露營車行程」標題下並黏在品牌列下；總覽頁加 DAY 1～4 日程卡（標題取自 `D[lang].dN[0]`）；每日標題換水彩圖示。日文模式（`#lgb`）品牌列／圖示鍵文字會跟著換（`render` 被包一層呼叫 `post()`）。
- 素材：`images/forest-journal-v2/`（zip 內 4 張橫幅 webp＋13 張 256×256 圖示 png，`design-reference.png` 沒放進 repo）。圖示保留紙色底與底部檔名殘字，CSS 用 `background-position` 裁切＋`mix-blend-mode:multiply`＋圓形漸層遮罩融入紙卡。橫幅原檔只有約 361×122，大螢幕放大會偏糊（README 已說明是低解析裁切）。
- **補件（2026/11/26，sw v172～v174，`forest-v2-supplement.zip`）**：新增 `washi-texture.webp`（body 平鋪＋米白薄層）、`leaf-branch.png`（品牌列與所有區塊標題兩側，取代 V1 `leaf.webp`）、`wood-sign.png`（「我的東京行程」「露營車行程」標題木牌，JS 包 `span.fj2-sign`）、`cloud.png`（封面標題後方柔光）、`tape.png`（上半綠格紋貼東京倒數卡、下半藍點貼露營車日程卡）、`hydrangea.png`（倒數卡左下、日程卡右下）、`icon-sake.png`（酒藏巡禮鍵，取代書本）；4 張橫幅換成同檔名的 623px 版（原 361px）。全部不透明紙色底，用 `mix-blend-mode:multiply` 融入；**放裝飾的容器不能建立堆疊層（z-index／isolation），否則會出現淺色方框**；另外 `html` 要有自己的底色（body 背景被提升到畫布時 Chrome 不和它混合），素材再加 `filter:brightness(1.06)` 讓紙色變白，方框才完全消失。`reference.png` 只供比對，沒放進 repo。
- （補件時期的「仍缺」已由 V2.2 補齊大部分，見下方 V2.2。）
- **V2.2 素材（2026/11/26，sw v177，`forest-journal-v22.zip`）**：
  - 主封面：`tokyo-hero.webp`、`campervan-hero.webp` 換成 1672×941 原畫（README：獨立生成、原生解析度、未放大），桌機 760px 寬也清楚。其他橫幅：`asakusa-banner` 833×320、`footer-fuji` 836×320，README 自述仍未達原訂規格。
  - PNG：全部是 512×512 RGBA 透明底，圖案四周留白。**multiply、brightness、圖示的圓形遮罩都已移除**，改用 `background-size`／`object-fit` 處理留白：
    - 葉片：`100% auto` 裁上下留白。
    - 木牌：`109% 154%`，讓木板剛好包住標題字。
    - 紙膠帶：`104% 250%`。新版只有一條綠斜紋，兩處共用。
    - 繡球花：`122% auto`。
    - 圖示紙卡與日卡縮圖：用 `contain` 完整顯示。新圖示幾乎占滿畫布高度，用 cover 會切掉上下；縮圖底色改淡綠 `#eef2e4`。
  - 雲朵：不再被 multiply 淡化，原本大小會蓋住露營車和富士山，所以縮成標題後方的扁長範圍（東京 inset、露營車 `aspect-ratio:3.3`，不透明度 .45～.55）。
  - 新圖示 `icon-map.png` 用在露營車「里程地圖」（取代富士山）。
  - 和紙紋理 `washi-texture.webp` 改成 1024×1024，以 512px 平鋪。
  - 舊主題的標題虛線底線（`theme-fuji.css` 的 `h2::after` 的 border-top）會疊在右側葉片上，已在 V2 清掉。
  - `html.fj2` 底色和 `.fj2-cdcard{z-index:auto}` 保留：不影響透明圖，之後若又遇到不透明素材還用得到。
  - 已放進 repo、但版面還沒用、也**沒加進 SW 快取**的素材：`paper-texture.webp`、`sky-texture.webp`、`wash-green.webp`、`leaf-corner.png`、`leaf-corner-r.png`、`leaf-fall.png`、`leaf-accent.png`、`grass-flowers.png`。要用時記得加進 `sw.js` 的 CORE。
  - 注意：`hydrangea.png` 左緣有一小點黃色雜點（素材本身，約 x=20、y=170），目前位置不明顯。V2 快取量增加到約 6.5 MB（兩張封面各約 900 KB、圖示各約 200～320 KB），第一次離線快取會比較久。
  - 測試（本機）：375／390／430／1280px 無橫向溢出、無破圖。東京：導覽、Day 分頁展開、工具選單換算、天氣城市名單行。露營車：酒藏（13 間）、里程地圖、DAY 3 日程卡。iPhone 實機仍未測。
  - 線上（commit `70def48`，v177）：這台瀏覽器原本是 v175，版本提示實際跑過：「發現新版 v177」→ 約 30 秒後（207 個檔案）「已下載完成」→ 重新載入後跳出「已更新到最新版 v177 ✓」，畫面是新封面與透明素材。因為快取變大，v178 把版本提示等待下載完成的時間從 60 秒放寬到 5 分鐘（每 2 秒檢查一次），並在新 Service Worker 接手（`controllerchange`）時立即檢查。
- 切換／復原：`?theme=classic`＝原版（v168 的復原機制，照舊）；`?theme=v1`＝森林手帳第一版（v168 外觀）；`?theme=forest`＝V2（預設）。都記在 localStorage `theme`。永久拿掉 V2＝刪兩頁 `<html>` 的 `fj2`、`theme-forest-v2.css` link、`forest-v2.js` script，或 `git revert` V2 那個 commit。改版前版本：`3cc7ad2`（sw v170）；森林 V1 基準 `1311076`（v168）。
- 測試（本機 PowerShell HttpListener＋Claude 內建瀏覽器）：375／390／430／1280 無橫向溢出；東京：功能紙卡跳轉與高亮、☰、Day 分頁↔底部日期列同步、展開日卡、方案切換（方案三 6 天）、待辦勾選、換算／字體／更新鈕、倒數；露營車：4 個圖示鍵、RV／酒藏切換（13 間）、總覽日程卡→DAY 3、行程點勾選、日文切換、分頁黏頂；`?theme=classic`／`?theme=v1` 正常；首爾頁無錯誤。
- **V2.1 介面修正（2026/11/26）**，全部在 `forest-v2.js`／`theme-forest-v2.css` 末段，只作用在 `html.fj2`（東京、露營車）；`upd.js`、`sw.js` 的機制沒改（只升 VERSION）：
  - 天氣卡：`.wxtop` 可換行、`.wxn` 不換行，天氣標籤放不下時會排到城市名下方。320／375／390／430px 城市名都維持單行（高 25px）。
  - 工具選單：右下角原本的懸浮鈕收進一顆「工具」鈕（`#fj2-tools`）。東京是 更新 `#upd`／字體 `#fs`／換算 `#fxb`，露營車是 更新／語言 `#lgb`。按鈕元素與原本的點擊功能都沒改，只靠 `.fj2-tool` 和 `--fj2-i` 改位置與顯示；收起時加 `tabindex=-1`。點外面或按 Esc 會收起；換算面板 `.fxp` 的位置跟著往上移。往下捲時工具鈕淡出，往上捲或停 0.9 秒後回來。
  - 版本提示：兩頁 `<head>` 先記下開頁當下的快取版本 `window.FJ2_CV`，和網站上的 `sw.js` VERSION 比對：
    - 是舊版：頁首下方出現「發現新版 vXXX，背景下載中…」，等 Service Worker 裝好新快取後改成「新版已下載完成［重新載入］」，工具鈕也會亮綠點。
    - 重新載入後已是新版：跳出「已更新到最新版 vXXX ✓」。
    - 工具選單打開時，左側會顯示「目前版本 vXXX・已是最新」。
    - 沒有 Service Worker 控制時（第一次開、本機 http）不顯示。
  - 第 4～6 項照舊：方案切換後捲回每日行程（`FJ2_GO`）、classic／v1／forest 三種主題、multiply＋brightness 都保留。classic／v1 下沒有工具選單，懸浮鈕和原版一樣。
  - V2.1 測試：
    - 本機：320／375／390／430px 無橫向溢出；換算面板可開、可算（1000 → NT$211.1）；字體循環、語言切換、點外面收起、捲動淡出後回來都正常；classic／v1 沒有工具選單。
    - 線上（commit `539980a`，sw v175）：這台瀏覽器原本是 v174 快取，實際跑過一次完整流程：開頁 →「發現新版 v175，背景下載中…」→ 約 10 秒後「新版 v175 已下載完成［重新載入］」→ 重新載入後快取只剩 v175、CSS 是新版、工具選單顯示「目前版本 v175・已是最新」。「已更新到最新版」提示跑過（sessionStorage 旗標已用掉），但截圖前已經淡出，沒拍到。
    - 注意：新功能第一次上線時，舊版頁面裡沒有這段程式，所以第一次開仍是舊版，要到下一次更新（v176 起）才會出現提示。內建瀏覽器隱藏時 CSS 轉場會暫停，收起後按鈕要等一下才消失；手機上正常顯示時沒有這個情況。
    - 未測：iPhone 實機（安全區域、工具鈕位置）。
- 線上（GitHub Pages，commit `33b6765`）：東京、露營車 390px 正常、無破圖、無溢出；Service Worker 已啟用，快取 `trip-v171` 內含 19 個 V2 檔案（CSS、JS、17 張素材）。
- **未測**：實際斷網後重新整理（內建瀏覽器無法切離線；本機 http 也拒絕註冊 SW）；切換方案後自動捲到每日行程（修正保留，待 iPhone 實機確認）；iPhone 實機（安全區域、明體字型）。

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

## 公開首頁 V4（2026/11/26，使用者視覺驗收通過，已換成正式 `home.html`，sw v176）
依使用者附的 `family-journal-v4-assets.zip`（reference-v4.png、CLAUDE-INSTRUCTIONS.md、ASSET-MANIFEST.md）先在分支 `journal-v4-preview` 以 `home-v4.html` 預覽，使用者看過並排截圖後確認通過，合併進 main 取代 V3。V3 備份：`backups/home-before-v4-20261126.html`（仍引用 `journal-v3*.css`、`images/journal-v3/`，這些檔案與 `sw.js` 快取項目都保留）。
- 檔案：`home.html`（render／倒數 cdStart-cdEnd／fallback／SW 註冊／`upd.js`／metadata 皆沿用 V3 邏輯，只改 HTML 結構）、`journal-v4.css`、`images/journal-v4/`（19 張）。`journal-v3*.css`、`detour/`、各旅程內頁、`trips/`、PNG Icon 都沒動。
- 素材處理：素材包的棋盤格／紙底都不是真透明。以「從圖片外框 flood fill、只移除與外框相連的背景」去背，輸出 `*-cut.webp`（原生尺寸、未放大、未重畫）。明信片／露營車票券／紙堆／頁尾用中性淺灰判定；標題、2027 吊牌、筆刷、地標剪影、紙膠帶用角落紙色判定（容差 8–20），再刪掉圖集相鄰素材殘片（保留最大連通區、東京剪影右上 56×10px 殘片手動清掉）。未去背的只有 `hero-landscape.webp`、`paper-texture.webp`（原檔）。
- 未使用：`cover-portrait.webp`（內含「家庭旅行手帖 2027」字樣，會與毛筆標題重複）、`sources/` 原圖。明信片本身已含目的地字、紙膠帶、郵戳、迴紋針，所以沒有再疊文字或另加這些裝飾。
- 版面：橫幅封面（手機 172px 高、桌機 241px 原生高）＋毛筆標題紙片疊在橫幅下緣＋2027 吊牌；卡片為紙紋＋撕邊 clip-path（沿用 V3 做法）＋紙堆底層錯落；筆刷倒數、地標剪影、圓形箭頭；露營車為東京卡內票券子入口（高 56px）；森林頁尾木牌上的「Family Trip ♥」是 HTML 文字（素材木牌是空白的）。行事曆小圖示沿用 `images/journal-v3/deco-cal-*.png`。
- 與基準稿的差異（素材限制，非遺漏）：基準稿封面是夜景＋人物＋露營車，素材包只有黃昏橫幅 `hero-landscape`；基準稿卡片右上的 SEOUL/HONG KONG/TOKYO 郵戳與雪花沒有獨立素材（明信片內已有小郵戳）；頁尾小巴與虛線路徑不在素材內，改用 `footer-original` 的露營車。
- `sw.js`：v174→v176，CORE 加入 `journal-v4.css` 與 19 張素材（預覽用的 `home-v4.html` 已刪除、項目已移除）。其他內容未改。
- 已測（本機 PowerShell HttpListener + headless Edge／DevTools protocol，Python/Playwright 在這台 Windows 不可用）：320／360／390／430／768／1280／1440 無水平溢出；23 張圖全部載入；連結 `./?t=seoul-2027`、`hk.html`、`tokyo.html`、`campervan.html` 正確且回 200；倒數由程式產生（測試日 2026/11/26：69／128／218 天）；檢查更新顯示「已是最新版（v176）」；SW 控制頁面、斷網重新整理仍顯示三卡且無破圖（390 與 1280）。
- 既有行為（V3 相同，未改）：斷網時按「檢查更新」會顯示「已是最新版」而非「沒有網路」，因為 SW 以快取回應 `sw.js`。
- 線上已確認（curl）：GitHub Pages 的 `sw.js` 為 v176、`home.html` 載入 `journal-v4.css`、`images/journal-v4/seoul-cut.webp` 回 200。
- **未驗證**：線上畫面的實際瀏覽器截圖；iPhone 實機與 PWA 更新（WebP 去背圖在使用者那台曾破圖的 Safari 上是否正常，見上方 Seoul Winter v170 紀錄；若破圖，原因相同，可比照改 PNG/JPEG）；Mac/iOS 字型（宋體／Snell Roundhand）與 Windows 截圖的字形差異。
- 分支 `journal-v4-preview` 已合併，可刪除（`git push origin --delete journal-v4-preview`）。
- 2026/11/26 sw v180：首頁 App 圖示換成使用者提供的「皮革手帳＋富士山露營」圖（1254×1254，透明底）。`icon-home-192.png`、`icon-home-512.png` 保留透明底；`icon-home-180.png`（apple-touch-icon）iOS 會把透明補黑，改鋪紙色 `#f1e2c6`；`icon-home-maskable-512.png` 縮到 80% 置中在紙色底（Android 圓形安全區）。只換這 4 個檔，檔名、manifest、其他旅程圖示都沒動；舊圖在 git 歷史。**未驗證**：iPhone／Android 主畫面實際顯示。iOS 已加到主畫面的捷徑不會自動換圖，要刪掉重新「加入主畫面」。

## 公開首頁 `home.html`「家庭旅行手帖」v3 整合紀錄（2026/11/26，使用者提供 `family-journal-final.zip`、`family-journal-v3.zip` 與一張範例稿）
**使用者要求**：美編素材與 CSS 都由使用者提供，不得自行重畫、替換圖片或簡化版面；保留首爾／港珠澳／東京三大旅程，露營車為東京子項目，京阪不列入總覽；DETOUR（`detour/`）、各旅程內頁、`trips/` 資料不得修改；保留倒數、離線、檢查更新；先備份舊首頁；手機與電腦都要實測。

**已完成並推送到 `main`（`65f8dd5`、`4f3be8c`、`c689d72`）**
- 備份：`backups/home-before-journal-20261126.html`（final 版整合前）、`backups/home-before-v3-20261126.html`（v3 整合前）。
- （已被 V4 取代，見上一節）當時檔案：`home.html`、`journal-v3.css`（使用者提供，未改）、`journal-v3b.css`（我加的疊加層）、`images/journal-v3/`（使用者提供 7 張 webp + 我裁的 7 張 `deco-*.png`）。`home-journal.css` 與 `images/home-journal/` 是上一版（final）遺留，`sw.js` 仍在快取。
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

**與上一節「五張行程插畫 Icon」的關係**：v3 首頁入口圖用的是 `images/journal-v3/*.webp`（使用者提供的另一套裁切圖），**不是** `images/home-journal/*.png` 的原 PNG。使用者已確認第四方案：保留 WebP 明信片與 PNG 功能圖示分流，詳見 VISUAL-ASSET-GUIDELINES.md。

**踩到的坑**
- 推送前必須 `git fetch`：這次 `sw.js` 與別的工作階段同時改（對方升 `VERSION` 並加了港珠澳圖）。處理方式是以 `origin/main` 的 `sw.js` 為底，再只加首頁資源並把 `VERSION` 再加 1，沒有覆蓋對方內容。
- v3 包的 `.hero`／`.footer-art` 在 final 包時曾有 `max-height` 裁切導致文字被切；v3 已不是這寫法，但再換新包時要檢查標題與木牌有沒有被裁。
- 範例稿的剪影旁邊有箭頭按鈕與文字殘影，去背時要用 `erase` 區塊遮掉，否則會帶出殘字（如 "Macau"）。
