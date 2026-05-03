# CLAUDE.md

## Project Overview

**Agile Life Manager** 是個人敏捷管理 Web 應用，讓使用者以 Scrum/Kanban 方式管理日常生活任務。核心功能包含 Sprint 生命週期自動管理、Kanban 拖曳看板、回顧紀錄、速度趨勢圖表，以及每日站立提醒通知。所有資料持久化於 localStorage，無後端。

---

## Technology Stack

- **React 19.2.5** + **TypeScript 6.0** — 主體框架
- **Vite 8.0** — 建置工具
- **Zustand 4.5.7** — 全域狀態管理（單一 store + persist）
- **Tailwind CSS 3.4** — 樣式
- **dnd-kit/core 6.3 + dnd-kit/sortable 10.0** — 拖曳功能
- **Recharts 3.8** — 速度趨勢圖
- **Playwright 1.59** — E2E 測試
- **date-fns 4.1** — 日期計算

---

## Architecture

單一 Zustand Store，以 Slice 拆分領域邏輯，全部 persist 至 `localStorage['agile-life-app/v1']`。

```
src/
├── types.ts                     # 所有 TypeScript 介面（改 schema 從這裡開始）
├── store/
│   ├── appStore.ts              # Zustand store + persist 設定
│   └── slices/
│       ├── settingsSlice.ts     # 設定（sprint 長度、站立時間）
│       ├── sprintsSlice.ts      # Sprint CRUD
│       └── ticketsSlice.ts      # Ticket CRUD；moveTicket 含 completedAt 邏輯（line 65）
├── lib/
│   ├── sprintLifecycle.ts       # 自動狀態轉換 + sprint 關閉 + carry-over
│   └── notificationScheduler.ts # 每日站立通知（30s polling）
├── components/
│   ├── TicketCard.tsx           # 可拖曳票卡 + 右鍵選單
│   └── SprintBoardColumn.tsx    # 可放置欄位 + inline 建票
└── pages/
    ├── SprintBoardPage.tsx      # Sprint Board 主頁 + sprint 建立
    ├── HistoryPage.tsx          # 速度圖表 + 日期篩選
    ├── RetroPage.tsx            # 回顧筆記
    └── SettingsPage.tsx         # 設定頁
```

**Sprint 狀態機**：`planning → active`（today ≥ startDate）→ `completed`（today > endDate）  
轉換由 `syncSprintStatuses()` 在 app mount 時執行。

---

## Essential Commands

### Validation (Run After Every Change)
- `npx tsc -b` — TypeScript 型別檢查，**MUST PASS**
- `npm run test:e2e` — Playwright E2E（63 tests）
- `npx playwright show-report` — 查看 E2E HTML 報告

### Development
- `npm run dev` — 啟動開發伺服器
- `npm run build` — TypeScript 編譯 + Vite 打包

### Debug
```
F12 → Application → Local Storage → agile-life-app/v1   # 直接查看/編輯狀態
F12 → Network → Disable cache → Refresh                  # 強制完整重整
```

---

## Code Examples

### Zustand Selector Usage

```typescript
// ✅ 只訂閱需要的片段，避免不必要的 re-render
const tickets = useAppStore((s) => s.tickets);
const moveTicket = useAppStore((s) => s.moveTicket);

// ❌ 不要訂閱整個 store
const store = useAppStore();
```

---

## Development Principles

### ALWAYS
- 改動後執行 `npx tsc -b`，型別不過就不算完成
- 拖曳功能**必須在瀏覽器手動測試**，不能只靠 E2E
- Comment 只寫 WHY（為什麼這樣做），不寫 WHAT（做了什麼）
- 匯入純型別時使用 `import type`

### NEVER
- **NEVER 拆 Zustand store**：多個 store 對 localStorage 的寫入不是原子操作，會造成 torn write
- **NEVER 改 localStorage key**（`agile-life-app/v1`）：改了等於清空所有用戶資料
- **NEVER 用 `any`**：型別不確定時用 `unknown` + type narrowing
- **NEVER 覆寫 `completedAt`**：只在第一次進入 `done` 時設定，邏輯在 `ticketsSlice.ts:65-67`
- **NEVER 在 E2E 的 `page.goto()` 前存取 localStorage**：未初始化 origin 會 throw

---

## Known Gotchas

**Sprint 自動轉換驗證方式**：在 DevTools 把某個 sprint 的 `endDate` 改成昨天，重新整理頁面，應自動轉為 `completed`。

**通知為何用 30s polling**：`setTimeout` 在電腦睡眠或 DST 切換後會失準；polling 每次醒來都重新計算當下時間。

**dnd-kit E2E 不穩定**：Playwright 的 pointer 事件模擬和瀏覽器原生行為有差異，dnd-kit 測試偶發失敗是已知問題，不代表功能壞掉。

---

## Data Schema

```typescript
localStorage['agile-life-app/v1'] = {
  settings: {
    sprintLengthDays: 14,
    standupTime: "09:30",
    notificationsEnabled: false
  },
  sprints: [{
    id: uuid, number: 1,
    startDate: "2026-04-29", endDate: "2026-05-13",
    status: "planning" | "active" | "completed",
    plannedPoints: 16, completedPoints: 8,
    retrospective?: string
  }],
  tickets: [{
    id: uuid, title: string, description?: string,
    points: 1 | 2 | 3 | 5 | 8 | 13 | 21,
    status: "todo" | "doing" | "blocking" | "done",
    sprintId: uuid, createdAt: ISO8601,
    completedAt?: ISO8601, carriedFromSprintId?: uuid
  }]
}
```