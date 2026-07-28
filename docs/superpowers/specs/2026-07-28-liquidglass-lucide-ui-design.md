# LiquidGlass 與 Lucide Icons UI 設計

日期：2026-07-28

## 目標

統一智能快捷回覆插件的視覺語言：

- 候選框最外層使用透明 LiquidGlass。
- 候選回覆按鈕與刷新按鈕使用暗色 LiquidGlass。
- 插件內所有既有符號、Emoji 與 Font Awesome 圖標統一替換為 Lucide Icons。
- 保留圓角、可讀性、無障礙資訊與目前的低延遲操作體驗。

## 範圍

本次包含候選回覆面板與插件設定介面，不改動 API、提示詞生成、候選解析或觸發邏輯。

### 候選回覆面板

- 面板大背景
- 四個候選回覆按鈕
- 刷新按鈕
- 拖曳把手
- 推進劇情標記
- 手動生成按鈕

### 設定介面

- 根抽屜展開圖標
- 各設定區塊展開圖標
- 色彩選單展開圖標
- 重置彈出位置按鈕
- 取得模型列表按鈕
- 恢復預設提示詞按鈕
- 清空 Debug 按鈕

## 視覺設計

### 透明面板玻璃

面板大背景使用 `@ybouane/liquidglass` 的玻璃表面設定。它保持目前 30px 圓角，降低不透明度，呈現可看見後方內容的透明玻璃，同時保留官方折射與模糊效果。

面板本身在 LiquidGlass 就緒後不疊加自製背景、陰影或 backdrop filter。場景底色僅作為該 UI 庫的渲染背景與載入失敗時的 fallback。

### 暗色按鈕玻璃

候選回覆與刷新控制使用同一套 LiquidGlass 官方按鈕設定：

- 啟用 `button: true`
- 使用負亮度形成暗色玻璃
- 保留官方按鈕互動回饋
- 使用膠囊形圓角
- 文字與圖標維持足夠對比

不為每個控制建立獨立 WebGL 實例；所有玻璃元素仍由一個隔離的 LiquidGlass 根節點和一個初始化流程管理。

### CSS fallback

LiquidGlass 尚未載入或初始化失敗時，面板使用低成本半透明背景，按鈕使用暗色半透明背景。fallback 保持相同圓角與層級，但不模擬或重寫 UI 庫的 shader 效果。

## Lucide Icons

專案目前沒有前端打包流程，因此採用本地精簡 Lucide SVG 圖標集。圖標資料來自 Lucide 官方圖標，不在執行時載入完整 Lucide CDN。

集中提供一個建立圖標的介面，統一：

- `viewBox`
- `fill="none"`
- `stroke="currentColor"`
- 線寬、端點與轉角
- 尺寸 class
- `aria-hidden`

圖標對應如下：

| 介面位置 | Lucide 圖標 |
| --- | --- |
| 拖曳把手 | `GripVertical` |
| 刷新候選 | `RefreshCw` |
| 推進劇情標記 | `TrendingUp` |
| 根抽屜與設定區塊 | `ChevronDown` |
| 手動生成 | `Sparkles` |
| 重置彈出位置 | `MapPinOff` |
| 取得模型列表 | `ListRestart` |
| 恢復預設提示詞 | `Undo2` |
| 清空 Debug | `Trash2` |
| 色彩選單 | `ChevronDown` |

純圖標控制保留中文 `aria-label`、`title` 與鍵盤焦點。文字按鈕中的圖標為裝飾用途，標記為 `aria-hidden="true"`。

## 元件與資料流

圖標建立器只負責產生 SVG，不持有狀態。候選內容更新時只更新文字節點與推進圖標的顯示狀態，避免以 `textContent` 覆蓋按鈕內的 SVG。

LiquidGlass 設定仍由既有控制器管理：

1. 面板顯示時配置玻璃元素並初始化。
2. 面板隱藏時釋放 LiquidGlass 資源。
3. 面板再次顯示時安全地重新初始化。
4. 插件卸載時永久銷毀控制器。

## 效能限制

- 全部候選框只允許一個 LiquidGlass 初始化呼叫。
- 不為 Lucide 圖標載入額外字型、完整圖標庫或遠端執行時。
- 不增加持續動畫；刷新圖標只可在載入狀態使用 CSS transform 動畫，並遵守 `prefers-reduced-motion`。
- 拖曳流程沿用 `requestAnimationFrame` 排程。
- 隱藏面板時不保留活躍 LiquidGlass 資源。

## 測試與驗收

### 自動測試

- 驗證面板透明玻璃與按鈕暗色玻璃使用不同官方設定。
- 驗證仍只有一次 `LiquidGlass.init`。
- 驗證所有舊 Emoji、Font Awesome 與文字箭頭已移除。
- 驗證每個指定位置使用正確 Lucide 圖標。
- 驗證候選文字更新不會刪除按鈕內圖標。
- 驗證純圖標按鈕仍有中文無障礙名稱。
- 執行完整 `npm test` 與 JavaScript 語法檢查。

### 視覺驗收

- 大背景明顯比按鈕透明。
- 四個候選按鈕與刷新按鈕呈暗色玻璃。
- 面板與按鈕圓角完整可見。
- Lucide 圖標線條、尺寸與文字基線一致。
- 深色及淺色主題下文字與圖標皆清晰。
- 候選生成、刷新、拖曳和設定抽屜操作無明顯卡頓。

## 非目標

- 不新增圖標選擇設定。
- 不改造 SillyTavern 本體的圖標。
- 不替換插件以外的 Font Awesome。
- 不引入新的 UI 框架或建置工具。
- 不改動候選生成與 API 行為。
