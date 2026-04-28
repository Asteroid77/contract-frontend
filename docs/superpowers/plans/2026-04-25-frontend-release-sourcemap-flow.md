# Frontend Release Sourcemap Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Put release-scoped sourcemap upload into the existing frontend release flow without exposing `.map` files in public assets.

**Architecture:** Keep CI as quality gate only, use main-branch CD for continuous deployable artifacts, and use tag release for archived release packages. Every deployable build gets one stable frontend release id for sourcemap lookup, while semantic product version, git commit, branch, and build id remain separate observability attributes.

**Tech Stack:** GitHub Actions, pnpm 9, Node.js 24, Vite 7.3.1, Bash, TypeScript, OTLP logs, `frontend-observability`, SigNoz.

---

## Current State

- `.github/workflows/ci.yml` is a quality workflow: docs check, install, lint, unwrap guard, diff guard, type check, unit tests, and `pnpm build`.
- `.github/workflows/cd.yml` runs on `main` and manual dispatch. It builds with `pnpm build`, uploads `dist`, and already has an optional `Upload sourcemaps` step guarded by `SOURCEMAP_RESOLVER_ENDPOINT`.
- `.github/workflows/frontend-release.yml` runs on tags. It sets `RELEASE_TAG`, `RELEASE_ID`, and `REPO_COMMIT`, then calls `scripts/release/frontend-package.sh`.
- `scripts/release/frontend-package.sh` already builds with `pnpm build-only -- --sourcemap`, excludes `.map` files from the public asset tarball, and creates a separate sourcemap tarball.
- `scripts/upload-sourcemaps.mjs` currently uploads only `path.basename(filePath)` to `PUT /v1/sourcemaps?filename=<name>`, so it cannot preserve `assets/...` paths or release scope.
- `src/app/observability/index.ts` currently derives `serviceVersion` from `VITE_APP_VERSION`, and other observability emitters use `serviceVersion` as `release`. This is not precise enough for multiple deployments of the same package version.
- Vite 7.3.1 supports `build.sourcemap: 'hidden'`, which generates separate sourcemap files while suppressing sourcemap comments in bundled files.

## Release Flow Decision

Use one release id per deployed frontend artifact.

- CI pull request / dev branch: no sourcemap upload. Build may run, but it is not a deployable release.
- Main CD: `FRONTEND_RELEASE=${GITHUB_SHA}`. This is stable for the deployed commit and prevents overwriting maps from previous `main` deployments.
- Tag release: `FRONTEND_RELEASE=${GITHUB_REF_NAME}`. The tag is the release identity and should be used for both archive metadata and sourcemap upload.
- Manual production-like local package: require explicit `RELEASE_ID`, or generate a local-only id from commit short SHA plus UTC timestamp.

Do not store sourcemaps by wall-clock date alone. Date-based folders help browsing, but they are not a reliable lookup key when older browser sessions report errors from a previously loaded bundle.

## Identifier Model

Do not use a branch name as the sourcemap release key. A branch can point to many different commits over time, so using `main`, `dev`, or a feature branch as the lookup id would recreate the same overwrite problem under a different name.

Do not use semantic product version alone as the sourcemap release key either. `1.8.0` describes the business/product release, but several deployable artifacts can be produced before, during, or after that version boundary. Sourcemaps must identify the exact built artifact.

Use these fields with separate responsibilities:

```json
{
  "service.name": "contract-frontend",
  "service.version": "1.8.0",
  "service.release": "v1.8.0-or-github-sha",
  "git.branch": "main",
  "git.commit": "0123456789abcdef",
  "build.id": "github-run-id-or-local-build-id",
  "release.channel": "production"
}
```

- `service.name`: stable frontend service name.
- `service.version`: semantic application version for humans, release notes, and product/business reporting.
- `service.release`: exact deployable artifact id. This is the sourcemap lookup key together with service and source file.
- `git.commit`: exact commit used to build the artifact.
- `git.branch`: context only. It must not be used as a sourcemap lookup key.
- `build.id`: CI run id or local package id for auditing rebuilds and artifacts.
- `release.channel`: deployment channel such as `development`, `staging`, or `production`.

Sourcemap lookup must use:

```text
service.name + service.release + source_file
```

