# 🧪 Agile Life Manager - Automated Test Protocol

**Purpose**: Complete testing protocol for subagents to verify code changes before marking tasks complete.

**When to Use**: After any code modification, before reporting work as done.

---

## ✅ Pre-Test Checklist

- [ ] Dev server running at http://localhost:5173
- [ ] All TypeScript compilation passes: `npx tsc -b`
- [ ] No uncommitted changes that would interfere with testing

---

## 🧬 Test Suite (3 Levels)

### LEVEL 1: Compilation & Build (Fast - 2 min)

**Must Pass Before Proceeding**

```bash
# TypeScript compilation
npx tsc -b

# ESLint check
npm run lint

# Build test
npm run build
```

**Success Criteria:**
- ✅ Zero TypeScript errors
- ✅ Zero ESLint errors
- ✅ Build completes without errors

**If Fails:**
- 🔴 STOP. Report compilation errors with line numbers.
- 🔴 Do NOT proceed to Level 2.

---

### LEVEL 2: Manual Core Feature Tests (Medium - 10 min)

**Browser Tests** - Open http://localhost:5173 and verify:

#### 🧭 Navigation & Layout
- [ ] Sidebar visible with all 5 nav links (Kanban, Plan, Review, History, Settings)
- [ ] All pages load without 404 errors
- [ ] Layout persists across page navigation

#### ⚙️ Settings Page (/settings)
- [ ] Sprint length input works (change to 7, verify saves to localStorage)
- [ ] Standup time input works (change to 10:30, verify saves)
- [ ] Notification button visible
- [ ] Input values persist after page reload (hard refresh: Ctrl+Shift+R)

#### 📋 Sprint Planning (/plan)
- [ ] "Create Sprint" button visible and clickable
- [ ] Can add tickets with Fibonacci points (1, 2, 3, 5, 8, 13, 21)
- [ ] Planned points total updates correctly (e.g., 3+5+8=16)
- [ ] "Start Sprint" button enabled when plannedPoints > 0
- [ ] Clicking "Start Sprint" navigates to Kanban page

#### 🎯 Kanban Page (/) - **CRITICAL FEATURE**
- [ ] Active sprint header shows: Sprint #, Planned points, Completed points, Days left
- [ ] 4 columns visible: To-Do, Doing, Blocking, Done
- [ ] All tickets from planning appear in To-Do column
- [ ] **DRAG-AND-DROP WORKS**: 
  - [ ] Click and hold a ticket card in To-Do
  - [ ] Drag to another column (e.g., Done)
  - [ ] Card moves smoothly, cursor shows grab icon
  - [ ] Completed points in header updates immediately
- [ ] No JavaScript errors in browser console (F12)

#### 📊 Sprint Review (/review)
- [ ] Shows "No active sprint" message when none exists
- [ ] After dragging a ticket to Done, `/review` shows correct metrics
- [ ] Planned vs Completed points displayed
- [ ] Completion rate percentage calculated correctly
- [ ] Done and Incomplete ticket sections separated

#### 📈 History Page (/history)
- [ ] Shows "No completed sprints yet" when empty
- [ ] After closing a sprint, History shows:
  - [ ] Line chart with velocity trend
  - [ ] Bar chart with planned vs completed
  - [ ] Summary table with all sprints
- [ ] Edit buttons visible on each sprint row
- [ ] Can click Edit, modify values, and Save
- [ ] Chart updates after saving

#### 💾 Data Persistence
- [ ] Open DevTools (F12) → Application → Local Storage
- [ ] Find key: `agile-life-app/v1`
- [ ] Valid JSON structure with settings, sprints, tickets
- [ ] Hard refresh page (Ctrl+Shift+R)
- [ ] All data persists unchanged

---

### LEVEL 3: Automated E2E Tests (Fast - 5 min)

**Run Playwright Tests**

```bash
npm run test:e2e
```

**Success Criteria:**
- ✅ Minimum 50% tests passing (5/10)
- ✅ No "Cannot find name" TypeScript errors in test output
- ✅ Core functionality tests pass:
  - ✅ App loads successfully
  - ✅ Settings persistence
  - ✅ Navigation to all routes
  - ✅ History charts render

