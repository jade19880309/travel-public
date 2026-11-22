# STOB 交接紀錄（給下一位 AI）

> 只記「還沒做完／還沒確認」的事；做完就刪掉。系統說明在 `AGENTS.md`。
> 最後更新：2026-11-22

## 進行中

目前沒有做到一半的工作。

## 還沒實測（需要使用者用手機或朋友的帳號試）

- **真的由 Claude 讀訂單、排行程**：測試都用假 AI 回覆，提示詞（`cloud.js` 的 `AI_RULES`、`plan.js` 的 `PLAN_RULES`／`PLAN_FMT`）在真實訂單上的準確度未知。
- **安裝頁流程**：朋友的 Claude 能不能照 `INSTALL.md` 自己抓到 `raw.githubusercontent.com` 上的 `STOB.html` 並宣告 capabilities；免費方案能不能建立／發佈網頁（官方文件沒寫清楚）。安裝頁 https://jade19880309.github.io/travel-public/stob/ 是否已上線也沒在沙盒確認過。
- **iPhone 排版修正**：拿掉 `viewport-fit=cover`（避免被 Claude App 頂部按鈕蓋住）、日期欄位不撐寬（`theme.css`）——只在 Chrome 模擬過。
- **iPhone 下載 PDF／網頁檔**：`downloads.save` 在 Claude iOS App 的表現；失敗時會改成圖片顯示（PDF）或複製原始碼（網頁）。
- **雲端版本保護（v2 格式）**：只在假 db 測過；真實 Claude db 的 `acquire` 回傳格式若不同，`takeLease` 會當作成功（不會卡住，但少一層保護）。兩台手機同時改同一份資料的實際情況待使用者試。
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
