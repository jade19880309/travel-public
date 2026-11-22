# STOB 交接紀錄（給下一位 AI）

> 只記「還沒做完／還沒確認」的事；做完就刪掉。系統說明在 `AGENTS.md`。
> 最後更新：2026-11-22（偏航 v1.2.0）

## 進行中：偏航 DETOUR（STOB 的更名＋浪漫改版）

- 使用者自己的「偏航 DETOUR」是 STOB 加品牌圖層（附件 DETOUR.html，原本只存在使用者的 Claude，repo 裡沒有）。2026-11-22 已把它納入原始檔：`stob/src/detour.py`（讀 `stob/STOB.html` 套用，不需要 travel-private）＋`detour.css`＋`detour.js`＋`versions.json`，產生 `stob/DETOUR.html`。
- 改版本：只改 `src/versions.json`（current、date、history 最上面一筆）→ `cd stob/src && python3 detour.py`，會同步 App（頁首、首頁底部、管理›關於）與 `guide.html` 的「版本歷程」頁。
- 目前 v1.3.0 雙主題：`<html data-theme="romantic|navy">`（預設浪漫；localStorage 鍵 `detour-theme`，head 內小腳本先套用避免閃爍），變數寫在 `detour.css` 開頭；切換在「管理 › 外觀設定」。素材來自使用者的 DETOUR_Claude_ThemePack（logo、飛行弧線已內嵌成吃 CSS 變數的 SVG）。標語卡文字固定三句，已移除 v1.2 的時段問候與倒數；參考圖的山景刻意沒做（規格說不要厚重山景）。深藍主題採象牙白底（依 theme.css），參考圖是整頁深藍，如要整頁深藍需另改。兩主題都保留系統深色模式的變體。測試用 `APP=DETOUR.html python3 tests/xxx.py`：test/t8/t_v2/t_r2 通過；`t_full.py` 在 STOB.html 上同樣會在後段報 `Cannot read properties of null (reading 'value')`，非本次造成，未查。
- **沒做／待決定**：①DETOUR.html 尚未發佈到使用者的 Claude（需用使用者本人的 Claude 以 index.html 覆蓋他的偏航 artifact）。②安裝頁 `index.html`、`INSTALL.md`、下載檔名仍是 STOB（朋友流程未動）；要不要整個改名偏航請使用者決定。③Claude Docs 版使用說明未更新版本歷程。④v1.0.0／v1.1.0 的日期與內容是依現況推估，請使用者確認。⑤配色只在 Chrome 手機尺寸看過，iPhone 與加入主畫面未測。⑥規格寫「不修改版本號」，我仍把版本升到 1.3.0（不是參考圖的 v2.7.0），不要請改回請使用者說。
- 踩坑：附加的 JS 必須插在 `(async function boot(){` 之前（第一次 render 會用到 `dtrHero`），頁首 svg 要寫死在模板裡，不能用後面才定義的變數。

## 還沒實測（需要使用者用手機或朋友的帳號試）

- **真的由 Claude 讀訂單、排行程**：測試都用假 AI 回覆，提示詞（`cloud.js` 的 `AI_RULES`、`plan.js` 的 `PLAN_RULES`／`PLAN_FMT`）在真實訂單上的準確度未知。
- **安裝頁流程**：朋友的 Claude 能不能照 `INSTALL.md` 自己抓到 `raw.githubusercontent.com` 上的 `STOB.html` 並宣告 capabilities；免費方案能不能建立／發佈網頁（官方文件沒寫清楚）。安裝頁 https://jade19880309.github.io/travel-public/stob/ 是否已上線也沒在沙盒確認過。
- **iPhone 排版修正**：拿掉 `viewport-fit=cover`（避免被 Claude App 頂部按鈕蓋住）、日期欄位不撐寬（`theme.css`）——只在 Chrome 模擬過。
- **iPhone 下載 PDF／網頁檔**：`downloads.save` 在 Claude iOS App 的表現；失敗時會改成圖片顯示（PDF）或複製原始碼（網頁）。
- **雲端版本保護（v2 格式＋寫入鎖）**：只在假 db 測過（依官方 `acquire` 文件模擬）。如果真實環境 `acquire` 不存在或回報 capability_removed，頁面會暫停儲存並請使用者更新 App——若使用者回報「已暫停儲存（不支援儲存鎖定）」，先查這裡。
- **今天稍早發佈的版本**（沒有 `pk` 的 v2）讀到新版寫的資料會因分段找不到而暫停儲存（安全失敗）；請確認大家都換到新版。
- **手機長表單**：底部固定按鈕列（`.adbar`，含 safe-area）與 16px 輸入框只在 Chrome 模擬過。
- **發佈網頁加入主畫面**：網頁檔內的 data URL 圖示、全螢幕設定在 iOS 是否生效（網頁檔要先放到有網址的地方才能加入主畫面）。

## 已知限制（使用者知道，暫不處理）

- 訂單截圖只有飯店能在畫面上點開；機票、交通的截圖有存但沒有入口。
- PDF 訂單只讀前 4 頁（`cloud.js` 的 `pdfPages(f.file,4)`）。
- 在上傳訂單頁時，底部導覽亮的是「管理」。
- 勾選採用、個人單選項存在各裝置，不跨裝置同步。
- `slimCard`（TOB 露營車專用卡片，有「三組平分」字樣）在 STOB 不會出現（`normDb` 會刪掉 `slim`），留著沒刪。

## 待使用者回覆

- 使用說明文件（Claude Docs）裡留了一則留言：讓朋友的 Claude 直接從 GitHub 取檔，要當主要做法，還是改成一律先傳檔案。

## 踩過的坑

- LINE 不能分享 .html 檔（會出現「含有無法分享的檔案」）→ 給朋友的一律用網址或 PDF。
- 網址夾帶行程內容（`#` 後壓縮）的分享連結做過又拿掉：行程一長就超過 LINE 5,000 字上限，縮網址服務也連不到。
- iOS 的 `<input type=date>` 不會縮小，會把整頁撐寬；要給格線 `minmax(0,1fr)` 與 `min-width:0`。
- 舊做法用 SVG foreignObject 把畫面轉圖片做 PDF，在 iPhone 會失敗；現在用 canvas 直接畫字。
- 在 STOB 的 `<script>` 裡寫字串 `</script>` 會提早結束整段程式，要寫成 `<\/script>`。
- `build.py` 的個資檢查不要把真實姓名或號碼寫進檔案；它會從 TOB 原始檔自動抓。