**Expected Failures** (acceptable):
- ⚠️ Selector timeouts on Fibonacci button clicks (UI interaction complexity)
- ⚠️ Drag-and-drop Playwright simulation (real browser testing recommended)

**If Critical Failure:**
- 🔴 More than 50% tests fail AND not due to known selector issues
- 🔴 Report test failure details with file paths

---

## 📝 Test Report Template

Generate this report after testing:

```
## TEST RESULTS - [DATE] [CHANGE SUMMARY]

### ✅ Compilation & Build
- TypeScript: PASS
- Lint: PASS  
- Build: PASS

### ✅ Manual Core Features
- Navigation: PASS
- Settings (config + persistence): PASS
- Sprint Planning (create + start): PASS
- Kanban (display + drag-drop): PASS
- Sprint Review (metrics + close): PASS
- History (charts + edit): PASS
- Data Persistence (localStorage): PASS

### ✅ E2E Tests
- Passing: X/10
- Known Issues: [list any selector/timing issues]

### 🎯 Overall Status: [READY / BLOCKED]

### 📌 Issues Found (if any)
- [severity] [title] - [line] [file] [reproduction]
```

---

## 🚨 Critical Features (Test These First)

**If ANY of these fail, mark task as BLOCKED:**

1. **TypeScript Compilation** — code must compile
2. **Kanban Drag-and-Drop** — core workflow feature
3. **Data Persistence** — localStorage saves data
4. **Navigation** — app routes work
5. **Settings Form** — configuration saves

---

## 🔍 What NOT to Test

- Visual design/CSS tweaks (unless UI-breaking)
- Performance optimization results (unless specified)
- Comments and documentation (verify exists, not content)
- Unused code paths (if not touched by change)

---

## 💡 Testing Tips for Subagents

1. **Always start with TypeScript** — if it doesn't compile, nothing else matters
2. **Manual browser tests are non-optional** — E2E tests can miss UI issues
3. **Check console errors** — F12 → Console tab, even if tests pass
4. **Data persistence is critical** — test localStorage every time
5. **Drag-and-drop is complex** — if E2E test times out, do manual test in browser
6. **Read error messages carefully** — they tell you exactly what failed and where
7. **Don't skip the hard refresh** — `Ctrl+Shift+R` tests true persistence
8. **Screenshot failures** — Playwright saves screenshots in `test-results/`; check them

---

## 📋 Checklist for Marking "Complete"

- [ ] All Level 1 (Compilation) tests pass
- [ ] All Level 2 (Manual) tests pass for changed features
- [ ] Level 3 (E2E) tests pass or failures are documented as non-blocking
- [ ] No new console errors in browser
- [ ] localStorage properly persists data
- [ ] Test report generated
- [ ] Any bugs found are documented with severity

**Only mark task COMPLETE when all above are checked.**

---

## 🎯 Quick Reference: Common Issues

| Issue | Check | Fix |
|-------|-------|-----|
| "Cannot find name X" TS error | imports at top of file | add missing import |
| Drag-and-drop not working | useDraggable + useDroppable | verify both hooks present |
| localStorage not saving | DevTools → Application → Local Storage | check key format |
| Page blank after navigation | useEffect dependencies | verify route setup |
| Component not re-rendering | state update | check Zustand/React state |
| E2E test timeout | selector in browser | verify element exists |

---

## 📞 When to Escalate

Report as **CRITICAL** if:
- ❌ TypeScript won't compile
- ❌ Core feature completely broken (e.g., can't drag in Kanban at all)
- ❌ Data loss (localStorage not saving)
- ❌ App won't load (404 or blank page)

Report as **HIGH** if:
- ⚠️ Feature partially broken (e.g., Settings saves but doesn't load)
- ⚠️ Console errors that don't break functionality
- ⚠️ E2E test failures beyond known selector issues

---

**Last Updated**: 2026-04-29
**Protocol Version**: 1.0