Operators can search by semantic version, commit, branch, or build id in SigNoz, but resolver correctness depends on `service.release` matching the actual JavaScript bundle loaded by the browser.

## File Structure

- Modify `.github/workflows/ci.yml`
  - Keep as quality gate.
  - Add a focused check that release packaging and sourcemap upload scripts remain syntactically reachable if needed.

- Modify `.github/workflows/cd.yml`
  - Compute and expose `FRONTEND_RELEASE=${{ github.sha }}`.
  - Build with hidden sourcemaps for deployable artifacts.
  - Upload sourcemaps with `service=contract-frontend` and `release=${{ github.sha }}`.

- Modify `.github/workflows/frontend-release.yml`
  - Keep tag release packaging.
  - Upload release sourcemaps after package creation when `SOURCEMAP_RESOLVER_ENDPOINT` exists.
  - Use `SOURCEMAP_RELEASE=${{ env.RELEASE_ID }}`.

- Modify `scripts/release/frontend-package.sh`
  - Keep public assets and sourcemaps as separate artifacts.
  - Ensure metadata records the same `release_id` used by sourcemap upload.
  - Do not remove `dist/**/*.map` before the optional upload step.

- Modify `scripts/upload-sourcemaps.mjs`
  - Upload recursive sourcemap files with relative filenames like `assets/index-abc.js.map`.
  - Send `service`, `release`, and `filename` query params.
  - Fail fast when release id is missing.

- Modify `vite.config.ts`
  - Use hidden production sourcemaps for release/CD builds.
  - Avoid exposing `sourceMappingURL` comments in public JS.

- Modify `env.d.ts`
  - Add `VITE_APP_RELEASE`.
  - Add `VITE_APP_BUILD_ID`, `VITE_GIT_BRANCH`, `VITE_GIT_COMMIT`, and `VITE_RELEASE_CHANNEL`.

- Modify `src/app/observability/types.ts`
  - Add `serviceRelease` to `ObservabilityConfig`.
  - Add optional `buildId`, `gitBranch`, `gitCommit`, and `releaseChannel` to `ObservabilityConfig`.

- Modify `src/app/observability/index.ts`
  - Set `serviceRelease` from `VITE_APP_RELEASE || VITE_APP_VERSION || __GIT_COMMIT_HASH__ || '0.0.0'`.
  - Set `gitCommit`, `gitBranch`, `buildId`, and `releaseChannel` from Vite env or injected git constants.

- Modify observability emitters:
  - `src/app/observability/logger/index.ts`
  - `src/app/observability/transports/signoz-transport.ts`
  - `src/app/observability/collectors/security-policy-collector.ts`
  - Use `config.serviceRelease`, not `config.serviceVersion`, for `release`.
  - Include `git.commit`, `git.branch`, `build.id`, and `release.channel` as queryable attributes/tags where the local event schema supports them.

- Modify docs:
  - `docs/how-to/operations/frontend-observability.md`
  - `docs/reference/development/scripts-annotations.md`
  - Link this flow to `docs/superpowers/plans/2026-04-25-release-scoped-sourcemaps.md`.

---

### Task 1: Introduce Explicit Frontend Release Metadata

**Files:**
- Modify: `env.d.ts`
- Modify: `src/app/observability/types.ts`
- Modify: `src/app/observability/index.ts`
- Test: `src/app/observability/__tests__/index.spec.ts`

- [ ] **Step 1: Write failing config tests**

Add expectations in `src/app/observability/__tests__/index.spec.ts` proving the initialized observability config contains a dedicated release distinct from version:

```ts
expect(initTracer).toHaveBeenCalledWith(
  expect.objectContaining({
    serviceName: 'contract-frontend',
    serviceVersion: '1.0.0',
    serviceRelease: 'release-a',
    gitCommit: 'commit-a',
    gitBranch: 'main',
    buildId: 'run-123',
    releaseChannel: 'staging',
  }),
)
```

The test setup should set:

```ts
vi.stubEnv('VITE_APP_VERSION', '1.0.0')
vi.stubEnv('VITE_APP_RELEASE', 'release-a')
vi.stubEnv('VITE_GIT_COMMIT', 'commit-a')
vi.stubEnv('VITE_GIT_BRANCH', 'main')
vi.stubEnv('VITE_APP_BUILD_ID', 'run-123')
vi.stubEnv('VITE_RELEASE_CHANNEL', 'staging')
```

