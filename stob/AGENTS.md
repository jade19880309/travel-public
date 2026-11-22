# STOB 系統說明（給接手的 AI）

> 先讀這份，再讀 `HANDOFF.md`（還沒做完、還沒驗證的事）。
> 使用者用繁體中文、主要用 iPhone。回覆要短、先講結論；介面文字一律繁體中文。

## 常駐規則（每位 AI 都要遵守）

- **做不完就寫盡**：用量快用完、被中斷、遇到阻礙時，先停手，把下列內容寫進 `HANDOFF.md` 並推送，再回報使用者：
  1. 做到一半的項目：停在哪一步、下一步具體要做什麼、改了哪些檔案
  2. 沒做的項目與原因
  3. 未查證的事實與資料來源
  4. 踩到的坑與下一位要避開的事
- 做完的項目從 `HANDOFF.md` 刪掉，不要累積紀錄。
- 推送前確認 `git log` 與遠端一致；`HANDOFF.md` 要能脫離對話紀錄看懂。
- **STOB 與這個公開 repo 絕不能出現個資**（姓名、護照、PNR、訂單編號、信用卡末四碼、付款連結）。`build.py` 會自動檢查，有殘留會印在 `leftover:` 後面。
- **沒有被要求就不要動 TOB**（私人 repo `travel-private`）。STOB 只從 TOB 的固定版本複製，不會寫回去。
- 每次推送 `travel-public` 前，把根目錄 `sw.js` 的 `VERSION` 加 1（整個 repo 的規則，見根目錄 `README.md`／`HANDOFF.md`）。

## 系統全貌

| 名稱 | 位置 | 說明 |
|---|---|---|
| TOB 旅遊訂單 | 私人 repo `jade19880309/travel-private`（`index.html` 單一檔，資料寫死在檔案裡），線上網址 travel942booking.jade19880309.workers.dev | 使用者自己的訂單系統，含全家個資。改法見 `travel-private/AGENTS.md` |
| STOB 旅遊訂單（分享版） | 這個資料夾 `travel-public/stob/`；發佈在 Claude：https://claude.ai/artifact/TTqqsARKJQDnMJi1tQJJdQ（2026-11-22 重新發佈；舊的 4ohzsuWP61yy6PtJfYY85a 已讀不到） | 給朋友用的空白版，資料存在每個人自己的 Claude 帳號 |
| 安裝頁 | `stob/index.html` → https://jade19880309.github.io/travel-public/stob/ | 給朋友的三步驟安裝說明；朋友複製一句話給自己的 Claude，Claude 照 `INSTALL.md` 發佈 |
| 使用說明網頁 | `stob/guide.html` → https://jade19880309.github.io/travel-public/stob/guide.html（安裝頁底部有連結） | 給朋友看的完整操作說明；內容與 Claude Docs 版（https://claude.ai/artifact/Pkxx1Nq5XwNLAnUHYrGoQv，2026-11-22 重新排版）相同，改功能時兩份都要更新 |
| 各旅程行程網站 | `travel-public` 根目錄（index.html、tokyo.html…） | 與 STOB 無關，規則見根目錄 `README.md`、`HANDOFF.md` |

## STOB 怎麼做出來的

`src/build.py` 以 TOB 的 **`21ce4f8`** 版本為基礎（用 `git show` 從 `travel-private` 取出，不另存含個資的副本）：

1. 刪掉內嵌的訂單截圖與整段寫死的資料，換成 `src/data_block.js`（空的 `db`）。
2. 把 TOB 裡寫死的家庭分組、露營車、區域、旅程圖示改成依資料計算；拿掉 Service Worker；配色字體改掉。
3. 在檔尾加上 `src/cloud.js` + `src/plan.js`（JS）、`src/cloud.css` + `src/theme.css`（CSS），`src/pub.css` 以字串 `PUB_CSS` 注入。
4. 檢查個資殘留，輸出 `stob/STOB.html`。

**重建**（需要 `travel-private` 與 `travel-public` 並排；或設 `TOB_REPO`）：

```
cd travel-public/stob/src
TOB_REPO=/path/to/travel-private python3 build.py   # 印出 size 與 leftover: []
```

`build.py` 用很多「精準字串取代」改 TOB 的程式；字串對不到會印 `missing: …` 並停止。TOB 之後改版不影響（固定在 `21ce4f8`）。

## 原始檔分工

| 檔案 | 內容 |
|---|---|
| `src/data_block.js` | 空資料 `db`、預設匯率 `RATES0`、`save()` 改呼叫雲端 |
| `src/cloud.js` | 雲端讀寫（`CLD`）、資料正規化 `normDb`、上傳訂單與 AI 讀取（`AI_RULES` 提示詞、`adRun`／`adPreview`／`adApply`）、管理頁（旅程／成員／訂單／備份、一句話修改 `aiEdit`）、右下角「上傳訂單」按鈕 `fabUpd`、`render` 包裝 |
| `src/plan.js` | 建議行程（分頁 `plan`，`PL` 狀態、`planCtx` 提示詞、產生／單日重排／一句話修改／刪除）、PDF（canvas 直接畫字 → JPEG → 自製 PDF，`plPages`／`pdfBuild`）、發佈網頁（`pubParts`／`pubDoc`／`pubHtml`，一律不含個資，隨機配色 `pubPalette`） |
| `src/cloud.css` | STOB 新增元件的樣式 |
| `src/theme.css` | STOB 配色（霧白、藍綠 `--gold`、行李吊牌金黃 `--tag`）、頁首吊牌標誌、iOS 修正 |
| `src/pub.css` | 發佈網頁的樣式（顏色用 CSS 變數，由 `pubPalette` 給值） |

