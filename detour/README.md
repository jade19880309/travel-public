# 偏航 DETOUR（旅遊訂單分享版）

給朋友、家人使用的 TOB 分享版，不含任何個人資料。（2026-11-26 起一律叫 DETOUR／偏航，資料夾由 `stob/` 改成 `detour/`，舊名稱 STOB 不再使用，避免和使用者自己的 TOB 搞混。）

- `DETOUR.html`：完整網頁，一個檔案。要在 Claude 裡發佈成網頁才能用（需開啟 db、user、sample〔允許圖片〕、downloads 這幾項功能）。直接用瀏覽器打開的話，上傳訂單、AI 讀取、存資料都不能用。
- `index.html`：給朋友的安裝頁，網址 https://jade19880309.github.io/travel-public/detour/ 。三個步驟：開 Claude 設定、複製一句話、貼到 Claude 新對話。
- `INSTALL.md`：給 Claude 看的發佈說明（從哪裡下載 DETOUR.html、要開啟哪些功能）。改了功能設定時要一起更新。
- `guide.html`：使用說明網頁（版本歷程由 `src/detour.py` 自動寫入）。
- 使用者自己的偏航：https://claude.ai/artifact/496uU5hwcxG7zLQtdfd1P1
- `src/`：產生 DETOUR.html 的原始檔，分兩步：
  1. `build.py`：以私人 repo `travel-private` 裡 TOB 的 `21ce4f8` 版本為基礎（需要同時有 travel-private，可用環境變數 `TOB_REPO` 指定位置），清掉個資後，加上下面幾個檔案，產生底稿 `src/base.html`（只是中間產物，不是給人用的）。
  2. `detour.py`：以 `src/base.html` 為底，套上偏航的品牌、雙主題、版本號，產生 `DETOUR.html`，並同步 `guide.html` 的版本歷程。版本號與歷程在 `src/versions.json`。
  - `data_block.js`：空白資料（取代 TOB 內建的訂單）
  - `cloud.js`：雲端資料、上傳訂單與 AI 讀取、管理頁
  - `plan.js`：建議行程、PDF、一鍵發佈成網頁
  - `cloud.css`、`theme.css`：底稿的版面與配色；`detour.css`、`detour.js`：偏航品牌圖層
  - `pub.css`：發佈網頁的樣式
