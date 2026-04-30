# 🚀 Agile Life Manager - Project Context

**Project**: Personal Scrum/Kanban web app for managing life with agile methodology

**Tech Stack**: React 19 + TypeScript + Vite + Zustand + Tailwind + dnd-kit + Recharts

**Status**: MVP phase — core features implemented, testing protocol established

---

## 📌 Critical Project Info

### Architecture Decisions

1. **Single Zustand Store** (not separate stores)
   - Why: Atomic writes to localStorage (avoid torn writes)
   - Location: `src/store/appStore.ts`
   - Three slices: settings, sprints, tickets
   - Persisted under key: `agile-life-app/v1`

2. **Notification Strategy** (30s polling, not setTimeout)
   - Why: Survives laptop sleep, DST, clock changes
   - Location: `src/lib/notificationScheduler.ts`
   - Grace window: 5 minutes after standup time
   - Fires once per day via `lastStandupNotified` check

3. **Drag-and-Drop Implementation** (dnd-kit)
   - Uses `useDraggable` on TicketCard + `useDroppable` on columns
   - `SortableContext` wraps tickets in each column
   - collision detection: `closestCorners`

4. **Sprint Lifecycle** (automatic status transitions + carry-over)
   - Sprints transition automatically based on dates via `syncSprintStatuses()`
   - `planning` → `active`: when today ≥ startDate
   - `active` → `completed`: when today > endDate
   - On close: mark completed, snapshot completedPoints, clone incomplete tickets to new sprint
   - Sets `carriedFromSprintId` flag on carried tickets
   - Location: `src/lib/sprintLifecycle.ts`

---

## 🗂️ Key Files (Read These First)

| File | Purpose | Critical? |
|------|---------|-----------|
| `src/types.ts` | All TypeScript interfaces | ✅ YES — master schema |
| `src/store/appStore.ts` | Zustand store + persist config | ✅ YES — all state |
| `src/components/TicketCard.tsx` | Draggable ticket element with menu | ✅ YES — Kanban core |
| `src/components/KanbanColumn.tsx` | Droppable column + inline ticket creation | ✅ YES — Kanban core |
| `src/pages/KanbanPage.tsx` | Active sprint board + sprint creation | ✅ YES — main feature |
| `src/pages/HistoryPage.tsx` | Velocity charts + date filtering + edit | ✅ YES — analytics |
| `src/pages/RetroPage.tsx` | Retrospective notes per sprint | ✅ YES — reflection |
| `src/lib/sprintLifecycle.ts` | Auto status sync + close + carry over | ✅ YES — data mutation |
| `src/lib/notificationScheduler.ts` | Daily standup reminders | ✅ YES — background task |
| `.claude/test-protocol.md` | Testing checklist | ✅ YES — validation rules |

---

## 🎯 Known Gotchas

1. **localStorage requires proper origin context**
   - In tests, must call `page.goto()` BEFORE accessing localStorage
   - Raw `localStorage.clear()` may fail; wrap in try-catch

2. **Drag-and-drop is browser-specific**
   - PointerSensor without distance config works fine
   - Manual browser testing required; E2E Playwright is flaky for dnd-kit

3. **Automatic sprint status transitions**
   - Sprints auto-transition via `syncSprintStatuses()` called on app mount
   - When today > endDate, sprint auto-closes and carry-over logic runs
   - For testing, set endDate to yesterday in DevTools, then refresh to trigger transition

4. **Complete at Most Once**
   - `completedAt` is set ONCE on first move to Done
   - Subsequent Done re-entries do NOT overwrite
   - See `src/store/slices/ticketsSlice.ts` line 65-67

5. **UUID Generation Bug History**
   - Previously: `crypto.getRandomValues(new Uint8Array(16)).toString()` ❌ (produces "[object Uint8Array]")
   - Fixed to: `uuid()` from 'uuid' package ✅
   - Applies to: `src/lib/sprintLifecycle.ts`

---

## 📊 Data Schema

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
    retrospective?: "Retrospective notes for this sprint"
  }],
  tickets: [{
    id: uuid,
    title: "Feature name",
    description?: "Optional details",
    points: 1|2|3|5|8|13|21,
    status: "todo"|"doing"|"blocking"|"done",
    sprintId: uuid,
    createdAt: "2026-04-29T10:30:00.000Z",
    completedAt?: "2026-04-29T15:45:00.000Z",
    carriedFromSprintId?: uuid
  }]
}
```

---

## 🔄 Test Before Every Change

**Non-negotiable**: Follow `.claude/test-protocol.md`

- Level 1: TypeScript compile (2 min) — MUST PASS
- Level 2: Manual browser tests (10 min) — MUST PASS for changed features
- Level 3: E2E suite (5 min) — PASS or document known failures

**Example**: Modifying Kanban drag-and-drop?
→ Must manually test dragging in browser (E2E may timeout on drag)
→ Must verify `moveTicket` action fires
→ Must check localStorage updates

---

## 🚫 What NOT to Change Without Plan

1. **Zustand store shape** — Will break persistence
2. **localStorage key** — Will orphan all user data (need migration)
3. **Ticket.completedAt logic** — Breaks sprint metrics
4. **Notification scheduler interval** — Affects battery/CPU usage

---

## 📝 Code Style Rules

- **Comments**: Only WHY, not WHAT (well-named code is self-documenting)
- **Imports**: Group by external, then internal
- **TypeScript**: No `any` types; use proper imports for types
- **Components**: Keep small; extract custom hooks if logic is complex
- **State**: Always use Zustand selectors; don't access raw store in render

---

## 🎓 Lessons Learned

1. **E2E tests aren't enough** — Always manually verify core UI interactions (drag-drop)
2. **Atomic writes matter** — Single localStorage key prevents torn writes
3. **Browser APIs are stateful** — Notification, localStorage, permissions need context awareness
4. **Selector complexity** — Avoid deeply nested Zustand selectors; use helper functions

---

## 🆘 Quick Debug Commands

```bash
# Check TypeScript errors
npx tsc -b

# Run E2E tests
npm run test:e2e

# View test results
open test-results/

# Hard refresh (Ctrl+Shift+R equivalent)
F12 → Network → Disable cache → Refresh

# Check localStorage
F12 → Application → Local Storage → find 'agile-life-app/v1'

# Inspect dragging
F12 → Elements → hover over ticket → check data-sortable-id attribute
```

---

## 📞 When Subagent Tests Fail

**If subagent reports test failure:**

1. Read `.claude/test-protocol.md` Level 1-3 sections
2. Check the exact error message (file:line)
3. Reproduce locally: `npm run dev` + browser F12
4. Fix the issue, re-test manually, then have subagent re-verify

**Never proceed if:**
- ❌ TypeScript doesn't compile
- ❌ Drag-and-drop broken in browser
- ❌ localStorage not persisting

---

**Last Updated**: 2026-04-30
**Maintained By**: Claude Code
