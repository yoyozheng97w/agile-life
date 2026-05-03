# Agile Life Manager - Project Context

**Project**: Personal Scrum/Kanban web app for managing life with agile methodology

**Tech Stack**: React 19 + TypeScript + Vite + Zustand + Tailwind + dnd-kit + Recharts

**Status**: Core features complete — sprint lifecycle, Kanban, retrospectives, velocity charts, E2E suite (63 tests)

---

## Architecture Decisions

These are load-bearing choices. Don't change without a plan.

1. **Single Zustand Store** (not separate stores)
   - Why: Atomic writes to localStorage — separate stores cause torn writes
   - Location: `src/store/appStore.ts` with slices in `src/store/slices/`
   - Three slices: `settingsSlice`, `sprintsSlice`, `ticketsSlice`
   - Persisted under key: `agile-life-app/v1` — changing this orphans all user data

2. **Notification Strategy** (30s polling, not setTimeout)
   - Why: Survives laptop sleep, DST, and clock changes — setTimeout does not
   - Location: `src/lib/notificationScheduler.ts`
   - Grace window: 5 minutes after standup time
   - Fires once per day via `lastStandupNotified` check

3. **Drag-and-Drop** (dnd-kit)
   - `useDraggable` on TicketCard + `useDroppable` on columns
   - `SortableContext` wraps tickets in each column
   - Collision detection: `closestCorners`

4. **Sprint Lifecycle** (automatic transitions + carry-over)
   - Runs via `syncSprintStatuses()` called on app mount
   - `planning` → `active`: when today ≥ startDate
   - `active` → `completed`: when today > endDate
   - On close: snapshot `completedPoints`, clone incomplete tickets to new sprint with `carriedFromSprintId`
   - Location: `src/lib/sprintLifecycle.ts`

5. **completedAt is set once**
   - Set on first move to Done; subsequent Done re-entries do NOT overwrite
   - Location: `src/store/slices/ticketsSlice.ts:65-67`

---

## Key Files

| File | Purpose |
|------|---------|
| `src/types.ts` | All TypeScript interfaces — master schema |
| `src/store/appStore.ts` | Zustand store + persist config |
| `src/store/slices/` | State logic split by domain (settings / sprints / tickets) |
| `src/components/TicketCard.tsx` | Draggable ticket element with context menu |
| `src/components/KanbanColumn.tsx` | Droppable column + inline ticket creation |
| `src/pages/KanbanPage.tsx` | Active sprint board + sprint creation |
| `src/pages/HistoryPage.tsx` | Velocity charts + date filtering |
| `src/pages/RetroPage.tsx` | Retrospective notes per sprint |
| `src/pages/SettingsPage.tsx` | Sprint length + standup time + notifications |
| `src/lib/sprintLifecycle.ts` | Auto status sync + close + carry-over |
| `src/lib/notificationScheduler.ts` | Daily standup reminder scheduler |
| `.claude/agents/qa-engineer.md` | QA agent definition + test protocol |
| `e2e/` | Playwright E2E test suite |

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
    id: uuid,
    number: 1,
    startDate: "2026-04-29",
    endDate: "2026-05-13",
    status: "active" | "planning" | "completed",
    plannedPoints: 16,
    completedPoints: 8,
    retrospective?: "string"
  }],
  tickets: [{
    id: uuid,
    title: "string",
    description?: "string",
    points: 1|2|3|5|8|13|21,
    status: "todo"|"doing"|"blocking"|"done",
    sprintId: uuid,
    createdAt: "ISO8601",
    completedAt?: "ISO8601",
    carriedFromSprintId?: uuid
  }]
}
```

---

## Known Gotchas

1. **localStorage requires proper origin context**
   - In E2E tests, call `page.goto()` BEFORE accessing localStorage
   - Raw `localStorage.clear()` may throw; wrap in try-catch

2. **Drag-and-drop is browser-specific**
   - PointerSensor without distance config works fine
   - Playwright E2E is flaky for dnd-kit — always manually test drag in browser

3. **Sprint auto-transition timing**
   - `syncSprintStatuses()` runs on mount — test by setting `endDate` to yesterday in DevTools, then refresh

---

## Code Style

- **Comments**: Only WHY, never WHAT
- **Imports**: External first, then internal
- **TypeScript**: No `any`; use type imports (`import type`)
- **Components**: Keep small; extract hooks when logic is complex
- **State**: Always use Zustand selectors; never access raw store in render

---

## Testing Protocol

Follow `.claude/agents/qa-engineer.md` before every change.

- **Level 1** — `npx tsc -b` — MUST PASS
- **Level 2** — Manual browser verification of changed features — MUST PASS
- **Level 3** — `npm run test:e2e` — PASS or document known failures

Never proceed if TypeScript fails, drag-and-drop breaks, or localStorage stops persisting.

---

## Quick Debug

```bash
npx tsc -b                  # TypeScript check
npm run test:e2e             # E2E suite
npx playwright show-report   # Open HTML test report
npm run dev                  # Start dev server
```

```
F12 → Application → Local Storage → agile-life-app/v1   # inspect state
F12 → Network → Disable cache → Refresh                  # hard refresh
```

---

**Last Updated**: 2026-05-03