# 交接紀錄（給下一位 AI）

> 這份檔案記錄「進行中的工作」。每完成一段就更新；做完的項目打勾。
> 專案說明請看 `README.md`（旅程 JSON 結構、新增旅程步驟、改動後 `sw.js` 的 `VERSION` 要加 1）。

## 工作流程備忘
- 改 `trips/*.json` 用「精準字串取代」，不要整份 `json.dump`（檔案是手排格式，會造成整份 diff）。
- 改完一定跑：`python3 -c "import json;json.load(open('trips/XXX.json',encoding='utf-8'))"`，再用 Playwright 開 `python3 -m http.server` 實測。
- 外網字型／天氣在沙盒會 `ERR_TUNNEL_CONNECTION_FAILED`，屬正常，不是 bug。
- 推送用：`git -c push.negotiate=true push origin main`；每次推送前把 `sw.js` 的 `VERSION` 加 1。
- 營業時間、價格皆來自網路整理，標了「依來源／需確認」的不要寫成確定事實。

## 本輪使用者需求（2026-11-21）
### A. 首爾頁（`trips/seoul-2027.json`）
- [x] 行程「接機」「租車」與價格頁互相連結（行程 → 價格卡 `#p-pickup` / `#p-rental`，價格卡 → 回對應日）
- [x] 美食新增「🍳 早餐」分頁（飯店附近 8 家）；行程所有「早餐」列自動帶「看美食推薦」連結（靠 `app.js` 的 `foodKey`：分頁名稱含「早餐」即可比對）
- [x] 2/7 初一（週日）早餐提醒寫進 Day 5 備註
- 新增的共用功能：`app.js` 的 `a[data-to]`（捲到卡片）、`a[data-day][data-ab]`（切到某天）；樣式 `a.xl`（`style.css`）

### B. 京阪頁（`trips/keihan-2027.json`）
- [ ] 不去奈良、宇治
- [ ] 一天「清水寺線」
- [ ] 一天「貴船線」
- [ ] 依人潮重新安排時間（需查證：清水寺、貴船、貴船神社、鞍馬寺等的人潮與開放時間）
- [ ] 每日路線重新排版（日期底下）

## 已知待辦／未解
- `jade19880309/travel-private` 的舊分支 `add-trip-web-links` 刪除失敗（連線中斷），不影響功能，可日後 `git push origin --delete add-trip-web-links`。
- 回程「明洞 → 仁川機場」價格卡尚未與 Day 6 行程互連（使用者只要求接機與租車）。
