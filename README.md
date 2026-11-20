# travel-public

公開的旅程行程網站（GitHub Pages）。

- 首爾：`https://jade19880309.github.io/travel-public/?t=seoul-2027`（`index.html`；分享與連結一律用這個網址，不加參數也能開）
- 全部旅程總覽：`https://jade19880309.github.io/travel-public/home.html`（`home.html`，依 `trips/index.json` 自動列出每趟旅程，可左右滑動切換；主色寫在頁內 `ACC`、切換按鈕短名稱寫在 `SHORT`）
- 港珠澳：`https://jade19880309.github.io/travel-public/hk.html`（分享到 LINE 請用這個網址，縮圖才會是港珠澳）
- 東京：`https://jade19880309.github.io/travel-public/tokyo.html`（四套行程方案可切換；分享用這個網址）
- `index.html`、`hk.html`、`tokyo.html`：各旅程的入口頁（名稱、圖示、主題寫死在網頁開頭，才能正確「加入主畫面」）
- `style.css`：共用樣式；`app.js`：依旅程資料畫出所有區塊
- `trips/<旅程代號>.json`：一個旅程的全部內容（封面、換算幣別、航班、住宿、每日行程、美食、待辦、語句、注意事項）
- `trips/index.json`：旅程清單（頁尾「其他旅程」會列出）

## 新增旅程

1. 複製一份 `trips/*.json` 改內容，放進 `trips/`，並加到 `trips/index.json`
2. 封面圖放 `images/<旅程代號>/`
3. 每個旅程要有自己的入口頁：複製 `hk.html`，改開頭的 manifest、圖示、標題，以及 `var id='<旅程代號>'`；
   新增 `manifest-<代號>.webmanifest`（`id`、`start_url`、`scope` 都指向這個入口頁）與 `icon-<簡稱>-*.png`；
   並在 `trips/index.json` 的 `url` 填入入口頁檔名。
   （入口頁的外框要和 `index.html` 保持同步，改動頁面骨架時兩邊都要改。）
4. 把新檔案（含入口頁）加進 `sw.js` 的 `CORE`，`VERSION` 加 1

## 旅程專用設定（寫在各旅程的 JSON 裡）

- `weather`（可省略）：封面下方「目前當地天氣」的城市清單，`[{"name":"首爾","lat":37.57,"lon":126.98}]`；資料來自 Open-Meteo（免金鑰），每 30 分鐘更新，沒網路時顯示上次結果。
- `amap`（可省略）：大陸地點加「高德地圖」按鈕，`{"city":"珠海","places":[地點代號],"regions":[美食分區],"q":{地點:簡體搜尋字}}`。港珠澳使用。
- `nav`：上方功能列的順序，**頁面區塊也會照這個順序排列**；沒列在 `nav` 的區塊不會顯示。
- `meta.single: true`：全程同一種語言，不顯示第二個名稱（當地語言副標）。港珠澳使用。
- `hero.bare: true`：封面圖本身已含標題時使用，圖片完整顯示在上方，日期與倒數放在下方，不再疊標題文字。
- `dayImages`（可省略）：每日行程的「當日行程圖」按鈕；沒有這個欄位就不會出現按鈕。
- `plans`（可省略）：同一趟旅程有多個方案時使用，`[{"id","name","label","sub","desc","days","hotels","plan"}]`。
  每日行程上方會出現方案切換按鈕，每個方案各有自己的 `days` 與 `hotels`；選擇存在這支手機，網址加 `?p=<方案 id>` 可直接指定。東京使用。
- `banners`（可省略）：`{區塊id: HTML}`，插圖橫幅放在該區塊標題下方；`icBase`＋每天的 `ic`：日期列左邊的小插圖（`<icBase><ic>.svg`）。東京使用，插圖在 `images/tokyo-2027/`。
- 每一天預設都是折疊的；旅程期間打開網頁會自動展開「今天」。

## 航班登機證配色

航班卡片依航班號前兩碼套用航空公司配色（`style.css` 的 `al-br` 長榮、`al-ci` 華航、`al-ke` 大韓、`al-ak` 亞航），新航空公司照同樣格式加一組即可；沒列到的維持旅程主題色。只用顏色，不放航空公司標誌。航班資料可加 `ac`（機型），會在登機證上顯示一行淺色小字。

## 專用主題

入口頁可以指定主題：在 `<html>` 加上 `class="th-<代號>"`，並在 `style.css` 之後載入 `theme-<代號>.css`
（港珠澳是 `hk.html` 的 `th-bay` 與 `theme-bay.css`；東京是 `tokyo.html` 的 `th-fuji` 與 `theme-fuji.css`，結構沿用 bay 主題、只換主色）。主題只覆寫顏色與少數元件，
`index.html`（首爾）是 `th-han` 與 `theme-han.css`（雪夜紅梅，結構同樣沿用 bay 主題）。

## 加入主畫面

一定要從該旅程自己的入口頁網址加入（首爾 `/?t=seoul-2027`、港珠澳 `/hk.html`、總覽 `/home.html`，總覽圖示是 `icon-home-*.png` 與 `manifest-home.webmanifest`）。舊網址 `index.html?t=hk-2027` 會自動轉到 `hk.html`。
若以前從舊網址加入過，請刪掉主畫面上的圖示，再從 `hk.html` 重新加入一次。

## 更換封面圖

封面圖請**用新的檔名**（例如 `hero-ink.jpg`），再同步改 JSON 的 `hero.img` 與 `sw.js` 的 `CORE`、`VERSION` 加 1。
同檔名替換的話，已經存在手機裡的舊圖要等第二次開啟才會更新。

## 隱私

私人資料（訂單編號、PNR、票號、護照、生日、英文姓名、金額、付款狀態、訂單截圖）不放這裡。
只用：航班號、日期、時間、機場、飯店名稱與地址、入住退房日、人數、房型。

## 分享縮圖（LINE／FB 預覽）

LINE 不會執行 JavaScript，只讀入口頁開頭寫死的 `og:title`、`og:description`、`og:image`，
所以 `?t=...` 參數不會改變縮圖。每個入口頁都要有自己的 `og:` 標籤，縮圖放 `images/<代號>/og.jpg`（1200×675）。
分享時請用該旅程自己的入口頁網址。
