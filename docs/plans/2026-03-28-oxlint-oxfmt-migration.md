# Oxlint + Oxfmt Migration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the current `ESLint + Prettier` primary workflow with `oxlint + oxfmt + vue-tsc`, without touching business code.

**Architecture:** The migration keeps responsibilities sharply separated: `oxfmt` handles formatting, `oxlint` handles linting for the TS/TSX-first codebase, and `vue-tsc` remains the only type-checking authority. Existing `.vue` files are treated as transitional assets: they should continue to build and type-check, but they will no longer receive dedicated lint coverage.

**Tech Stack:** Vue 3, TypeScript, TSX, Pinia, Vite, Vitest, Playwright, pnpm, oxlint, oxfmt, vue-tsc

---

### Task 1: Add Oxc toolchain dependencies

**Files:**
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`

**Step 1: Add the new devDependencies**

Add `oxlint` and `oxfmt` to `devDependencies` in `package.json`.

**Step 2: Install dependencies**

Run:

```bash
pnpm install
```

Expected:
- `pnpm-lock.yaml` updates
- `oxlint` and `oxfmt` are available in local project scripts

**Step 3: Verify binaries resolve**

Run:

```bash
pnpm exec oxlint --version
pnpm exec oxfmt --version
```

Expected:
- Both commands print a version successfully

---

### Task 2: Add Oxlint project configuration

**Files:**
- Create: `.oxlintrc.json`

**Step 1: Create the base config**

Create `.oxlintrc.json` with:
- project schema path
- explicit ignore patterns for `dist`, `coverage`, `node_modules`, generated files, assets/public, and snapshots if needed
- plugins needed for this repository’s TS/TSX-heavy codebase
- override blocks for tests and e2e

Recommended shape:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["typescript", "import", "jsx-a11y", "vitest", "node"],
  "categories": {
    "correctness": "error",
    "suspicious": "error",
    "pedantic": "off",
    "style": "off"
  },
  "ignorePatterns": [
    "dist/**",
    "dist-ssr/**",
    "coverage/**",
    "node_modules/**",
    "public/**",
    "src/assets/**",
    "src/**/*.d.ts",
    "src/**/__tests__/**",
    "e2e/**",
    "scripts/**"
  ],
  "rules": {
    "eslint/no-console": "off"
  },
  "overrides": [
    {
      "files": ["src/**/__tests__/**/*.{ts,tsx}", "**/*.{spec,test}.{ts,tsx}"],
      "plugins": ["vitest", "typescript", "import", "jsx-a11y"],
      "env": {
        "vitest": true
      }
    },
    {
      "files": ["e2e/**/*.{ts,tsx}"],
      "env": {
        "node": true
      }
    }
  ]
}
```

**Step 2: Keep the first config intentionally conservative**

Do not try to recreate every historical ESLint rule. Prefer:
- correctness
- suspicious
- TypeScript-safe defaults

Avoid style rules that overlap with `oxfmt`.

**Step 3: Print resolved config for a representative TSX file**

Run:

```bash
pnpm exec oxlint --print-config "src/modules/service-agreement/presentation/sign/ServiceAgreementForm.tsx"
```

Expected:
- Oxlint resolves the config without errors

---

### Task 3: Add Oxfmt project configuration

**Files:**
- Create: `.oxfmtrc.json`

**Step 1: Create the formatter config**

Create `.oxfmtrc.json` with options aligned to the current Prettier setup:

```json
{
  "$schema": "./node_modules/oxfmt/configuration_schema.json",
  "printWidth": 100,
  "semi": false,
  "singleQuote": true
}
```

**Step 2: Verify config is discovered**

Run:

```bash
pnpm exec oxfmt --check "src/main.ts"
```

Expected:
- Oxfmt runs successfully and uses repository config

---

### Task 4: Replace package scripts with layered commands

**Files:**
- Modify: `package.json`

**Step 1: Replace formatting scripts**

Replace current formatter scripts with explicit Oxfmt commands:

```json
{
  "format": "oxfmt --write .",
  "format:check": "oxfmt --check ."
}
```

**Step 2: Replace lint script**

Replace the current primary lint script with Oxlint:

```json
{
  "lint": "oxlint . && pnpm check:px"
}
```

If needed, later narrow the lint target to source globs, but start with repository root for simplicity.

**Step 3: Keep type-check explicit**

