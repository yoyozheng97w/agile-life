# 📁 Project Organization Guide

This document explains how files are organized in the project and why.

## Directory Structure Rationale

### 📝 Project Root

Contains **global configuration** that affects the entire project:

```
├── package.json              # NPM dependencies and scripts
├── tsconfig.json             # TypeScript project configuration (references app & node)
├── tsconfig.app.json         # TypeScript for src/ (includes: src)
├── tsconfig.node.json        # TypeScript for vite.config.ts (includes: vite.config.ts)
├── vite.config.ts            # Vite build configuration
├── eslint.config.js          # ESLint rules for all code (ts/tsx)
├── tailwind.config.js        # Tailwind CSS configuration
├── postcss.config.js         # PostCSS configuration (for Tailwind)
├── index.html                # Vite HTML entry point
├── .gitignore                # Git ignore rules
├── CLAUDE.md                 # Project context & architecture decisions
└── README.* files            # Project documentation
```

**Why these stay at root:**
- Global scope: affect compilation, linting, building, and testing for the entire project
- Industry standard: most JavaScript projects follow this pattern
- Tool discovery: build tools and CI/CD expect these at the root

### 🔧 Configuration Files: Why NOT in subdirectories

1. **TypeScript (`tsconfig*.json`)**
   - Project-wide compilation configuration
   - Tools expect them at project root
   - Multiple tsconfig files must be referenced from root via `references` field

2. **ESLint (`eslint.config.js`)**
   - Lints all code: src/, tests/, and build config files
   - Not specific to tests
   - `npm run lint` runs on entire codebase

3. **Build Config (`vite.config.ts`, `tailwind.config.js`, `postcss.config.js`)**
   - Affect application build, not just tests
   - Tools expect them at root

### 📦 src/ Directory

Application source code:
```
src/
├── App.tsx
├── main.tsx
├── types.ts
├── components/
├── pages/
├── store/
└── lib/
```

**Includes**: React components, state management, utilities, pages

### 🧪 tests/ Directory

All testing code and test configuration:
```
tests/
├── playwright.config.ts      # Playwright test configuration
├── e2e/
│   ├── e2e.test.ts           # Main E2E test suite
│   ├── history-direct.spec.ts
│   ├── history-hydration.test.ts
│   └── history-manual-test.spec.ts
```

**Includes**: Only files related to testing
- Playwright config (test framework configuration)
- Test spec files (*.test.ts, *.spec.ts)
- Test utilities (if added later)

### 📚 .claude/ Directory

Project documentation for development team and Claude Code:
```
.claude/
├── test-protocol.md                     # Testing checklist
├── subagent-test-prompt-template.md     # Template for subagent testing
├── project-organization.md              # This file
```

### 🎯 .artifacts/ Directory

Generated files (excluded from git):
```
.artifacts/
├── build/                    # Vite production build
├── test-results/             # Playwright test results
├── playwright-report/        # Playwright HTML report
├── [debug scripts]           # Temporary debug files (*.mjs, *.js)
├── [log files]              # Test and build logs
└── README.md                # Artifacts directory guide
```

**Why excluded from git:**
- Reproducible from source: `npm run build` recreates build/
- Large files: screenshots, reports take up space
- Temporary: debug scripts are one-off files

### 📁 public/ Directory

Static assets copied to build output:
```
public/
└── favicon.svg
```

## Configuration File Locations: Decision Matrix

| File | Location | Scope | Reason |
|------|----------|-------|--------|
| tsconfig.json | root | Project-wide TypeScript | Compilation entry point |
| playwright.config.ts | tests/ | E2E tests only | Test-specific, referenced via --config |
| eslint.config.js | root | All code (src/, tests/, config) | Linting is project-wide |
| vite.config.ts | root | Build process | Affects app build, not just tests |
| package.json | root | Dependencies & scripts | NPM entry point |

## Future Additions

If the project grows:

```
├── src/
│   └── __tests__/         ← Could add unit tests here (not in this MVP)
├── tests/
│   ├── e2e/              ✓ E2E tests
│   ├── fixtures/         ← Could add test data fixtures
│   ├── utils/            ← Could add test utilities
│   └── playwright.config.ts ✓
```

For this MVP, everything testing-related is in `tests/`, which is clean and simple.

## Cleanup Philosophy

### ✅ Keep in git
- Source code (src/, tests/)
- Configuration (root-level config files)
- Documentation (.claude/, README.*)
- Package management (package.json, package-lock.json)

### ❌ Exclude from git
- Generated files (build/, test-results/)
- Dependencies (node_modules/)
- Logs and temporary files
- IDE cache (.vscode/, .idea/, *.local)

See `.gitignore` for the complete list.

---

**Last Updated**: 2026-04-29