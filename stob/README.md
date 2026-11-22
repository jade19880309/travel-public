# STOB 旅遊訂單（分享版）備份

給朋友、家人使用的 TOB 分享版，不含任何個人資料。

- `STOB.html`：完整網頁，一個檔案。要在 Claude 裡發佈成網頁才能用（需開啟 db、user、sample〔允許圖片〕、downloads 這幾項功能）。直接用瀏覽器打開的話，上傳訂單、AI 讀取、存資料都不能用。
- `index.html`：給朋友的安裝頁，網址 https://jade19880309.github.io/travel-public/stob/ 。三個步驟：開 Claude 設定、複製一句話、貼到 Claude 新對話。
- `INSTALL.md`：給 Claude 看的發佈說明（從哪裡下載 STOB.html、要開啟哪些功能）。改了功能設定時要一起更新。
- 目前發佈的網址：https://claude.ai/artifact/TTqqsARKJQDnMJi1tQJJdQ（2026-11-22 重新發佈；舊網址已讀不到）
- `src/`：產生 STOB.html 的原始檔。
  - `build.py`：以私人 repo `travel-private` 裡 TOB 的 `21ce4f8` 版本為基礎（需要同時有 travel-private，可用環境變數 `TOB_REPO` 指定位置），清掉個資後，加上下面幾個檔案，產生 `stob/STOB.html`。在 `stob/src` 裡執行 `python3 build.py`。
  - `data_block.js`：空白資料（取代 TOB 內建的訂單）
  - `cloud.js`：雲端資料、上傳訂單與 AI 讀取、管理頁
  - `plan.js`：建議行程、PDF、一鍵發佈成網頁
  - `cloud.css`、`theme.css`：STOB 的版面與配色
  - `pub.css`：發佈網頁的樣式

- `DETOUR.html`：偏航 DETOUR（STOB 更名＋浪漫改版），由 `src/detour.py` 以 `STOB.html` 為底產生；版本號與歷程在 `src/versions.json`，同步寫入 `guide.html`。