TOB 原有的畫面（清單、未付款、個人單、確認信、店家報到）都還在，函式名稱沿用 TOB（`VIEWS`、`render`、`go`、`tbar`、`hCard`…）。

## 資料

- 存在 Claude artifact 的 `db` capability：`data/users/<user.id()>/tob`（JSON 字串分段存，每段 6 萬字）、訂單截圖 `data/users/<id>/img_<訂單編號>`（WebP data URL，<185KB）。每人只看得到自己的。
- **雲端格式 v2**（2026-11-22 起）：主文件 `tob` = `{v:2, rev, n, len, h, pk, t, by, s}`，`s` 是第 1 段；第 2 段起存 `<pk><i>`，`pk`＝`tob_r<rev>_<寫入者 sid 前 10 碼>_p`（每版、每個寫入者各一份，避免鎖過期時互相蓋到分段）。先寫分段、最後才寫主文件，寫完再讀一次主文件確認是自己寫的，才刪上一版分段。`len`＋`h`（FNV-1a 雜湊）是檢查碼。讀取用 `partPre(o)`：有 `pk` 用 `pk`；沒有 `pk` 的 v2 用 `tob_r<rev>_p`；舊格式用 `tob_p`。
  - 舊格式（主文件沒有 `rev`，分段叫 `tob_p<i>`）仍可讀；第一次儲存就升級成 v2 並刪掉舊分段。
  - 寫入鎖只用 Claude db 的 `acquire`（cooperative lease，沒有交易 API）：`tob_lock` 文件、holder＝`CLD.sid`、ttl 10 秒。**拿不到鎖就不寫**（busy → 4 秒後重試）；不支援 acquire → `CLD.lock='nolease'` 暫停儲存；acquire 網路錯誤 → 當斷線處理、指數退避重試，`online` 事件會立即補存。每次 `set` 前 `keepLease()` 確認剩餘 >4 秒，否則續約，續不到就中止（主文件不會被寫）。
  - 拿到鎖後讀主文件 `rev`；和本機 `CLD.rev` 不同＝別的裝置改過 → `CLD.lock='conflict'`。例外：`CLD.pend` 記著上次寫主文件的 rev/h，如果主文件正是自己上次寫的（回應遺失），直接接手。
  - 寫完主文件再讀一次，`rev/by/h` 不是自己的（被沒用鎖的舊版覆蓋）→ 鎖定。
  - 「重新讀取」要先在 `#lockbar` 確認（`CLD.rconf`），並提供「先複製目前資料」；`cloudReload(1)` 才真的載入。`CLD.dirty` 表示有沒存上雲端的修改。
  - 讀取失敗（段落缺、檢查碼不符、解析錯、網路錯）先重試一次，仍失敗 → `CLD.lock='read'`。
  - 鎖定時：頂端 `#lockbar` 顯示原因與「重新讀取」；`cloudSave` 不寫；所有寫入入口先過 `canWrite()`。**新增任何會改 `db` 的函式都要先呼叫 `canWrite()`**。
- **備份格式**：「複製全部資料」輸出 `{stob:1, format:1, at, db}`；還原同時接受這個格式與舊的直接 `db` JSON。還原流程 `bkCheck` → 顯示比較 → 勾選確認 → `bkRestore`（`ADS.undo` 可復原，重新整理後失效）。
- **公開網頁個資**：`plan.js` 的 `pubModel` 只取白名單欄位（不取姓名、PNR、票號、訂單編號、代碼、付款連結、護照、生日）；`pubScan` 用 `pubTokens()`（全部成員與訂單的個資字串）比對所有欄位，再用 `pubFind()`（`PUB_DET`：電話〔台灣手機／市話、日本、國際 +碼、或前面有「電話／Tel」等字〕、身分證〔含檢查碼〕、卡號〔Luhn＋分組〕、卡號末四碼、Email）掃 `PUB_NOD` 以外的欄位（日期、時間、航班編號等結構欄位不掃）。有比對到就顯示 `.pubchk` 讓使用者選「遮蔽後下載」。`plPub` 產生一次 HTML → `pubLeak`（原始碼比對個資字串＋畫面文字格式偵測）→ 存在 `PL.out` → `plPubSave()` 下載；失敗時「再試一次」與「複製網頁原始碼」都用同一份 `PL.out.html`；檢查不過就不輸出。正規式不用 lookbehind（舊 iOS Safari 不支援）。
- **AI 修改**：`aiCheck` 逐項逐欄位用 `vField` 驗證（欄位中文名在 `FLD`），驗證不過的不能勾；刪除預設不勾；`aiApply` 只套用 `ADS.aiSel` 勾選的。
- **截圖失敗**：`imgSave` 失敗記在 `ADS.imgFail`（只在這次使用期間），上傳頁頂端顯示卡片可重試。
- `db` 物件：`members[]`（id, zh, last, first, sex, dob, pp, ppExp, grp）、`trips[]`（id, name＝YYYYMM＋名稱, start, end, note, curs, fam, nosplit, web）、`fl[]` 機票（segs[], pax{成員:金額}, pp{成員:{pnr,tkt,kind}}）、`ht[]` 飯店（rooms[{type,bf,price,members[]}], cin, cout, cancelBy, payDate, rep）、`tr[]` 交通（含 `camp:{cin,cout,zh}` 的露營車／郵輪＝交通兼住宿）、`ot[]` 其他、`imgs[]`、`plans{旅程id:{prefs,plan}}`、`rates{}`。
- 勾選採用（`SEL`）、個人單選項、確認信狀態存在各裝置的 localStorage（`stob_` 開頭），不跨裝置同步。

