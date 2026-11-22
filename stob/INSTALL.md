# 給 Claude 的說明：幫使用者發佈 STOB 旅遊訂單

使用者想在自己的 Claude 帳號裡建立一份「STOB 旅遊訂單」網頁（整理旅遊訂單的工具，資料存在使用者自己的帳號）。請照下面步驟做，**不要修改檔案內容**。

1. 取得檔案：**用程式碼執行環境（shell）下載**，不要用網頁擷取／web fetch 工具（那會把 HTML 轉成文字，檔案就壞了）：
   ```
   curl -fsSL -o STOB.html https://raw.githubusercontent.com/jade19880309/travel-public/main/stob/STOB.html
   ```
   下載後確認：檔案約 340–360 KB、開頭是 `<!DOCTYPE html>`、裡面有 `STOB`。
   - 下載不到（沒有程式碼執行、網路被擋、檔案不對）的話，請使用者打開 `https://jade19880309.github.io/travel-public/stob/`，按「下載 STOB.html」，再把檔案附加到這個對話，然後用附加的檔案繼續。
2. 把這個檔案**原封不動**發佈成使用者的新網頁（artifact），標題用「STOB 旅遊訂單」，入口檔名 `index.html`。
3. 幫這個網頁開啟（declare）以下功能，完整設定如下：

```json
{
  "db": { "rules": [
    { "path": "", "read": "admin", "write": "admin" },
    { "path": "data/users/{self}", "read": "interact", "write": "interact" }
  ] },
  "user": {},
  "sample": { "images": true },
  "downloads": true
}
```

   - `db`：每個人的訂單只存在自己的 `data/users/<id>` 底下，別人看不到。
   - `sample`（含圖片）：讓網頁用使用者自己的 Claude 額度讀訂單截圖、排行程。
   - `downloads`：讓網頁可以下載 PDF 和行程網頁檔。
4. 完成後把網頁網址給使用者，並提醒：第一次上傳訂單時，Claude 會問要不要允許這個網頁使用 Claude，請按允許。

如果這個帳號不能建立網頁或開啟上述功能，請直接告訴使用者是哪一步做不到，不要改用其他方式或修改檔案。