- [ ] **Step 2: Run the failing test**

Run:

```bash
cd /home/meteor/DEV/projects/test/contract-frontend
pnpm test:unit --run src/app/observability/__tests__/index.spec.ts
```

Expected: FAIL because `serviceRelease` does not exist yet.

- [ ] **Step 3: Add runtime release typing**

In `env.d.ts`, add:

```ts
readonly VITE_APP_RELEASE?: string
readonly VITE_APP_BUILD_ID?: string
readonly VITE_GIT_BRANCH?: string
readonly VITE_GIT_COMMIT?: string
readonly VITE_RELEASE_CHANNEL?: 'development' | 'staging' | 'production'
```

In `src/app/observability/types.ts`, add to `ObservabilityConfig`:

```ts
/** 部署发布标识；用于 sourcemap / event / trace 归属 */
serviceRelease: string
/** 构建流水线或本地打包标识；用于排查 artifact 来源 */
buildId?: string
/** 构建输入分支；仅作为查询上下文，不作为 sourcemap lookup key */
gitBranch?: string
/** 构建输入 commit；用于审计和代码定位 */
gitCommit?: string
/** 发布通道；用于区分 staging / production 等环境 */
releaseChannel?: 'development' | 'staging' | 'production'
```

- [ ] **Step 4: Populate release config**

In `src/app/observability/index.ts`, change default config to include:

```ts
serviceRelease:
  import.meta.env.VITE_APP_RELEASE ||
  import.meta.env.VITE_APP_VERSION ||
  __GIT_COMMIT_HASH__ ||
  '0.0.0',
buildId: import.meta.env.VITE_APP_BUILD_ID,
gitBranch: import.meta.env.VITE_GIT_BRANCH || __GIT_BRANCH__,
gitCommit: import.meta.env.VITE_GIT_COMMIT || __GIT_COMMIT_HASH__,
releaseChannel: import.meta.env.VITE_RELEASE_CHANNEL || (isDev ? 'development' : 'production'),
```

- [ ] **Step 5: Run config tests**

Run:

```bash
cd /home/meteor/DEV/projects/test/contract-frontend
pnpm test:unit --run src/app/observability/__tests__/index.spec.ts
```

Expected: PASS.

---

### Task 2: Emit the Same Release in Logs, Errors, and CSP Reports

**Files:**
- Modify: `src/app/observability/logger/index.ts`
- Modify: `src/app/observability/transports/signoz-transport.ts`
- Modify: `src/app/observability/collectors/security-policy-collector.ts`
- Modify: `src/app/observability/types.ts`
- Test: `src/app/observability/logger/__tests__/logger.spec.ts`
- Test: `src/app/observability/transports/__tests__/signoz-transport.spec.ts`
- Test: `src/app/observability/collectors/__tests__/security-policy-collector.spec.ts`

- [ ] **Step 1: Write failing emitter expectations**

In logger and error transport tests, expect:

```ts
service: expect.objectContaining({
  version: '1.0.0',
  release: 'release-a',
}),
tags: expect.objectContaining({
  'git.commit': 'commit-a',
  'git.branch': 'main',
  'build.id': 'run-123',
  'release.channel': 'staging',
}),
```

In CSP collector tests, expect the sent payload to include:

```ts
expect.objectContaining({
  serviceName: 'contract-frontend',
  serviceVersion: '1.0.0',
  release: 'release-a',
  gitCommit: 'commit-a',
  gitBranch: 'main',
  buildId: 'run-123',
  releaseChannel: 'staging',
  environment: 'development',
})
```

- [ ] **Step 2: Run failing emitter tests**

Run:

```bash
cd /home/meteor/DEV/projects/test/contract-frontend
pnpm test:unit --run \
  src/app/observability/logger/__tests__/logger.spec.ts \
  src/app/observability/transports/__tests__/signoz-transport.spec.ts \
  src/app/observability/collectors/__tests__/security-policy-collector.spec.ts
```

Expected: FAIL because emitters still use `serviceVersion` as release or omit release metadata.

