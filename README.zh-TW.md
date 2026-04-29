# 🚀 敏捷人生管理系統

用敏捷方法論管理你的人生。一個個人的、單機的網頁應用，用來規劃衝刺、追蹤速度，以及用看板方式組織每日工作。

**[English Version](./README.md)**

---

## ✨ 主要功能

- 📋 **衝刺規劃** — 建立可配置週期的衝刺，使用費氏數列估算工作點數
- 🎯 **看板** — 拖拽式票務流轉，跨越 4 個欄位：To-do、Doing、Blocking、Done
- 📊 **速度追蹤** — 用互動式圖表呈現每個衝刺完成的點數
- ⏰ **每日站立式會議提醒** — 在你設定的時間推送瀏覽器通知
- 💾 **離線優先** — 所有資料存在瀏覽器的 localStorage，無需後端
- 🔄 **智慧衝刺結束** — 未完成的票務自動帶到下一個衝刺
- 🎨 **簡潔 UI** — 用 Tailwind CSS 打造的現代、響應式介面

---

## 🛠️ 技術棧

| 類別 | 技術 |
|------|------|
| **框架** | React 19 + TypeScript |
| **構建工具** | Vite |
| **狀態管理** | Zustand v4（含持久化中間件） |
| **路由** | React Router v6 |
| **樣式** | Tailwind CSS v3 |
| **圖表** | Recharts |
| **拖拽** | @dnd-kit/core + @dnd-kit/sortable |
| **日期** | date-fns |
| **資料存儲** | localStorage |

---

## 🚀 快速開始

### 前置要求
- Node.js 16+
- npm 或 yarn

### 安裝

```bash
# 進入專案目錄
cd agile-life-manager

# 安裝依賴
npm install

# 啟動開發伺服器
npm run dev
```