## Claude artifact 的限制（改功能前先想到）

- 網頁不能連外部網站（fetch 被擋）、不能用 alert/confirm/prompt、不能直接下載（要用 `downloads` capability）、`window.print` 無效。
- AI 用 `sample` capability，花的是**看的人自己的** Claude 額度；第一次會跳出同意視窗。
- 已宣告的 capabilities（改了要同步更新 `INSTALL.md`）：

```json
{"db":{"rules":[{"path":"","read":"admin","write":"admin"},{"path":"data/users/{self}","read":"interact","write":"interact"}]},"user":{},"sample":{"images":true},"downloads":true}
```

- 宣告順序：新增 capability → 先宣告再發佈；移除 → 先發佈再宣告。

## 修改流程

1. 改 `src/` 裡的檔案（介面文字繁體中文、手機優先）。
2. `python3 build.py`，確認 `leftover: []`。
3. 跑測試（下一節），看截圖。
4. 根目錄 `sw.js` 的 `VERSION` 加 1，commit、`git -c push.negotiate=true push origin main`。
5. 發佈到 Claude（只有使用者本人的 Claude 能做）：用 artifact 工具把 `stob/STOB.html` 以 `index.html` 發佈到上面那個 slug（`base_version` 先用 `get_artifact` 取得）。不是 Claude 的 AI：完成 1–4 後請使用者在 Claude 說「把 travel-public/stob/STOB.html 發佈到 STOB 那個 artifact」。
6. 朋友那份不會自動更新，要請他們用安裝頁重新發佈（舊資料先在「管理 › 備份」複製、新版還原）。
7. 更新 `HANDOFF.md`。

## 測試

`tests/` 裡是 Playwright（Python）＋ Chrome 的測試，用假的 `window.claude`（假 db、假 AI 回覆）跑完整流程，不需要網路：

```
pip install playwright --break-system-packages   # 第一次
CHROME=/usr/bin/google-chrome python3 tests/test.py     # 基本流程：上傳 → 存入 → 各頁 → 重新載入
CHROME=/usr/bin/google-chrome python3 tests/t8.py       # 建議行程、單日重排、一句話修改、發佈網頁、PDF、刪除
CHROME=/usr/bin/google-chrome python3 tests/t_full.py   # 所有頁面淺／深色＋手機寬度溢出、管理頁、備份還原、400 筆分段、未登入
CHROME=/usr/bin/google-chrome python3 tests/t_r2.py     # 多分頁同時儲存、拿不到鎖、不支援鎖、斷線（拿鎖／分段／回應遺失）、被舊版覆蓋、重新讀取確認、下載失敗、個資偵測正反例（38/38）
CHROME=/usr/bin/google-chrome python3 tests/t_v2.py     # 版本衝突鎖定、讀取失敗鎖定、舊格式升級、截圖失敗、AI 驗證、公開網頁遮蔽、手機表單（印出 32/32 passed）
```

每支最後印出 `ERRORS []` 或 `[]` 代表沒有 JS 錯誤；`overflow: []` 代表沒有左右溢出。沙盒連不到 Google 字型、cdnjs、github.io 屬正常。**iPhone Safari 的實際排版無法在這裡測**（例如日期欄位寬度），改版面後請使用者用手機確認。

## 使用者的偏好（做決定時參考）

- 介面要整齊、乾淨、直覺，手機／平板／電腦都好用；能長按複製的就不另外放按鈕。
- 輸出給別人看的內容要不含個資；PDF 是自己存檔用的完整版。
- 發佈網頁與 PDF 的順序固定：航班 → 飯店 →（交通）→ 每日行程（每天先大綱再細節，網頁預設折疊）→ 注意事項。發佈網頁每次隨機配色、不要儀表板。
- 維持用 Claude 讀訂單（不做無 AI 的模式）；LINE 不能傳 .html，分享 STOB 用安裝頁網址。