- [ ] **Step 3: Update log and error envelopes**

In `src/app/observability/logger/index.ts` and `src/app/observability/transports/signoz-transport.ts`, change:

```ts
release: currentConfig.serviceVersion,
```

or:

```ts
release: config.serviceVersion,
```

to:

```ts
release: currentConfig.serviceRelease,
```

or:

```ts
release: config.serviceRelease,
```

- [ ] **Step 4: Add release metadata to CSP payload**

In `src/app/observability/types.ts`, add to `CspViolationPayload`:

```ts
environment?: string
release?: string
serviceName?: string
serviceVersion?: string
buildId?: string
gitBranch?: string
gitCommit?: string
releaseChannel?: 'development' | 'staging' | 'production'
```

In `src/app/observability/collectors/security-policy-collector.ts`, add:

```ts
buildId: config.buildId,
environment: config.environment,
gitBranch: config.gitBranch,
gitCommit: config.gitCommit,
release: config.serviceRelease,
releaseChannel: config.releaseChannel,
serviceName: config.serviceName,
serviceVersion: config.serviceVersion,
```

In log and error event envelope builders, merge these tags:

```ts
'build.id': currentConfig.buildId,
'git.branch': currentConfig.gitBranch,
'git.commit': currentConfig.gitCommit,
'release.channel': currentConfig.releaseChannel,
```

Use the equivalent `config` variable name in `signoz-transport.ts`. Omit keys with `undefined` values if the local tag type rejects them.

- [ ] **Step 5: Run emitter tests**

Run:

```bash
cd /home/meteor/DEV/projects/test/contract-frontend
pnpm test:unit --run \
  src/app/observability/logger/__tests__/logger.spec.ts \
  src/app/observability/transports/__tests__/signoz-transport.spec.ts \
  src/app/observability/collectors/__tests__/security-policy-collector.spec.ts
```

Expected: PASS.

---

### Task 3: Make Release Builds Generate Private Sourcemaps

**Files:**
- Modify: `vite.config.ts`
- Test: package build output

- [ ] **Step 1: Update Vite production build config**

In `vite.config.ts`, set production sourcemap behavior:

```ts
build: isProduction
  ? {
      sourcemap: 'hidden',
      minify: 'esbuild',
      esbuild: {
        drop: ['console', 'debugger'],
      },
    }
  : undefined,
```

- [ ] **Step 2: Run production build**

Run:

```bash
cd /home/meteor/DEV/projects/test/contract-frontend
pnpm build
```

Expected: PASS and `dist/assets/*.map` files exist.

- [ ] **Step 3: Verify JS does not expose sourcemap comments**

Run:

```bash
cd /home/meteor/DEV/projects/test/contract-frontend
rg -n "sourceMappingURL=.*\\.map" dist/assets
```

Expected: no output and non-zero `rg` exit code.

- [ ] **Step 4: Verify sourcemap files exist for upload**

Run:

```bash
cd /home/meteor/DEV/projects/test/contract-frontend
find dist/assets -name '*.map' -type f | head
```

Expected: one or more `.map` files are printed.

---

### Task 4: Make Upload Script Release-Scoped

**Files:**
- Modify: `scripts/upload-sourcemaps.mjs`
- Modify: `package.json`
- Test: local dry run

- [ ] **Step 1: Update upload script env contract**

In `scripts/upload-sourcemaps.mjs`, define:

```js
const SERVICE_NAME = process.env.SOURCEMAP_SERVICE_NAME || 'contract-frontend'
const RELEASE_ID = process.env.SOURCEMAP_RELEASE || process.env.RELEASE_ID || process.env.GITHUB_SHA
```

Fail fast in `main()`:

```js
if (!RELEASE_ID) {
  console.error('Error: SOURCEMAP_RELEASE, RELEASE_ID, or GITHUB_SHA must be set')
  process.exit(1)
}
```

- [ ] **Step 2: Upload relative paths recursively**

Add recursive sourcemap discovery:

```js
function collectSourceMaps(rootDir) {
  const results = []

  for (const entry of fs.readdirSync(rootDir, { withFileTypes: true })) {
    const absolutePath = path.join(rootDir, entry.name)

    if (entry.isDirectory()) {
      results.push(...collectSourceMaps(absolutePath))
      continue
    }

    if (entry.isFile() && entry.name.endsWith('.map')) {
      results.push(absolutePath)
    }
  }

  return results
}

function toUploadFilename(filePath) {
  return path.relative(path.dirname(DIST_DIR), filePath).replace(/\\/g, '/')
}
```

Change upload params:

```js
const filename = toUploadFilename(filePath)
const params = new URLSearchParams({
  service: SERVICE_NAME,
  release: RELEASE_ID,
  filename,
})
```

Then call:

```js
await fetch(`${RESOLVER_ENDPOINT}/v1/sourcemaps?${params.toString()}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: content,
})
```

- [ ] **Step 3: Add package script**

In `package.json`, add:

```json
"upload:sourcemaps": "node ./scripts/upload-sourcemaps.mjs"
```

- [ ] **Step 4: Run upload dry check**

Run:

```bash
cd /home/meteor/DEV/projects/test/contract-frontend
SOURCEMAP_RELEASE=test-release SOURCEMAP_RESOLVER_ENDPOINT=http://127.0.0.1:9 pnpm upload:sourcemaps
```

Expected if `dist/assets` has maps: it prints `Service name`, `Release id`, and fails with connection refused.
Expected if no maps exist: it exits 0 with `No source map files found.`

---

### Task 5: Wire Main CD to Upload Scoped Sourcemaps

**Files:**
- Modify: `.github/workflows/cd.yml`

- [ ] **Step 1: Add workflow-level release env**

In `.github/workflows/cd.yml`, add:

```yaml
env:
  FRONTEND_RELEASE: ${{ github.sha }}
  FRONTEND_BUILD_ID: ${{ github.run_id }}
```

- [ ] **Step 2: Inject release into build**

Change the build step:

```yaml
      - name: Build
        run: pnpm build
        env:
          VITE_APP_BUILD_ID: ${{ env.FRONTEND_BUILD_ID }}
          VITE_APP_RELEASE: ${{ env.FRONTEND_RELEASE }}
          VITE_GIT_BRANCH: ${{ github.ref_name }}
          VITE_GIT_COMMIT: ${{ github.sha }}
          VITE_RELEASE_CHANNEL: production
```

- [ ] **Step 3: Upload scoped sourcemaps**

Change the upload step:

```yaml
      - name: Upload sourcemaps
        if: ${{ secrets.SOURCEMAP_RESOLVER_ENDPOINT != '' && (github.event_name == 'push' || (github.event_name == 'workflow_dispatch' && inputs.upload_sourcemaps == 'true')) }}
        run: pnpm upload:sourcemaps
        env:
          DIST_DIR: ./dist/assets
          SOURCEMAP_RESOLVER_ENDPOINT: ${{ secrets.SOURCEMAP_RESOLVER_ENDPOINT }}
          SOURCEMAP_SERVICE_NAME: contract-frontend
          SOURCEMAP_RELEASE: ${{ env.FRONTEND_RELEASE }}
```

- [ ] **Step 4: Grep-check workflow**

Run:

```bash
cd /home/meteor/DEV/projects/test/contract-frontend
rg -n "FRONTEND_RELEASE|FRONTEND_BUILD_ID|VITE_APP_RELEASE|VITE_GIT_COMMIT|VITE_GIT_BRANCH|VITE_APP_BUILD_ID|SOURCEMAP_RELEASE|pnpm upload:sourcemaps" .github/workflows/cd.yml
```

Expected: all four terms are present.

---

### Task 6: Wire Tag Release Workflow to Upload Scoped Sourcemaps

**Files:**
- Modify: `.github/workflows/frontend-release.yml`
- Modify: `scripts/release/frontend-package.sh`

- [ ] **Step 1: Inject release into tag build**

In `.github/workflows/frontend-release.yml`, keep:

```yaml
env:
  RELEASE_TAG: ${{ github.ref_name }}
  RELEASE_ID: ${{ github.ref_name }}
  REPO_COMMIT: ${{ github.sha }}
