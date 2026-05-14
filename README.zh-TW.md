# 敏捷人生管理系統

用 Scrum 方法論管理你的人生。一個個人的、單機的網頁應用，用來規劃 Sprint、追蹤速度，以及在 Sprint Board 上組織每日工作。

**[English Version](./README.md)**

---

## 主要功能

- **Sprint 規劃** — 建立可配置週期的 Sprint，使用費氏數列估算工作點數
- **Sprint Board** — 拖曳式票務流轉，跨越 4 個欄位：To-Do、Doing、Blocking、Done；可內嵌編輯或刪除票務
- **速度追蹤** — 用互動式圖表呈現每個 Sprint 完成的點數，支援日期範圍篩選
- **每日站立提醒** — 在設定的時間推送瀏覽器通知
- **離線優先** — 所有資料存於瀏覽器 localStorage，無需後端
- **Sprint 生命週期自動化** — Sprint 依據日期自動啟動與關閉；未完成票務自動帶入下一個 Sprint
- **Sprint 目標** — 為每個 Sprint 設定目標；Sprint 結束後，目標會顯示在回顧頁面
- **回顧記錄** — 為每個 Sprint 撰寫與編輯回顧筆記

---

## 技術棧

| 類別 | 技術 |
|------|------|
| **框架** | React 19 + TypeScript |
| **建置工具** | Vite |
| **狀態管理** | Zustand v4（含持久化 middleware） |
| **路由** | React Router v6 |
| **樣式** | Tailwind CSS v3 |
| **圖表** | Recharts |
| **拖曳** | @dnd-kit/core + @dnd-kit/sortable |
| **日期** | date-fns |
| **測試** | Playwright（E2E 測試） |
| **資料儲存** | localStorage |

---

## 快速開始

```bash
npm install
npm run dev
```

