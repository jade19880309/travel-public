# travel-public

公開的旅程行程網站（GitHub Pages）。

- 網址：`https://jade19880309.github.io/travel-public/?t=<旅程代號>`，預設 `seoul-2027`
- `index.html`：共用外框與樣式；`app.js`：依旅程資料畫出所有區塊
- `trips/<旅程代號>.json`：一個旅程的全部內容（封面、換算幣別、航班、住宿、每日行程、美食、待辦、語句、注意事項）
- `trips/index.json`：旅程清單（頁尾「其他旅程」會列出）

## 新增旅程

1. 複製一份 `trips/*.json` 改內容，放進 `trips/`，並加到 `trips/index.json`
2. 封面圖放 `images/<旅程代號>/`
3. 要加入主畫面圖示：新增 `manifest-<代號>.webmanifest`、`icon-<簡稱>-*.png`，並在 `index.html` 開頭的切換表加一行
4. 把新檔案加進 `sw.js` 的 `CORE`，`VERSION` 加 1

## 隱私

私人資料（訂單編號、PNR、票號、護照、生日、英文姓名、金額、付款狀態、訂單截圖）不放這裡。
只用：航班號、日期、時間、機場、飯店名稱與地址、入住退房日、人數、房型。