```

Change the package step:

```yaml
      - name: Package frontend release
        run: bash scripts/release/frontend-package.sh
        env:
          VITE_APP_BUILD_ID: ${{ github.run_id }}
          VITE_APP_RELEASE: ${{ env.RELEASE_ID }}
          VITE_GIT_BRANCH: ${{ github.ref_name }}
          VITE_GIT_COMMIT: ${{ github.sha }}
          VITE_RELEASE_CHANNEL: production
```

- [ ] **Step 2: Add optional tag sourcemap upload**

Add after `Package frontend release` and before `Upload release artifacts`:

```yaml
      - name: Upload release sourcemaps
        if: ${{ secrets.SOURCEMAP_RESOLVER_ENDPOINT != '' }}
        run: pnpm upload:sourcemaps
        env:
          DIST_DIR: ./dist/assets
          SOURCEMAP_RESOLVER_ENDPOINT: ${{ secrets.SOURCEMAP_RESOLVER_ENDPOINT }}
          SOURCEMAP_SERVICE_NAME: contract-frontend
          SOURCEMAP_RELEASE: ${{ env.RELEASE_ID }}
```

- [ ] **Step 3: Keep packaged metadata aligned**

In `scripts/release/frontend-package.sh`, keep:

```bash
RELEASE_ID=${RELEASE_ID:-$RELEASE_TAG}
```

Ensure metadata still writes:

```text
release_id=${RELEASE_ID}
git_tag=${RELEASE_TAG}
git_commit=${REPO_COMMIT}
```

Do not remove `dist/**/*.map`; upload happens from `dist/assets` after packaging.

- [ ] **Step 4: Grep-check tag workflow**

Run:

```bash
cd /home/meteor/DEV/projects/test/contract-frontend
rg -n "VITE_APP_RELEASE|Upload release sourcemaps|SOURCEMAP_RELEASE|release_id" .github/workflows/frontend-release.yml scripts/release/frontend-package.sh
```

Expected: all terms are present. Also verify `VITE_GIT_COMMIT`, `VITE_GIT_BRANCH`, and `VITE_APP_BUILD_ID` are present in `.github/workflows/frontend-release.yml`.

---

### Task 7: Keep CI as a Quality Gate

**Files:**
- Modify: `.github/workflows/ci.yml`

- [ ] **Step 1: Do not upload sourcemaps from CI**

Keep CI free of `SOURCEMAP_RESOLVER_ENDPOINT` and `pnpm upload:sourcemaps`.

- [ ] **Step 2: Add a lightweight script availability check**

After install, add:

```yaml
      - name: Check release scripts
        run: |
          test -f scripts/upload-sourcemaps.mjs
          test -f scripts/release/frontend-package.sh
```

- [ ] **Step 3: Grep-check CI remains upload-free**

Run:

```bash
cd /home/meteor/DEV/projects/test/contract-frontend
rg -n "upload:sourcemaps|SOURCEMAP_RESOLVER_ENDPOINT" .github/workflows/ci.yml
```

Expected: no output and non-zero `rg` exit code.

---

### Task 8: Document the Release Procedure

**Files:**
- Modify: `docs/how-to/operations/frontend-observability.md`
- Modify: `docs/reference/development/scripts-annotations.md`

- [ ] **Step 1: Add operator flow**

In `docs/how-to/operations/frontend-observability.md`, add:

```md
## Frontend Release Sourcemaps

Frontend release sourcemaps are private artifacts. They are generated during deployable builds, uploaded to `frontend-observability`, and not served with public frontend assets.

Release ids:

- main CD: `release=<github.sha>`
- tag release: `release=<git tag>`
- local production-like package: explicit `RELEASE_ID`

Identifier fields:

- `service.version`: semantic product version for humans and release notes.
- `service.release`: exact deployable artifact id used by sourcemap lookup.
- `git.commit`: exact source commit used to build the artifact.
- `git.branch`: query context only; never use this as the sourcemap lookup key.
- `build.id`: CI run id or local packaging id.
- `release.channel`: deployment channel.

Upload endpoint:

```text
PUT /v1/sourcemaps?service=contract-frontend&release=<release>&filename=assets/<file>.js.map
```

Storage layout:

```text
SOURCEMAP_DIR/contract-frontend/<release>/assets/<file>.js.map
```