在瀏覽器中開啟 [http://localhost:5173](http://localhost:5173)。

---

## 使用指南

### 1. 設定
進入 `/settings` 設定 Sprint 週期、每日站立時間，以及啟用瀏覽器通知。

### 2. 建立 Sprint
首頁（`/`）顯示當前 Sprint。若無活躍 Sprint，輸入開始日期後點擊「Create New Sprint」。Sprint 在 today ≥ 開始日期時自動啟動，在 today > 結束日期時自動關閉。

### 3. 在 Sprint Board 工作
看板顯示 4 個欄位。拖曳票務跨欄流轉，在 To-Do 欄新增票務，透過每張卡片上的 ⋮ 選單進行編輯或刪除。

### 4. 追蹤速度
進入 `/history` 查看每個 Sprint 規劃點數 vs 完成點數的折線圖與長條圖，支援日期篩選與內嵌編輯。

### 5. 記錄回顧
進入 `/retro` 為每個已完成的 Sprint 撰寫並儲存回顧筆記。

---

## 專案結構

```
agile-life/
├── src/
│   ├── types.ts                      # 所有 TypeScript 介面
│   ├── components/
│   │   ├── Layout.tsx                # 側邊欄導覽
│   │   ├── SprintBoardColumn.tsx     # 可放置欄位
│   │   ├── TicketCard.tsx            # 可拖曳票卡
│   │   └── PointsPicker.tsx          # 費氏數列選擇器
│   ├── pages/
│   │   ├── SprintBoardPage.tsx       # Sprint Board 主頁 + Sprint 建立
│   │   ├── HistoryPage.tsx           # 速度圖表 + 篩選 + 編輯
│   │   ├── RetroPage.tsx             # 回顧筆記
│   │   └── SettingsPage.tsx          # 應用設定
│   ├── store/
│   │   ├── appStore.ts               # Zustand store（單一、持久化）
│   │   └── slices/
│   │       ├── settingsSlice.ts
│   │       ├── sprintsSlice.ts
│   │       └── ticketsSlice.ts
│   └── lib/
│       ├── sprintLifecycle.ts        # 自動狀態轉換 + carry-over
│       └── notificationScheduler.ts  # 30 秒輪詢站立提醒
├── e2e/                              # Playwright E2E 測試
│   ├── helpers/store.ts
│   └── *.spec.ts
├── .claude/
│   ├── agents/
│   │   ├── qa-engineer.md            # QA 驗證代理
│   │   ├── code-reviewer.md          # 程式碼規範審查代理
│   │   └── security-reviewer.md      # 安全性審查代理
│   └── settings.json
├── playwright.config.ts
├── CLAUDE.md                         # Claude Code 專案上下文
├── README.md
└── README.zh-TW.md
```

---

## 架構說明

**單一 Zustand Store** — 所有狀態集中在一個 store，以三個 slice 拆分，原子寫入至 `localStorage['agile-life-app/v1']`。拆成多個 store 會破壞原子性，導致資料撕裂。

**30 秒輪詢通知** — `setTimeout` 在電腦睡眠或 DST 切換後會失準；polling 每次醒來都重新計算當下時間。

**Sprint 生命週期** — `syncSprintStatuses()` 在 app 掛載時執行，自動轉換 Sprint 狀態：
- `planning → active`：today ≥ startDate
- `active → completed`：today > endDate；未完成票務被複製到新 Sprint，並標記 `carriedFromSprintId`

---

## Claude Code 設定

本專案採用 Claude Code 分層配置：

```
~/.claude/CLAUDE.md          ← 全域層：套用至所有專案（語言規則、個人偏好）
CLAUDE.md                    ← 專案層：架構限制、開發原則、已知陷阱
.claude/agents/              ← 任務代理：qa-engineer、code-reviewer、security-reviewer
```

每層逐步縮小範圍。專案 `CLAUDE.md` 記錄 Claude 絕對不可違反的 invariants（單一 Zustand store、不可變更 `localStorage` key、不覆寫 `completedAt`）。Agent 是 Claude 以 `Agent()` 召喚的獨立子程序，擁有自己的工具權限，並回傳單一結果給主對話。

### Agents

| Agent | 觸發時機 | 職責 |
|-------|---------|------|
| `qa-engineer` | 每次程式碼變動後 | `lint --fix` → `tsc -b` → E2E（非拖曳必須 100% 通過）→ 手動拖曳檢查清單 |
| `code-reviewer` | 每次 commit 前 | 審查 `git diff --staged`；自動修 `import type` 與 WHAT 注釋；遇 invariant 問題回報 BLOCKED |
| `security-reviewer` | 每次 commit 前 | 掃描 XSS、不安全 `localStorage` 用法、`npm audit`；自動修非 breaking CVE |

### 推薦工作流程

```
1. 修改程式碼
2. 請 Claude 執行 qa-engineer       # tsc + E2E，先確認功能沒壞
3. git add <files>
4. 請 Claude 依序執行 code-reviewer、security-reviewer
5. git commit（兩者皆回傳 APPROVED 才 commit）
6. git push
```

QA 在 stage 前執行，是因為一旦發現問題就要修再重新 stage。code-reviewer 與 security-reviewer 預設讀取 `git diff --staged`，但也可以審查未 staged 的變更，不一定要先 `git add`。

---

## localStorage 資料結構

```typescript
localStorage['agile-life-app/v1'] = {
  settings: {
    sprintLengthDays: number,       // 預設：14
    standupTime: string,             // "HH:mm"，預設："09:30"
    notificationsEnabled: boolean
  },
  sprints: [{
    id: string, number: number,
    startDate: string, endDate: string,  // "YYYY-MM-DD"
    status: 'planning' | 'active' | 'completed',
    plannedPoints: number, completedPoints: number,
    goal?: string,
    retrospective?: string
  }],
  tickets: [{
    id: string, title: string, description?: string,
    points: 1 | 2 | 3 | 5 | 8 | 13 | 21,
    status: 'todo' | 'doing' | 'blocking' | 'done',
    sprintId: string,
    createdAt: string,               // ISO 8601
    completedAt?: string,            // 第一次進入 Done 時設定，不覆寫
    carriedFromSprintId?: string
  }]
}
```