在瀏覽器中開啟 [http://localhost:5173](http://localhost:5173)。

---

## 📖 使用指南

### 1. **設定**
進入 `/settings` 頁面來：
- 設定衝刺週期（預設：14 天）
- 配置每日站立式會議時間（HH:mm 格式）
- 啟用瀏覽器通知

```
⚙️ 設定
├── 衝刺週期：7-30 天
├── 站立時間：09:30（可自訂）
└── 通知：啟用/禁用
```

### 2. **規劃衝刺**
前往 `/plan` 頁面來：
- 建立從今天開始的新衝刺
- 新增票務，並用費氏數列估算點數（1, 2, 3, 5, 8, 13, 21）
- 上個衝刺未完成的票務會自動載入以供帶過

```bash
# 範例：建立衝刺 #1
開始日期：2026-04-29
週期：14 天
新增票務：
  ✓ 使用者認證（5 點）
  ✓ 儀表板 UI（8 點）
  ✓ 設定資料庫（3 點）
```

### 3. **看板工作**
首頁 (`/`) 顯示當前衝刺的看板：
- **拖拽票務** 在欄位間流轉：`待做 → 進行中 → 完成`
- **標記受阻** 來突顯阻礙事項
- **即時計數** 顯示規劃點數 vs 完成點數

```
待做 | 進行中 | 受阻 | 完成
 5點  |  8點   | 2點  | 3點
```

### 4. **每日站立提醒**
在你設定的時間（如 09:30），應用會推送通知：
- 提醒文字：「該站立式會議了！」
- 寬限窗口：5 分鐘（考慮筆電喚醒延遲）
- 每天每個瀏覽器分頁只推送一次

### 5. **衝刺檢視**
當衝刺結束時，進入 `/review` 頁面來：
- 比較規劃點數 vs 完成點數
- 檢視已完成和未完成的票務
- 自動把未完成的票務帶到下一個衝刺

```
衝刺 #1 結果
規劃：16 點
完成：13 點（81%）

📊 將 3 個未完成的點數帶到衝刺 #2
```

### 6. **速度分析**
進入 `/history` 頁面來查看趨勢：
- **折線圖**：每個衝刺的完成點數
- **柱狀圖**：規劃點數 vs 完成點數的對比
- **摘要表格**：逐衝刺的詳細資料

---

## 📁 專案結構

```
agile-life-manager/
├── src/                              # 應用程式原始碼
│   ├── App.tsx                       # 路由和佈局設定
│   ├── main.tsx                      # 進入點
│   ├── types.ts                      # TypeScript 介面
│   ├── index.css                     # Tailwind 指令
│   ├── components/
│   │   ├── Layout.tsx                # 側邊欄導航 + 內容區
│   │   ├── KanbanColumn.tsx          # 可拖放的欄位
│   │   ├── TicketCard.tsx            # 票務卡片元件
│   │   └── PointsPicker.tsx          # 費氏數列選擇器
│   ├── pages/
│   │   ├── KanbanPage.tsx            # 當前衝刺看板
│   │   ├── SprintPlanningPage.tsx    # 規劃介面
│   │   ├── SprintReviewPage.tsx      # 衝刺檢視
│   │   ├── HistoryPage.tsx           # 速度圖表 + 編輯/刪除功能
│   │   └── SettingsPage.tsx          # 應用設定
│   ├── store/
│   │   ├── appStore.ts               # Zustand 儲存（單一、持久化）
│   │   └── slices/
│   │       ├── settingsSlice.ts      # 設定狀態
│   │       ├── sprintsSlice.ts       # 衝刺 CRUD
│   │       └── ticketsSlice.ts       # 票務 CRUD
│   └── lib/
│       ├── notificationScheduler.ts  # 30 秒輪詢提醒機制
│       └── sprintLifecycle.ts        # 衝刺結束和帶過邏輯
├── tests/                            # 測試源代碼
│   ├── e2e/
│   │   └── e2e.test.ts               # Playwright E2E 測試
│   └── playwright.config.ts          # Playwright 測試設定
├── .claude/                          # 專案文檔
│   ├── test-protocol.md              # 3 級測試檢查清單
│   └── subagent-test-prompt-template.md # 測試模板
├── .artifacts/                       # 生成的文件（不提交到 git）
│   ├── build/                        # Vite 生產構建
│   └── test-results/                 # Playwright 測試結果和截圖
├── public/                           # 靜態資源
├── package.json
├── vite.config.ts                    # Vite 構建設定（輸出：.artifacts/build）
├── tsconfig.json
├── tailwind.config.js
├── postcss.config.js
├── CLAUDE.md                         # 專案上下文和已知注意事項
├── README.md                         # 英文說明文檔
└── README.zh-TW.md                   # 繁體中文說明文檔（此文件）
```

**注意**：`.artifacts/` 目錄包含構建和測試的生成文件。它被排除在 git 之外（參見 `.gitignore`）。
- `build/` — Vite 生產構建（執行 `npm run build`）
- `test-results/` — Playwright 測試截圖和報告（執行 `npm run test:e2e`）

---

## 🎮 開發說明

### 為生產版本構建
```bash
npm run build    # TypeScript 檢查 + Vite 構建
npm run preview  # 本地測試生產版本
```

### 程式碼檢查和格式化
```bash
npm run lint     # 執行 ESLint
```

### 架構設計說明

**單一儲存模式**
- 所有狀態集中在一個 Zustand 儲存中，包含三個切片：`settings`、`sprints`、`tickets`
- 持久化到 localStorage，金鑰為 `agile-life-app/v1`
- 原子性寫入確保資料一致性

**通知策略**
- 使用 30 秒輪詢間隔（能應對電腦睡眠、DST、時鐘變化）
- 通過 `lastStandupNotified` 日期檢查防止重複推送
- 若瀏覽器分頁關閉，優雅降級（不推送）

**衝刺生命週期**
- 衝刺結束時，`sprintLifecycle.ts` 原子地執行：
  1. 將衝刺標記為已完成，快照完成點數
  2. 複製未完成票務到新的規劃狀態衝刺
  3. 設定 `carriedFromSprintId` 以追蹤來源

---

## 🔌 localStorage 資料結構

資料持久化在 `agile-life-app/v1` 下：

```typescript
{
  settings: {
    sprintLengthDays: number      // 預設：14
    standupTime: string            // "HH:mm" 格式，預設："09:30"
    notificationsEnabled: boolean  // 預設：false
  }
  sprints: [
    {
      id: string                   // UUID
      number: number               // 1, 2, 3...
      startDate: string            // "YYYY-MM-DD"
      endDate: string              // "YYYY-MM-DD"
      status: 'planning' | 'active' | 'completed'
      plannedPoints: number
      completedPoints: number
    }
  ]
  tickets: [
    {
      id: string
      title: string
      description?: string
      points: 1 | 2 | 3 | 5 | 8 | 13 | 21
      status: 'todo' | 'doing' | 'blocking' | 'done'
      sprintId: string
      createdAt: string            // ISO 日期時間
      completedAt?: string         // 第一次移到完成時設定，之後不覆蓋
      carriedFromSprintId?: string // 追蹤帶過來源
    }
  ]
}
```