Runtime CSP/error/log payloads must carry the same release id so symbolication uses the sourcemap matching the bundle loaded by the user.
```

- [ ] **Step 2: Update script annotations**

In `docs/reference/development/scripts-annotations.md`, update the `scripts/upload-sourcemaps.mjs` section:

```md
- `SOURCEMAP_SERVICE_NAME` defaults to `contract-frontend`.
- `SOURCEMAP_RELEASE` is required unless `RELEASE_ID` or `GITHUB_SHA` is present.
- Upload uses relative filenames below the build output, e.g. `assets/index-abc.js.map`.
- Upload protocol is `PUT /v1/sourcemaps?service=<service>&release=<release>&filename=<relative map path>`.
```

- [ ] **Step 3: Run docs check**

Run:

```bash
cd /home/meteor/DEV/projects/test/contract-frontend
bash ./scripts/check-docs.sh
```

Expected: PASS.

---

### Task 9: Release Packaging Verification

**Files:**
- No source changes. This task verifies the full release flow.

- [ ] **Step 1: Run focused tests**

Run:

```bash
cd /home/meteor/DEV/projects/test/contract-frontend
pnpm test:unit --run \
  src/app/observability/__tests__/index.spec.ts \
  src/app/observability/logger/__tests__/logger.spec.ts \
  src/app/observability/transports/__tests__/signoz-transport.spec.ts \
  src/app/observability/collectors/__tests__/security-policy-collector.spec.ts \
  src/app/observability/transports/__tests__/security-report-transport.spec.ts
```

Expected: PASS.

- [ ] **Step 2: Run package script**

Run:

```bash
cd /home/meteor/DEV/projects/test/contract-frontend
RELEASE_TAG=test-release RELEASE_ID=test-release REPO_COMMIT=$(git rev-parse HEAD) VITE_APP_RELEASE=test-release bash scripts/release/frontend-package.sh
```

Expected:

```text
frontend-test-release.tar.gz
frontend-test-release-sourcemaps.tar.gz
frontend-test-release.metadata
```

- [ ] **Step 3: Confirm public artifact has no maps**

Run:

```bash
cd /home/meteor/DEV/projects/test/contract-frontend
tar -tzf release-artifacts/frontend-test-release.tar.gz | rg '\.map$'
```

Expected: no output and non-zero `rg` exit code.

- [ ] **Step 4: Confirm sourcemap artifact has maps**

Run:

```bash
cd /home/meteor/DEV/projects/test/contract-frontend
tar -tzf release-artifacts/frontend-test-release-sourcemaps.tar.gz | rg '\.map$' | head
```

Expected: `.map` filenames are printed.

- [ ] **Step 5: Confirm metadata release id**

Run:

```bash
cd /home/meteor/DEV/projects/test/contract-frontend
rg -n '^release_id=test-release$|^git_commit=' release-artifacts/frontend-test-release.metadata
```

Expected: both metadata lines are present.

---

## Rollback Plan

- If sourcemap upload fails in CD, unset `SOURCEMAP_RESOLVER_ENDPOINT` or set manual `upload_sourcemaps=false`.
- Keep frontend build and artifact upload active; sourcemap upload must not block creating local release archives when the resolver endpoint is unavailable.
- If release-scoped resolver changes are not deployed yet, keep the upload step disabled. The old resolver path is basename-based and can overwrite previous maps.
- If runtime `serviceRelease` causes unexpected downstream query changes, temporarily set `VITE_APP_RELEASE=${VITE_APP_VERSION}` while keeping the code path in place.

## Relationship to Service-Side Plan

This plan only wires the frontend release flow. It depends on the service-side work in:

```text
docs/superpowers/plans/2026-04-25-release-scoped-sourcemaps.md
```

The service-side plan must land before enabling the CI/CD upload step against production `frontend-observability`, because the current upload service stores maps by filename only.

## Self-Review

- Spec coverage: covers existing CI/CD, tag release packaging, main CD upload, hidden sourcemaps, release id propagation, private artifacts, docs, verification, and rollback.
- Placeholder scan: no `TBD`, `TODO`, or unspecified implementation steps remain.
- Type consistency: `serviceRelease`, `VITE_APP_RELEASE`, `SOURCEMAP_RELEASE`, and `RELEASE_ID` are used with distinct responsibilities.