Preserve:

```json
{
  "type-check": "vue-tsc --build"
}
```

**Step 4: Add a single aggregate check command**

Add:

```json
{
  "check": "run-p format:check lint type-check"
}
```

Expected:
- Formatting, linting, and type-checking are fully separated

---

### Task 5: Run formatter once and isolate the diff

**Files:**
- Modify: repository-wide formatting targets as produced by `oxfmt`

**Step 1: Run full formatter**

Run:

```bash
pnpm run format
```

**Step 2: Review the resulting diff carefully**

Check:
- `.tsx` render formatting
- `.vue` file formatting stability
- CSS and JSON output

Expected:
- No semantic changes
- Formatting-only diff

**Step 3: If the diff is too large, split by extension**

Fallback commands:

```bash
pnpm exec oxfmt --write "src/**/*.{ts,tsx,js,jsx}"
pnpm exec oxfmt --write "src/**/*.{vue,css,json,md}"
```

Use this only if a single all-in-one formatting commit becomes too hard to review.

---

### Task 6: Validate Oxlint coverage on representative code paths

**Files:**
- No file changes required

**Step 1: Run lint**

Run:

```bash
pnpm run lint
```

Expected:
- Oxlint reports actionable issues on TS/TSX files
- Repository-specific `check:px` still runs

**Step 2: Sample-check key areas**

Confirm lint runs meaningfully on:
- `src/modules/service-agreement/presentation/sign/*.tsx`
- `src/modules/shared/presentation/**/*.tsx`
- `src/views/**/*.tsx`

**Step 3: Record any unacceptable rule gaps**

Examples:
- missed unused vars patterns
- missing import hygiene checks
- test environment false positives

Only add rules/overrides that solve confirmed problems.

---

### Task 7: Validate type-check and preserve non-lint safety net

**Files:**
- No file changes required

**Step 1: Run type-check**

Run:

```bash
pnpm run type-check
```

Expected:
- `vue-tsc --build` succeeds

**Step 2: Run the aggregate check**

Run:

```bash
pnpm run check
```

Expected:
- `format:check`, `lint`, and `type-check` all pass together

**Step 3: Keep this as the CI contract**

From this point forward:
- formatting failures come from `oxfmt`
- lint failures come from `oxlint`
- type failures come from `vue-tsc`

---

### Task 8: Remove legacy ESLint/Prettier configuration and dependencies

**Files:**
- Modify: `package.json`
- Delete: `.prettierrc.json`
- Delete: `eslint.config.ts`

**Step 1: Remove legacy dependencies from `package.json`**

Delete:
- `prettier`
- `eslint`
- `eslint-plugin-vue`
- `eslint-plugin-playwright`
- `@vitest/eslint-plugin`
- `@vue/eslint-config-prettier`
- `@vue/eslint-config-typescript`

Only remove packages that are no longer referenced anywhere else.

**Step 2: Remove legacy config files**

Delete:

```text
.prettierrc.json
eslint.config.ts
```

**Step 3: Reinstall and verify no broken references remain**

Run:

```bash
pnpm install
pnpm run check
```

Expected:
- No missing-module failures
- No scripts still depend on removed tools

---

### Task 9: Suggested commit split

**Files:**
- Multiple repository files from prior tasks

**Step 1: Commit dependency + config introduction**

Suggested message:

```bash
chore: add oxlint and oxfmt configuration
```

**Step 2: Commit formatter-only diff**

Suggested message:

```bash
style: reformat codebase with oxfmt
```

**Step 3: Commit script switch + legacy cleanup**

Suggested message:

```bash
chore: replace eslint and prettier with oxlint and oxfmt
```

---

### Task 10: Post-migration validation checklist

**Files:**
- No new files required

**Step 1: Editor workflow**

Verify save-format works correctly for:
- `.tsx`
- `.vue`
- `.css`

**Step 2: Test workflow**

Run at least one representative unit test command after migration:

```bash
pnpm test:unit --runInBand
```

If the exact runner flags differ, run a representative vitest command that is already standard in the repo.

**Step 3: Developer ergonomics**

Check that:
- lint is noticeably faster than before
- format is stable across repeated runs
- no one needs ESLint to continue day-to-day TSX work

---

Plan complete and saved to `docs/plans/2026-03-28-oxlint-oxfmt-migration.md`. Two execution options:

**1. Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

Which approach?
