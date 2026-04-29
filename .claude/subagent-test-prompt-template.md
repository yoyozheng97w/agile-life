# 📋 Subagent Test Request Template

**Use this template when spawning a subagent for testing after code changes.**

---

## 🎯 How to Ask Subagent to Test

```
You are testing the Agile Life Manager app after code modifications. 
The app is a personal Scrum/Kanban tool built with React, Vite, Zustand, and dnd-kit.

Your mission: Verify the changes work correctly and don't break existing features.

Project Context Files:
- .claude/test-protocol.md — Complete testing checklist
- CLAUDE.md — Architecture decisions and gotchas

Changes Made:
[Describe what was modified]

Test Procedure (follow .claude/test-protocol.md):

1. Level 1: Compilation (MUST PASS)
   npx tsc -b
   npm run lint
   npm run build
   Report: ANY errors with file:line

2. Level 2: Manual Browser Tests (MUST PASS for changed features)
   - Ensure dev server running: http://localhost:5173
   - Open app in browser
   - Test these manually (based on what changed):
     [Specify which features to test]
   - Check DevTools F12 for console errors
   - Verify localStorage: F12 → Application → Local Storage → agile-life-app/v1

3. Level 3: E2E Tests
   npm run test:e2e
   Report: Pass/fail count and any issues

Report Format:
## TEST RESULTS
### ✅ Compilation
- TypeScript: PASS/FAIL
- Lint: PASS/FAIL
- Build: PASS/FAIL

### ✅ Manual Tests
- [Feature 1]: PASS/FAIL
- [Feature 2]: PASS/FAIL
- Console Errors: NONE / [list]

### ✅ E2E Tests
- Result: X/10 PASS
- Known Issues: [list]

### 🎯 Overall: READY / BLOCKED

Critical: If ANY of these fail, mark as BLOCKED:
- TypeScript compilation
- Kanban drag-and-drop (if touched)
- localStorage persistence
- App navigation
```

---

## 🔧 Common Test Scenarios

**Scenario A: Modified Kanban drag-and-drop**
- Create sprint → add 3 tickets → Start Sprint
- On Kanban: drag ticket from To-Do to Done
- Verify: card moves, completed points update
- Hard refresh → ticket still in Done

**Scenario B: Modified Sprint lifecycle**
- Create Sprint → add tickets → start
- Move some to Done, leave some in To-Do
- Navigate to /review → Close Sprint
- Verify: incomplete tickets in new sprint
- Check localStorage: old sprint completed, new created

**Scenario C: Modified Settings form**
- Navigate to /settings
- Modify field
- Verify saves immediately
- Hard refresh → value persists
- Check localStorage

---

## ⚠️ Important for Subagents

1. Manual testing is non-optional
2. E2E may timeout on drag — test manually in browser
3. Must hard refresh to test localStorage persistence
4. Read TypeScript errors carefully — don't dismiss as selector issues
5. Ask for clarification if expectations unclear

---

## 🎯 Minimum Acceptance

- ✅ Level 1: 100% must pass
- ✅ Level 2: Changed features must pass
- ✅ Level 3: 50%+ must pass

Task complete only if all criteria met.

---

**Last Updated**: 2026-04-29
