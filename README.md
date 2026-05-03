# Agile Life Manager

Manage your life using Scrum methodology. A personal, single-machine web app to plan sprints, track velocity, and organize daily work on a Sprint Board.

**[中文版本](./README.zh-TW.md)**

---

## Features

- **Sprint Planning** — Create sprints with configurable duration, estimate work using Fibonacci story points
- **Sprint Board** — Drag-and-drop tickets across 4 columns: To-Do, Doing, Blocking, Done; edit or delete tickets inline
- **Velocity Tracking** — Visualize completed points per sprint with interactive charts and date-range filtering
- **Daily Standup Reminders** — Browser notifications at your configured time
- **Offline-First** — All data persists in browser localStorage, no backend required
- **Automatic Sprint Lifecycle** — Sprints activate and close based on dates; incomplete tickets carry over automatically
- **Retrospectives** — Record and edit sprint retrospective notes per sprint

---

## Tech Stack

| Category | Technology |
|----------|-----------|
| **Framework** | React 19 + TypeScript |
| **Build Tool** | Vite |
| **State Management** | Zustand v4 (with persist middleware) |
| **Routing** | React Router v6 |
| **UI Styling** | Tailwind CSS v3 |
| **Charts** | Recharts |
| **Drag & Drop** | @dnd-kit/core + @dnd-kit/sortable |
| **Dates** | date-fns |
| **Testing** | Playwright (E2E tests) |
| **Data Storage** | localStorage |

---

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## How to Use

### 1. Configure Settings
Navigate to `/settings` to set sprint duration, daily standup time, and enable browser notifications.

### 2. Create a Sprint
The home page (`/`) shows the active sprint. If none exists, enter a start date and click "Create New Sprint". The sprint activates automatically when today ≥ start date and closes when today > end date.

### 3. Work on the Sprint Board
The board shows 4 columns. Drag tickets between columns, add new tickets in the To-Do column, and edit or delete via the ⋮ menu on each card.

### 4. Track Velocity
View `/history` for line and bar charts showing planned vs. completed points per sprint, with date-range filtering and inline editing.

### 5. Record Retrospectives
Navigate to `/retro` to write and save retrospective notes for each completed sprint.

---

## Project Structure

```
agile-life/
├── src/
│   ├── types.ts                      # All TypeScript interfaces
│   ├── components/
│   │   ├── Layout.tsx                # Sidebar nav
│   │   ├── SprintBoardColumn.tsx     # Droppable column
│   │   ├── TicketCard.tsx            # Draggable ticket card
│   │   └── PointsPicker.tsx          # Fibonacci point selector
│   ├── pages/
│   │   ├── SprintBoardPage.tsx       # Active sprint board + sprint creation
│   │   ├── HistoryPage.tsx           # Velocity charts + filter + edit
│   │   ├── RetroPage.tsx             # Retrospective notes
│   │   └── SettingsPage.tsx          # App configuration
│   ├── store/
│   │   ├── appStore.ts               # Zustand store (single, persisted)
│   │   └── slices/
│   │       ├── settingsSlice.ts
│   │       ├── sprintsSlice.ts
│   │       └── ticketsSlice.ts
│   └── lib/
│       ├── sprintLifecycle.ts        # Auto status sync + carry-over
│       └── notificationScheduler.ts  # 30s polling standup reminder
├── e2e/                              # Playwright E2E tests
│   ├── helpers/store.ts
│   └── *.spec.ts
├── .claude/
│   ├── agents/
│   │   ├── qa-engineer.md            # QA validation agent
│   │   ├── code-reviewer.md          # Code standards review agent
│   │   └── security-reviewer.md      # Security audit agent
│   └── settings.json
├── playwright.config.ts
├── CLAUDE.md                         # Project context for Claude Code
├── README.md
└── README.zh-TW.md
```

---

## Architecture Notes

**Single Zustand Store** — All state in one store with three slices, persisted atomically to `localStorage['agile-life-app/v1']`. Splitting into multiple stores would break atomic writes.

**30s Polling for Notifications** — `setTimeout` drifts after laptop sleep or DST changes. Polling recalculates the current time on every tick.

**Sprint Lifecycle** — `syncSprintStatuses()` runs on app mount and transitions sprints automatically:
- `planning → active`: today ≥ startDate
- `active → completed`: today > endDate; incomplete tickets are cloned to a new sprint with `carriedFromSprintId`

---

## localStorage Schema

```typescript
localStorage['agile-life-app/v1'] = {
  settings: {
    sprintLengthDays: number,       // default: 14
    standupTime: string,             // "HH:mm", default: "09:30"
    notificationsEnabled: boolean
  },
  sprints: [{
    id: string, number: number,
    startDate: string, endDate: string,  // "YYYY-MM-DD"
    status: 'planning' | 'active' | 'completed',
    plannedPoints: number, completedPoints: number,
    retrospective?: string
  }],
  tickets: [{
    id: string, title: string, description?: string,
    points: 1 | 2 | 3 | 5 | 8 | 13 | 21,
    status: 'todo' | 'doing' | 'blocking' | 'done',
    sprintId: string,
    createdAt: string,               // ISO 8601
    completedAt?: string,            // Set once on first move to Done
    carriedFromSprintId?: string
  }]
}
```