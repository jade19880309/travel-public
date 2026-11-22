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
| STOB 旅遊訂單（分享版） | 這個資料夾 `travel-public/stob/`；發佈在 Claude：https://claude.ai/artifact/4ohzsuWP61yy6PtJfYY85a（artifact slug `1ed0e52e-f8f4-478b-81d0-3ac419a90c4d`） | 給朋友用的空白版，資料存在每個人自己的 Claude 帳號 |
| 安裝頁 | `stob/index.html` → https://jade19880309.github.io/travel-public/stob/ | 給朋友的三步驟安裝說明；朋友複製一句話給自己的 Claude，Claude 照 `INSTALL.md` 發佈 |
| 使用說明文件 | Claude Docs：https://claude.ai/artifact/9Dv1bnvUdRabStL49e5DfY | 給朋友看的操作說明與注意事項（使用者擁有，可匯出 PDF） |
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

- 存在 Claude artifact 的 `db` capability：`data/users/<user.id()>/tob`（JSON 字串分段存，每段 6 萬字，`tob_p1`…）、訂單截圖 `data/users/<id>/img_<訂單編號>`（WebP data URL，<185KB）。每人只看得到自己的。
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
```

每支最後印出 `ERRORS []` 或 `[]` 代表沒有 JS 錯誤；`overflow: []` 代表沒有左右溢出。沙盒連不到 Google 字型、cdnjs、github.io 屬正常。**iPhone Safari 的實際排版無法在這裡測**（例如日期欄位寬度），改版面後請使用者用手機確認。

## 使用者的偏好（做決定時參考）

- 介面要整齊、乾淨、直覺，手機／平板／電腦都好用；能長按複製的就不另外放按鈕。
- 輸出給別人看的內容要不含個資；PDF 是自己存檔用的完整版。
- 發佈網頁與 PDF 的順序固定：航班 → 飯店 →（交通）→ 每日行程（每天先大綱再細節，網頁預設折疊）→ 注意事項。發佈網頁每次隨機配色、不要儀表板。
- 維持用 Claude 讀訂單（不做無 AI 的模式）；LINE 不能傳 .html，分享 STOB 用安裝頁網址。
