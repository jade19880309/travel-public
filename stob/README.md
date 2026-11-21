# STOB 旅遊訂單（分享版）備份

給朋友、家人使用的 TOB 分享版，不含任何個人資料。

- `STOB.html`：完整網頁，一個檔案。要在 Claude 裡發佈成網頁才能用（需開啟 db、user、sample〔允許圖片〕、downloads 這幾項功能）。直接用瀏覽器打開的話，上傳訂單、AI 讀取、存資料都不能用。
- 目前發佈的網址：https://claude.ai/artifact/4ohzsuWP61yy6PtJfYY85a
- `src/`：產生 STOB.html 的原始檔。
  - `build.py`：以私人 repo `travel-private` 裡 TOB 的 `21ce4f8` 版本為基礎（需要同時有 travel-private，可用環境變數 `TOB_REPO` 指定位置），清掉個資後，加上下面幾個檔案，產生 `stob/STOB.html`。在 `stob/src` 裡執行 `python3 build.py`。
  - `data_block.js`：空白資料（取代 TOB 內建的訂單）
  - `cloud.js`：雲端資料、上傳訂單與 AI 讀取、管理頁
  - `plan.js`：建議行程、PDF、一鍵發佈成網頁
  - `cloud.css`、`theme.css`：STOB 的版面與配色
