# 🚀 Agile Life Manager

Manage your life using Scrum methodology. A personal, single-machine web app to plan sprints, track velocity, and organize daily work with Kanban boards.

**[中文版本](./README.zh-TW.md)**

---

## ✨ Features

- 📋 **Sprint Planning** — Create sprints with configurable duration, estimate work using Fibonacci story points
- 🎯 **Kanban Board** — Drag-and-drop tickets across 4 columns: To-Do, Doing, Blocking, Done
- 📊 **Velocity Tracking** — Visualize completed points per sprint with interactive charts
- ⏰ **Daily Standup Reminders** — Browser notifications at your configured time
- 💾 **Offline-First** — All data persists in browser localStorage, no backend required
- 🔄 **Smart Sprint Close** — Incomplete tickets automatically carry over to the next sprint
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
cd agile-life-manager

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

### 2. **Plan a Sprint**
Go to `/plan` to:
- Create a new sprint starting today
- Add tickets with Fibonacci story points (1, 2, 3, 5, 8, 13, 21)
- Tickets from incomplete sprints auto-load for carry-over

```bash
# Example: Create Sprint #1
Start Date: 2026-04-29
Duration: 14 days
Add Tickets:
  ✓ User authentication (5 points)
  ✓ Dashboard UI (8 points)
  ✓ Setup database (3 points)
```

### 3. **Work on Kanban**
Home page (`/`) displays active sprint:
- **Drag tickets** between columns: `To-Do → Doing → Done`
- **Mark blocking issues** to highlight impediments
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
When the sprint ends, navigate to `/review` to:
- Compare planned vs. completed points
- Review done and incomplete tickets
- Auto-carry incomplete tickets to next sprint

```
Sprint #1 Results
Planned: 16 points
Completed: 13 points (81%)

📊 Carry over 3 incomplete points → Sprint #2
```

### 6. **Track Velocity**
View `/history` to analyze trends:
- **Line chart**: Completed points per sprint
- **Bar chart**: Planned vs. completed comparison
- **Summary table**: Sprint-by-sprint breakdown

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
│   │   ├── KanbanPage.tsx            # Active sprint board
│   │   ├── SprintPlanningPage.tsx    # Planning interface
│   │   ├── SprintReviewPage.tsx      # Sprint wrap-up
│   │   ├── HistoryPage.tsx           # Velocity charts + edit/delete
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

---

## 💡 Tips & Tricks

1. **First Time Setup**
   - On first run, you'll land on Settings
   - Grant notification permission when prompted
   - Click "Create Sprint" to get started

2. **Carried-Over Tickets**
   - Incomplete tickets appear pre-loaded in next sprint's planning page
   - Edit title/points before starting the sprint if needed

3. **Multi-Tab Behavior**
   - Each browser tab is independent (no sync)
   - Notifications may fire in multiple tabs for same day (by design, prevents lost reminders)

4. **Timezone & DST**
   - Standup time is in your browser's local timezone
   - Grace window (5 min) accounts for system clock skew

5. **Data Backup**
   - Inspect localStorage in DevTools: F12 → Application → Local Storage
   - Export as JSON, keep a backup if you have many sprints

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Notifications not firing | Check browser notification permission in settings; ensure tab stays open |
| Data missing after refresh | Check if localStorage is enabled; inspect `agile-life-app/v1` key in DevTools |
| Drag-drop not working | Ensure you're using a modern browser (Chrome, Firefox, Safari, Edge); try pointer events |
| Chart not rendering | Make sure at least one sprint is marked completed (move to `/review` and close sprint) |

---

## 📝 Version History

**v0.1.0** (Current)
- ✅ Sprint planning with Fibonacci points
- ✅ Kanban board with drag-and-drop
- ✅ Daily standup reminders
- ✅ Velocity tracking with charts
- ✅ Smart sprint close & carry-over

---

## 📄 License

This project is open source. Feel free to use and modify for personal use.

---

## 🤝 Contributing

This is a personal project, but feedback and ideas are welcome! If you're using it and have suggestions, feel free to reach out.

---

**Built with ❤️ for managing life, one sprint at a time.**
