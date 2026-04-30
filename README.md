# 🚀 Agile Life Manager

Manage your life using Scrum methodology. A personal, single-machine web app to plan sprints, track velocity, and organize daily work with Kanban boards.

**[中文版本](./README.zh-TW.md)**

---

## ✨ Features

- 📋 **Sprint Planning** — Create sprints with configurable duration, estimate work using Fibonacci story points
- 🎯 **Kanban Board** — Drag-and-drop tickets across 4 columns: To-Do, Doing, Blocking, Done; edit or delete tickets inline
- 📊 **Velocity Tracking** — Visualize completed points per sprint with interactive charts and date-range filtering
- ⏰ **Daily Standup Reminders** — Browser notifications at your configured time
- 💾 **Offline-First** — All data persists in browser localStorage, no backend required
- 🔄 **Automatic Sprint Lifecycle** — Sprints activate/close based on dates; incomplete tickets carry over automatically
- 💭 **Retrospectives** — Record and edit sprint retrospectives to track lessons learned
- 🎨 **Clean UI** — Modern, responsive interface built with Tailwind CSS

---

## 🛠️ Tech Stack

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
| **Data Storage** | localStorage |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ 
- npm or yarn

### Installation

```bash
# Clone or navigate to project
cd agile-life

# Install dependencies
npm install

# Start dev server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 📖 How to Use

### 1. **Configure Settings**
Navigate to `/settings` to:
- Set sprint duration (default: 14 days)
- Configure daily standup time (HH:mm format)
- Enable browser notifications

```
⚙️ Settings
├── Sprint Length: 7-30 days
├── Standup Time: 09:30 (configurable)
└── Notifications: Enabled/Disabled
```

### 2. **Create & Manage Sprints**
Home page (`/`) shows active sprint. If no sprint is active:
- Enter start date and duration (end date auto-calculated)
- Sprint activates automatically when today's date ≥ start date
- Sprint closes automatically when today's date > end date
- Edit sprint dates anytime by clicking "✏️ Edit Dates"

### 3. **Work on Kanban**
Main board displays tickets in 4 columns:
- **Drag tickets** between columns: `To-Do → Doing → Blocking → Done`
- **Add new ticket** in To-Do column using "+ Add Ticket" button
- **Edit or delete** tickets via ⋮ menu on each card
- **Real-time metrics** show planned vs. completed points

```
To-Do | Doing | Blocking | Done
  5pt |  8pt  |   2pt    | 3pt
```

### 4. **Daily Standup Reminder**
At your configured time (e.g., 09:30), the app sends a notification:
- Reminder text: "Time for your daily standup!"
- Grace window: 5 minutes (accounts for laptop wake-up)
- Fires once per day per browser tab

### 5. **Sprint Review**
When sprint automatically closes, navigate to `/review` to:
- Review sprint summary: planned vs. completed points
- See carried-over tickets from incomplete items
- Start a new sprint from the Kanban page

### 6. **Track Velocity**
View `/history` to analyze trends:
- **Line chart**: Completed points per sprint
- **Bar chart**: Planned vs. completed comparison
- **Summary table**: Sprint-by-sprint breakdown with date-range filtering
- **Edit sprints**: Modify planned/completed points and dates

### 7. **Record Retrospectives**
Navigate to `/retro` to:
- Review all completed sprints
- Write detailed retrospective notes per sprint
- Edit and save lessons learned for future reference

---

## 📁 Project Structure

```
agile-life-manager/
├── src/                              # Application source code
│   ├── App.tsx                       # Router and layout setup
│   ├── main.tsx                      # Entry point
│   ├── types.ts                      # TypeScript interfaces
│   ├── index.css                     # Tailwind directives
│   ├── components/
│   │   ├── Layout.tsx                # Sidebar nav + outlet
│   │   ├── KanbanColumn.tsx          # Droppable column
│   │   ├── TicketCard.tsx            # Ticket UI component
│   │   └── PointsPicker.tsx          # Fibonacci selector
│   ├── pages/
│   │   ├── KanbanPage.tsx            # Active sprint board + sprint creation
│   │   ├── SprintReviewPage.tsx      # Sprint summary (auto-triggered on close)
│   │   ├── HistoryPage.tsx           # Velocity charts + edit/delete/filter
│   │   ├── RetroPage.tsx             # Retrospective notes per sprint
│   │   └── SettingsPage.tsx          # App configuration
│   ├── store/
│   │   ├── appStore.ts               # Zustand store (single, persisted)
│   │   └── slices/
│   │       ├── settingsSlice.ts      # Settings state
│   │       ├── sprintsSlice.ts       # Sprints CRUD
│   │       └── ticketsSlice.ts       # Tickets CRUD
│   └── lib/
│       ├── notificationScheduler.ts  # 30s polling for reminders
│       └── sprintLifecycle.ts        # Close + carry-over logic
├── tests/                            # Test source code
│   ├── e2e/
│   │   └── e2e.test.ts               # Playwright E2E tests
│   └── playwright.config.ts          # Playwright test config
├── .claude/                          # Project documentation
│   ├── test-protocol.md              # 3-level testing checklist
│   └── subagent-test-prompt-template.md # Testing template
├── .artifacts/                       # Generated files (excluded from git)
│   ├── build/                        # Vite production build
│   └── test-results/                 # Playwright test results & screenshots
├── public/                           # Static assets
├── package.json
├── vite.config.ts                    # Vite build config (output: .artifacts/build)
├── tsconfig.json
├── tailwind.config.js
├── postcss.config.js
├── CLAUDE.md                         # Project context & known gotchas
├── README.md                         # This file (English)
└── README.zh-TW.md                   # Traditional Chinese documentation
```

**Note**: The `.artifacts/` directory contains build and test outputs. It's excluded from git (see `.gitignore`).
- `build/` — Vite production build (run `npm run build`)
- `test-results/` — Playwright test screenshots and reports (run `npm run test:e2e`)

---

## 🎮 Development

### Build for production
```bash
npm run build    # TypeScript check + Vite build
npm run preview  # Test production build locally
```

### Lint & format
```bash
npm run lint     # Run ESLint
```

### Project Architecture Notes

**Single Store Pattern**
- All state lives in one Zustand store with three slices: `settings`, `sprints`, `tickets`
- Persisted to localStorage under key `agile-life-app/v1`
- Atomic writes ensure data consistency

**Notification Strategy**
- Uses 30-second polling interval (survives sleep, DST, clock changes)
- Prevents double-fire via `lastStandupNotified` date check
- Graceful fallback if browser tab is closed

**Sprint Lifecycle**
- Sprints transition automatically based on dates (via `syncSprintStatuses()`):
  - `planning` → `active`: when today ≥ startDate
  - `active` → `completed`: when today > endDate (triggers auto-close logic)
- On sprint close, `sprintLifecycle.ts` atomically:
  1. Marks sprint as completed, snapshots completed points
  2. Clones incomplete tickets to new draft sprint
  3. Sets `carriedFromSprintId` for tracking

---

## 🔌 Local Storage Schema

Data persists under `agile-life-app/v1`:

```typescript
{
  settings: {
    sprintLengthDays: number      // default: 14
    standupTime: string            // "HH:mm" format, default: "09:30"
    notificationsEnabled: boolean  // default: false
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
      retrospective?: string       // Optional retrospective notes
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
      createdAt: string            // ISO datetime
      completedAt?: string         // Set once on first move to Done
      carriedFromSprintId?: string // Tracks carry-over origin
    }
  ]
}
```
