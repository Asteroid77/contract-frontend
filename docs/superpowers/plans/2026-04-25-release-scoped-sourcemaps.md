# Release-Scoped Sourcemaps Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make frontend sourcemap upload and symbolication release-scoped so old frontend sessions can still be debugged after newer releases are deployed.

**Architecture:** `contract-frontend` generates a stable deployable artifact id during CI/CD, builds hidden sourcemaps, uploads maps with `service` and `release` query parameters, and emits the same artifact id as `service.release` in frontend observability events. `frontend-observability` stores maps under `SOURCEMAP_DIR/<service>/<release>/...`, resolves stack traces and CSP source attribution using `service.name + service.release + sourceFile`, and keeps semantic version, git branch, git commit, build id, and release channel as query context only.

**Tech Stack:** GitHub Actions, Bash, Node.js 24, Vite, TypeScript, Fastify, `source-map`, Vitest, OTLP logs, SigNoz.

---

## Current State

- `contract-frontend/.github/workflows/cd.yml` already has an optional `Upload sourcemaps` step after `pnpm build`.
- `contract-frontend/.github/workflows/frontend-release.yml` packages tag releases with `scripts/release/frontend-package.sh`.
- `scripts/release/frontend-package.sh` already runs `pnpm build-only -- --sourcemap`, excludes `.map` files from the public asset bundle, and creates a separate sourcemap tarball.
- `contract-frontend/scripts/upload-sourcemaps.mjs` currently uploads each map to `PUT /v1/sourcemaps?filename=<basename>`.
- `frontend-observability/src/symbolication/upload.ts` currently saves maps to `path.join(env.sourcemapDir, filename)`, so same filenames overwrite previous uploads.
- `frontend-observability/src/symbolication/resolve-stack.ts` currently resolves by `sourceFile -> SOURCEMAP_DIR/<source path>.map`, with no release dimension.

## File Structure

### frontend-observability

- Modify `/home/meteor/DEV/projects/test/frontend-observability/src/http/server.ts`
  - Accept `service` and `release` query params on `PUT /v1/sourcemaps`.
  - Pass upload scope to the storage layer.
  - Accept optional `service` and `release` fields on `/v1/symbolicate`.

- Modify `/home/meteor/DEV/projects/test/frontend-observability/src/symbolication/upload.ts`
  - Save maps under release-scoped directories.
  - Keep legacy path support only as a fallback, not the primary storage path.
  - Sanitize path segments.

- Modify `/home/meteor/DEV/projects/test/frontend-observability/src/symbolication/resolve-stack.ts`
  - Resolve sourcemaps by `(service, release, sourceFile)` first.
  - Fall back to legacy unscoped sourcemaps for backward compatibility.
  - Expose a reusable function for CSP attribution to resolve one source position.

- Modify `/home/meteor/DEV/projects/test/frontend-observability/src/ingest/csp-reports.ts`
  - Include release information in normalized CSP records.
  - Preserve semantic version, git commit, branch, build id, and release channel as OTLP attributes when provided.
  - Use release-scoped source resolution before building OTLP attributes.
  - Add `csp.original_source`, `csp.original_line`, `csp.original_column`, and source attribution fields.

- Create `/home/meteor/DEV/projects/test/frontend-observability/src/ingest/csp-source-attribution.ts`
  - Convert resolved sourcemap source paths into `sourceKind`, package, version, and original file attributes.

- Modify tests:
  - `/home/meteor/DEV/projects/test/frontend-observability/src/__tests__/sourcemaps.spec.ts`
  - `/home/meteor/DEV/projects/test/frontend-observability/src/__tests__/csp-reports.spec.ts`
  - Create `/home/meteor/DEV/projects/test/frontend-observability/src/__tests__/csp-source-attribution.spec.ts`

### contract-frontend

- Modify `vite.config.ts`
  - Make production builds generate hidden sourcemaps for release workflows.

- Modify `scripts/upload-sourcemaps.mjs`
  - Upload relative map paths, not just basenames.
  - Require or infer `SOURCEMAP_SERVICE_NAME` and `SOURCEMAP_RELEASE`.
  - Send `service`, `release`, and `filename` query params.

- Modify `package.json`
  - Add `upload:sourcemaps` script.

- Modify `.github/workflows/cd.yml`
  - Compute `FRONTEND_RELEASE`.
  - Upload sourcemaps with release scope.

- Modify `.github/workflows/frontend-release.yml`
  - Use tag name as release id.
  - Optionally upload sourcemaps to `frontend-observability` after package creation when the secret is configured.

- Modify `scripts/release/frontend-package.sh`
  - Ensure metadata includes the exact release id passed to sourcemap upload.

- Modify docs:
  - `docs/how-to/operations/frontend-observability.md`
  - `docs/reference/development/scripts-annotations.md`

## Release Id Convention

Use one release id per deployed frontend artifact. This id is the sourcemap lookup key, not necessarily the semantic product version.

- Tag release: `RELEASE_ID=${GITHUB_REF_NAME}`.
- Main branch CD: `RELEASE_ID=${GITHUB_SHA}`.
- Local/prod-like manual release: `RELEASE_ID=${RELEASE_ID:-$(git rev-parse --short HEAD)-$(date -u +%Y%m%d%H%M%S)}`.

Do not include wall-clock time in GitHub tag releases. The tag is already stable and human-readable.

## Identifier Model

Keep these fields separate across upload, frontend events, OTLP attributes, and SigNoz queries:

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

- `service.version` is the semantic product/application version. Use it for release notes, product reporting, and human-readable grouping.
- `service.release` is the exact deployable artifact id. Use it for sourcemap lookup.
- `git.branch` is query context only. Do not use branch names as sourcemap release keys because branches move.
- `git.commit` records the source commit that produced the artifact.
- `build.id` records the CI run or local package id that produced the artifact.
- `release.channel` records where the artifact was deployed.

The resolver lookup key is:

```text
service.name + service.release + source_file
```

The resolver must not look up sourcemaps by `service.version` alone, because the same semantic version can be rebuilt or deployed multiple times and produce different bundled filenames or sourcemaps.

---

### Task 1: Add Release-Scoped Sourcemap Storage

**Files:**
- Modify: `/home/meteor/DEV/projects/test/frontend-observability/src/symbolication/upload.ts`
- Modify: `/home/meteor/DEV/projects/test/frontend-observability/src/http/server.ts`
- Test: `/home/meteor/DEV/projects/test/frontend-observability/src/__tests__/sourcemaps.spec.ts`

- [ ] **Step 1: Write a failing upload test for release-scoped storage**

Add this test to `/home/meteor/DEV/projects/test/frontend-observability/src/__tests__/sourcemaps.spec.ts`:

```ts
it('stores sourcemaps under service and release scoped directories', async () => {
  const { buildServer } = await import('../http/server.js')
  activeServer = buildServer()

  const uploadResponse = await activeServer.inject({
    method: 'PUT',
    url: '/v1/sourcemaps?service=contract-frontend&release=release-a&filename=assets/app.js.map',
    payload: sourceMapFixture,
    headers: {
      'content-type': 'application/json',
    },
  })

  expect(uploadResponse.statusCode).toBe(200)
  expect(uploadResponse.json()).toEqual({
    uploaded: 'assets/app.js.map',
    service: 'contract-frontend',
    release: 'release-a',
  })
  expect(
    fs.existsSync(path.join(tempDir, 'contract-frontend', 'release-a', 'assets/app.js.map')),
  ).toBe(true)
  expect(fs.existsSync(path.join(tempDir, 'assets/app.js.map'))).toBe(false)
})
```

- [ ] **Step 2: Run the failing test**

Run:

```bash
cd /home/meteor/DEV/projects/test/frontend-observability
pnpm exec vitest run src/__tests__/sourcemaps.spec.ts
```

Expected: FAIL because the response does not include `service`/`release` and the file is saved to the legacy path.

- [ ] **Step 3: Implement scoped upload options**

Replace `/home/meteor/DEV/projects/test/frontend-observability/src/symbolication/upload.ts` with:

```ts
import fs from 'node:fs'
import path from 'node:path'
import type { ObservabilityEnv } from '../config/env.js'
import { invalidateSourceMap } from './resolve-stack.js'

export interface SourceMapScope {
  service?: string
  release?: string
}

function normalizeBody(body: unknown): string {
  return typeof body === 'string' ? body : JSON.stringify(body)
}

function sanitizeSegment(value: string | undefined): string | undefined {
  if (!value) {
    return undefined
  }

  return value.replace(/[^a-zA-Z0-9._-]/g, '-')
}

function normalizeFilename(filename: string): string {
  return filename.replace(/^\/+/, '')
}

export function buildSourceMapPath(
  filename: string,
  env: ObservabilityEnv,
  scope: SourceMapScope = {},
): string {
  const normalizedFilename = normalizeFilename(filename)
  const service = sanitizeSegment(scope.service)
  const release = sanitizeSegment(scope.release)

  if (service && release) {
    return path.join(env.sourcemapDir, service, release, normalizedFilename)
  }

  return path.join(env.sourcemapDir, normalizedFilename)
}

export function saveSourceMapArtifact(
  filename: string,
  body: unknown,
  env: ObservabilityEnv,
  scope: SourceMapScope = {},
): string {
  const filePath = buildSourceMapPath(filename, env, scope)

  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, normalizeBody(body), 'utf-8')
  invalidateSourceMap(filename, env, scope)

  return filePath
}
```

- [ ] **Step 4: Pass scope through the HTTP route**

Modify the `/v1/sourcemaps` route in `/home/meteor/DEV/projects/test/frontend-observability/src/http/server.ts`:

```ts
  app.put('/v1/sourcemaps', async (request, reply) => {
    const query = request.query as { filename?: string; service?: string; release?: string }

    if (!query.filename) {
      return reply.code(400).send({
        error: 'Missing filename',
      })
    }

    saveSourceMapArtifact(query.filename, request.body, env, {
      service: query.service,
      release: query.release,
    })

    return reply.code(200).send({
      uploaded: query.filename,
      service: query.service,
      release: query.release,
    })
  })
```

- [ ] **Step 5: Run the upload tests**

Run:

```bash
cd /home/meteor/DEV/projects/test/frontend-observability
pnpm exec vitest run src/__tests__/sourcemaps.spec.ts
```

Expected: PASS.

---

### Task 2: Resolve Sourcemaps by Service and Release

**Files:**
- Modify: `/home/meteor/DEV/projects/test/frontend-observability/src/symbolication/resolve-stack.ts`
- Modify: `/home/meteor/DEV/projects/test/frontend-observability/src/http/server.ts`
- Test: `/home/meteor/DEV/projects/test/frontend-observability/src/__tests__/sourcemaps.spec.ts`

- [ ] **Step 1: Write a failing test proving old and new releases resolve differently**

Add these fixtures and test to `/home/meteor/DEV/projects/test/frontend-observability/src/__tests__/sourcemaps.spec.ts`:

```ts
const releaseASourceMapFixture = JSON.stringify({
  version: 3,
  file: 'app.js',
  sources: ['ReleaseA.vue'],
  sourcesContent: ["export function releaseA() {\n  throw new Error('boom')\n}\n"],
  names: ['releaseA'],
  mappings: 'AAAA',
})

const releaseBSourceMapFixture = JSON.stringify({
  version: 3,
  file: 'app.js',
  sources: ['ReleaseB.vue'],
  sourcesContent: ["export function releaseB() {\n  throw new Error('boom')\n}\n"],
  names: ['releaseB'],
  mappings: 'AAAA',
})

it('symbolicates with the sourcemap for the requested release', async () => {
  const { buildServer } = await import('../http/server.js')
  activeServer = buildServer()

  await activeServer.inject({
    method: 'PUT',
    url: '/v1/sourcemaps?service=contract-frontend&release=release-a&filename=assets/app.js.map',
    payload: releaseASourceMapFixture,
    headers: { 'content-type': 'application/json' },
  })
  await activeServer.inject({
    method: 'PUT',
    url: '/v1/sourcemaps?service=contract-frontend&release=release-b&filename=assets/app.js.map',
    payload: releaseBSourceMapFixture,
    headers: { 'content-type': 'application/json' },
  })

  const symbolicateResponse = await activeServer.inject({
    method: 'POST',
    url: '/v1/symbolicate',
    payload: {
      service: 'contract-frontend',
      release: 'release-a',
      stack: 'Error: boom\n    at setup (https://dev.astro777.cfd/assets/app.js:1:0)',
    },
    headers: { 'content-type': 'application/json' },
  })

  expect(symbolicateResponse.statusCode).toBe(200)
  expect(symbolicateResponse.json().resolvedStack).toContain('ReleaseA.vue')
  expect(symbolicateResponse.json().resolvedStack).not.toContain('ReleaseB.vue')
})
```

- [ ] **Step 2: Run the failing test**

Run:

```bash
cd /home/meteor/DEV/projects/test/frontend-observability
pnpm exec vitest run src/__tests__/sourcemaps.spec.ts
```

Expected: FAIL because `/v1/symbolicate` ignores `service` and `release`.

- [ ] **Step 3: Add scoped lookup helpers**

In `/home/meteor/DEV/projects/test/frontend-observability/src/symbolication/resolve-stack.ts`, import `SourceMapScope` and add scoped path logic:

```ts
import type { SourceMapScope } from './upload.js'
```

Add:

```ts
function sanitizeSegment(value: string | undefined): string | undefined {
  if (!value) {
    return undefined
  }

  return value.replace(/[^a-zA-Z0-9._-]/g, '-')
}

function buildCandidateMapPaths(
  file: string,
  env: ObservabilityEnv,
  scope: SourceMapScope = {},
): string[] {
  const sourcePath = extractSourcePath(file)
  const mapFilename = toMapFilename(sourcePath)
  const service = sanitizeSegment(scope.service)
  const release = sanitizeSegment(scope.release)
  const paths: string[] = []

  if (service && release) {
    paths.push(path.join(env.sourcemapDir, service, release, mapFilename))
  }

  paths.push(path.join(env.sourcemapDir, mapFilename))

  return paths
}
```

Replace `loadSourceMap(file, env)` with a scoped version:

```ts
async function loadSourceMap(
  file: string,
  env: ObservabilityEnv,
  scope: SourceMapScope = {},
): Promise<SourceMapConsumerLike | null> {
  for (const mapPath of buildCandidateMapPaths(file, env, scope)) {
    const cacheKey = mapPath

    if (sourceMapCache.has(cacheKey)) {
      return sourceMapCache.get(cacheKey) || null
    }

    if (!fs.existsSync(mapPath)) {
      continue
    }

    try {
      const rawMap = JSON.parse(fs.readFileSync(mapPath, 'utf-8'))
      const SourceMapConsumer = await getSourceMapConsumerFactory()
      const consumer = await new SourceMapConsumer(rawMap)
      sourceMapCache.set(cacheKey, consumer)
      return consumer
    } catch {
      return null
    }
  }

  return null
}
```

Update `resolveFrame` and `resolveStackTrace` signatures:

```ts
async function resolveFrame(
  frame: StackFrame,
  env: ObservabilityEnv,
  scope: SourceMapScope = {},
): Promise<ParsedFrame> {
  const consumer = await loadSourceMap(frame.file, env, scope)
  // keep existing body
}

export async function resolveStackTrace(
  stack: string,
  env: ObservabilityEnv,
  scope: SourceMapScope = {},
): Promise<string> {
  const frames = parseStackTrace(stack)
  const resolved: string[] = []

  for (const frame of frames.slice(0, 10)) {
    const parsed = await resolveFrame(frame, env, scope)
    resolved.push(`    at ${parsed.function} (${parsed.file}:${parsed.line}:${parsed.column})`)
  }

  return resolved.join('\n')
}
```

Update `invalidateSourceMap`:

```ts
export function invalidateSourceMap(
  filename: string,
  env: ObservabilityEnv,
  scope: SourceMapScope = {},
): void {
  for (const filePath of buildCandidateMapPaths(filename, env, scope)) {
    const consumer = sourceMapCache.get(filePath)

    if (consumer) {
      consumer.destroy()
      sourceMapCache.delete(filePath)
    }
  }
}
```

- [ ] **Step 4: Pass symbolicate scope from HTTP body**

Modify `/v1/symbolicate` in `/home/meteor/DEV/projects/test/frontend-observability/src/http/server.ts`:

```ts
  app.post('/v1/symbolicate', async (request, reply) => {
    const body = request.body as { stack?: string; service?: string; release?: string }

    if (!body?.stack) {
      return reply.code(400).send({
        error: 'Missing stack',
      })
    }

    const resolvedStack = await resolveStackTrace(body.stack, env, {
      service: body.service,
      release: body.release,
    })

    return reply.code(200).send({
      resolvedStack,
    })
  })
```

- [ ] **Step 5: Run sourcemap tests**

Run:

```bash
cd /home/meteor/DEV/projects/test/frontend-observability
pnpm exec vitest run src/__tests__/sourcemaps.spec.ts
```

Expected: PASS.

---

### Task 3: Add CSP Source Attribution from Release-Scoped Sourcemaps

**Files:**
- Create: `/home/meteor/DEV/projects/test/frontend-observability/src/ingest/csp-source-attribution.ts`
- Modify: `/home/meteor/DEV/projects/test/frontend-observability/src/symbolication/resolve-stack.ts`
- Test: `/home/meteor/DEV/projects/test/frontend-observability/src/__tests__/csp-source-attribution.spec.ts`

- [ ] **Step 1: Write failing attribution tests**

Create `/home/meteor/DEV/projects/test/frontend-observability/src/__tests__/csp-source-attribution.spec.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { parsePnpmSourcePath, classifyResolvedSource } from '../ingest/csp-source-attribution.js'

describe('CSP source attribution', () => {
  it('parses scoped pnpm package sources', () => {
    expect(
      parsePnpmSourcePath(
        '../../node_modules/.pnpm/@tanstack+query-devtools@5.90.1/node_modules/@tanstack/query-devtools/build/chunk/CXOMC62J.js',
      ),
    ).toEqual({
      sourcePackage: '@tanstack/query-devtools',
      sourcePackageVersion: '5.90.1',
      sourceOriginalFile: 'build/chunk/CXOMC62J.js',
    })
  })

  it('parses unscoped pnpm package sources with peer suffixes', () => {
    expect(
      parsePnpmSourcePath(
        '../../node_modules/.pnpm/vue@3.5.20_typescript@6.0.2/node_modules/vue/dist/vue.runtime.esm-bundler.js',
      ),
    ).toEqual({
      sourcePackage: 'vue',
      sourcePackageVersion: '3.5.20',
      sourceOriginalFile: 'dist/vue.runtime.esm-bundler.js',
    })
  })

  it('classifies app sources separately from npm package sources', () => {
    expect(classifyResolvedSource('src/App.vue')).toEqual({
      sourceKind: 'app',
      sourceRuntime: 'dist',
      sourceAttributionMethod: 'production-sourcemap',
    })
  })
})
```

- [ ] **Step 2: Run failing attribution tests**

Run:

```bash
cd /home/meteor/DEV/projects/test/frontend-observability
pnpm exec vitest run src/__tests__/csp-source-attribution.spec.ts
```

Expected: FAIL because the module does not exist.

- [ ] **Step 3: Implement attribution parsing**

Create `/home/meteor/DEV/projects/test/frontend-observability/src/ingest/csp-source-attribution.ts`:

```ts
export interface CspSourceAttribution {
  originalSource?: string
  originalLine?: number
  originalColumn?: number
  sourceKind:
    | 'app'
    | 'npm-package'
    | 'vite-dep'
    | 'vite-virtual'
    | 'browser-extension'
    | 'external'
    | 'unknown'
  sourceRuntime: 'dist' | 'vite-dev' | 'extension' | 'external' | 'unknown'
  sourcePackage?: string
  sourcePackageVersion?: string
  sourceOriginalFile?: string
  sourceAttributionMethod:
    | 'production-sourcemap'
    | 'vite-deps-sourcemap'
    | 'vite-virtual-rule'
    | 'browser-extension-rule'
    | 'url-rule'
    | 'none'
}

interface PackageAttribution {
  sourcePackage: string
  sourcePackageVersion: string
  sourceOriginalFile: string
}

export function parsePnpmSourcePath(source: string): PackageAttribution | null {
  const normalized = source.replace(/\\/g, '/')
  const marker = '/node_modules/.pnpm/'
  const markerIndex = normalized.indexOf(marker)
  if (markerIndex < 0) {
    return null
  }

  const afterPnpm = normalized.slice(markerIndex + marker.length)
  const nodeModulesIndex = afterPnpm.indexOf('/node_modules/')
  if (nodeModulesIndex < 0) {
    return null
  }

  const packageWithVersion = afterPnpm.slice(0, nodeModulesIndex)
  const afterNodeModules = afterPnpm.slice(nodeModulesIndex + '/node_modules/'.length)
  const packageSegments = afterNodeModules.startsWith('@')
    ? afterNodeModules.split('/').slice(0, 2)
    : afterNodeModules.split('/').slice(0, 1)
  const sourcePackage = packageSegments.join('/')
  const sourceOriginalFile = afterNodeModules.slice(sourcePackage.length + 1)
  const encodedPackage = sourcePackage.replace('/', '+')
  const versionPrefix = `${encodedPackage}@`

  if (!packageWithVersion.startsWith(versionPrefix)) {
    return null
  }

  const versionAndPeers = packageWithVersion.slice(versionPrefix.length)
  const sourcePackageVersion = versionAndPeers.split('_')[0]

  return {
    sourcePackage,
    sourcePackageVersion,
    sourceOriginalFile,
  }
}

export function classifyResolvedSource(source: string): CspSourceAttribution {
  const packageAttribution = parsePnpmSourcePath(source)
  if (packageAttribution) {
    return {
      originalSource: source,
      sourceKind: 'npm-package',
      sourceRuntime: 'dist',
      sourceAttributionMethod: 'production-sourcemap',
      ...packageAttribution,
    }
  }

  return {
    originalSource: source,
    sourceKind: 'app',
    sourceRuntime: 'dist',
    sourceAttributionMethod: 'production-sourcemap',
  }
}
```

- [ ] **Step 4: Run attribution tests**

Run:

```bash
cd /home/meteor/DEV/projects/test/frontend-observability
pnpm exec vitest run src/__tests__/csp-source-attribution.spec.ts
```

Expected: PASS.

---

### Task 4: Enrich CSP Reports Before OTLP Forwarding

**Files:**
- Modify: `/home/meteor/DEV/projects/test/frontend-observability/src/ingest/csp-reports.ts`
- Modify: `/home/meteor/DEV/projects/test/frontend-observability/src/symbolication/resolve-stack.ts`
- Test: `/home/meteor/DEV/projects/test/frontend-observability/src/__tests__/csp-reports.spec.ts`

- [ ] **Step 1: Write a failing CSP enrichment test**

Add a sourcemap fixture and this test to `/home/meteor/DEV/projects/test/frontend-observability/src/__tests__/csp-reports.spec.ts`:

```ts
const cspAttributionSourceMap = {
  version: 3,
  file: 'index.js',
  sources: [
    '../../node_modules/.pnpm/vue@3.5.20_typescript@6.0.2/node_modules/vue/dist/vue.runtime.esm-bundler.js',
  ],
  sourcesContent: ['const vueRuntime = true\n'],
  names: ['vueRuntime'],
  mappings: 'AAAA',
}

it('adds release-scoped sourcemap attribution attributes to enhanced CSP reports', async () => {
  const app = await buildServer()

  await app.inject({
    method: 'PUT',
    url: '/v1/sourcemaps?service=contract-frontend&release=release-a&filename=assets/index.js.map',
    payload: cspAttributionSourceMap,
    headers: {
      'content-type': 'application/json',
    },
  })

  const response = await app.inject({
    method: 'POST',
    url: '/v1/security/csp-reports',
    headers: {
      'content-type': 'application/json',
    },
    payload: {
      ...enhancedPayload,
      serviceName: 'contract-frontend',
      release: 'release-a',
      sourceFile: 'https://dev.astro777.cfd/assets/index.js',
      lineNumber: 1,
      columnNumber: 0,
    },
  })

  expect(response.statusCode).toBe(202)

  const [, options] = vi.mocked(fetch).mock.calls.at(-1)!
  const attributes = readAttributes(JSON.parse((options as RequestInit).body as string))

  expect(attributes['csp.original_source']).toBe(
    '../../node_modules/.pnpm/vue@3.5.20_typescript@6.0.2/node_modules/vue/dist/vue.runtime.esm-bundler.js',
  )
  expect(attributes['csp.source_kind']).toBe('npm-package')
  expect(attributes['csp.source_package']).toBe('vue')
  expect(attributes['csp.source_package_version']).toBe('3.5.20')
  expect(attributes['csp.source_original_file']).toBe('dist/vue.runtime.esm-bundler.js')
  expect(attributes['csp.source_attribution_method']).toBe('production-sourcemap')
})
```

- [ ] **Step 2: Run the failing CSP test**

Run:

```bash
cd /home/meteor/DEV/projects/test/frontend-observability
pnpm exec vitest run src/__tests__/csp-reports.spec.ts
```

Expected: FAIL because CSP reports do not include release-scoped attribution attributes.

- [ ] **Step 3: Export a single-position sourcemap resolver**

In `/home/meteor/DEV/projects/test/frontend-observability/src/symbolication/resolve-stack.ts`, export this interface and function:

```ts
export interface ResolvedSourcePosition {
  source?: string
  line?: number
  column?: number
  name?: string
}

export async function resolveSourcePosition(
  input: {
    file: string
    line: number
    column: number
  },
  env: ObservabilityEnv,
  scope: SourceMapScope = {},
): Promise<ResolvedSourcePosition | null> {
  const consumer = await loadSourceMap(input.file, env, scope)
  if (!consumer) {
    return null
  }

  const position = consumer.originalPositionFor({
    line: input.line,
    column: input.column,
  })

  if (!position.source) {
    return null
  }

  return {
    source: position.source,
    line: position.line || undefined,
    column: position.column || undefined,
    name: position.name || undefined,
  }
}
```

- [ ] **Step 4: Add release fields to CSP records and normalize enhanced reports**

In `/home/meteor/DEV/projects/test/frontend-observability/src/ingest/csp-reports.ts`, extend `CspReportRecord`:

```ts
  release?: string
  serviceName?: string
```

In `normalizeEnhancedCspReport`, add:

```ts
    release: asString(report.release) || asString(report.serviceRelease),
    serviceName: asString(report.serviceName),
```

- [ ] **Step 5: Enrich reports before building OTLP records**

In `/home/meteor/DEV/projects/test/frontend-observability/src/ingest/csp-reports.ts`, import:

```ts
import { classifyResolvedSource, type CspSourceAttribution } from './csp-source-attribution.js'
import { resolveSourcePosition } from '../symbolication/resolve-stack.js'
```

Add:

```ts
interface EnrichedCspReportRecord extends CspReportRecord {
  sourceAttribution?: CspSourceAttribution
}

async function enrichCspReport(
  report: CspReportRecord,
  env: ObservabilityEnv,
): Promise<EnrichedCspReportRecord> {
  if (!report.sourceFile || report.lineNumber === undefined || report.columnNumber === undefined) {
    return report
  }

  const resolved = await resolveSourcePosition(
    {
      file: report.sourceFile,
      line: report.lineNumber,
      column: report.columnNumber,
    },
    env,
    {
      service: report.serviceName || env.frontendServiceName,
      release: report.release || env.frontendRelease,
    },
  )

  if (!resolved?.source) {
    return report
  }

  return {
    ...report,
    sourceAttribution: {
      ...classifyResolvedSource(resolved.source),
      originalSource: resolved.source,
      originalLine: resolved.line,
      originalColumn: resolved.column,
    },
  }
}

async function enrichCspReports(
  reports: CspReportRecord[],
  env: ObservabilityEnv,
): Promise<EnrichedCspReportRecord[]> {
  return Promise.all(reports.map((report) => enrichCspReport(report, env)))
}
```

Change `buildCspOtlpPayload` signature to:

```ts
export function buildCspOtlpPayload(reports: EnrichedCspReportRecord[], env: ObservabilityEnv) {
```

Append attributes in `buildCspOtlpPayload`:

```ts
                buildStringAttribute('service.release', report.release || env.frontendRelease),
                buildStringAttribute('csp.original_source', report.sourceAttribution?.originalSource),
                buildIntAttribute('csp.original_line', report.sourceAttribution?.originalLine),
                buildIntAttribute('csp.original_column', report.sourceAttribution?.originalColumn),
                buildStringAttribute('csp.source_kind', report.sourceAttribution?.sourceKind),
                buildStringAttribute('csp.source_runtime', report.sourceAttribution?.sourceRuntime),
                buildStringAttribute('csp.source_package', report.sourceAttribution?.sourcePackage),
                buildStringAttribute(
                  'csp.source_package_version',
                  report.sourceAttribution?.sourcePackageVersion,
                ),
                buildStringAttribute(
                  'csp.source_original_file',
                  report.sourceAttribution?.sourceOriginalFile,
                ),
                buildStringAttribute(
                  'csp.source_attribution_method',
                  report.sourceAttribution?.sourceAttributionMethod,
                ),
```

Change `forwardCspReportsToOtlp`:

```ts
async function forwardCspReportsToOtlp(reports: CspReportRecord[], env: ObservabilityEnv) {
  const enrichedReports = await enrichCspReports(reports, env)
  const response = await fetch(env.otlpLogsEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(buildCspOtlpPayload(enrichedReports, env)),
  })
```

- [ ] **Step 6: Run CSP tests**

Run:

```bash
cd /home/meteor/DEV/projects/test/frontend-observability
pnpm exec vitest run src/__tests__/csp-source-attribution.spec.ts src/__tests__/csp-reports.spec.ts
```

Expected: PASS.

---

### Task 5: Emit Release Metadata from contract-frontend Runtime

**Files:**
- Modify: `src/app/observability/types.ts`
- Modify: `src/app/observability/collectors/security-policy-collector.ts`
- Modify: `src/app/observability/collectors/__tests__/security-policy-collector.spec.ts`
- Modify: `src/app/observability/transports/security-report-transport.ts` only if needed for typing

- [ ] **Step 1: Write failing collector expectation for release fields**

In `src/app/observability/collectors/__tests__/security-policy-collector.spec.ts`, update the `enriches violation events with tracing and session context` expectation:

```ts
        serviceName: 'contract-frontend',
        serviceVersion: '1.0.0',
        release: 'release-a',
        gitCommit: 'commit-a',
        gitBranch: 'main',
        buildId: 'run-123',
        releaseChannel: 'staging',
        environment: 'development',
```

Expected object should remain inside the existing `expect.objectContaining`.

- [ ] **Step 2: Run failing collector test**

Run:

```bash
cd /home/meteor/DEV/projects/test/contract-frontend
pnpm test:unit --run src/app/observability/collectors/__tests__/security-policy-collector.spec.ts
```

Expected: FAIL because payload does not include service/release fields.

- [ ] **Step 3: Extend payload type**

In `src/app/observability/types.ts`, add to `CspViolationPayload`:

```ts
  buildId?: string
  environment?: string
  gitBranch?: string
  gitCommit?: string
  release?: string
  releaseChannel?: 'development' | 'staging' | 'production'
  serviceName?: string
  serviceVersion?: string
```

- [ ] **Step 4: Add runtime metadata to the CSP payload**

In `src/app/observability/collectors/security-policy-collector.ts`, add to `payload`:

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

`release` must come from the exact artifact id (`config.serviceRelease`), not from `serviceVersion`.

- [ ] **Step 5: Run collector and transport tests**

Run:

```bash
cd /home/meteor/DEV/projects/test/contract-frontend
pnpm test:unit --run src/app/observability/collectors/__tests__/security-policy-collector.spec.ts src/app/observability/transports/__tests__/security-report-transport.spec.ts
```

Expected: PASS.

---

### Task 6: Update Sourcemap Upload Script for Release Scope

**Files:**
- Modify: `scripts/upload-sourcemaps.mjs`
- Modify: `package.json`

- [ ] **Step 1: Update upload script to use relative paths and release params**

In `scripts/upload-sourcemaps.mjs`, implement these behavior changes:

```js
const SERVICE_NAME = process.env.SOURCEMAP_SERVICE_NAME || 'contract-frontend'
const RELEASE_ID = process.env.SOURCEMAP_RELEASE || process.env.RELEASE_ID || process.env.GITHUB_SHA
```

In `main()`, fail when `RELEASE_ID` is missing:

```js
  if (!RELEASE_ID) {
    console.error('Error: SOURCEMAP_RELEASE, RELEASE_ID, or GITHUB_SHA must be set')
    process.exit(1)
  }
```

Replace basename-only upload with recursive file discovery:

```js
function collectSourceMaps(rootDir) {
  const results = []
  for (const entry of fs.readdirSync(rootDir, { withFileTypes: true })) {
    const absolutePath = path.join(rootDir, entry.name)
    if (entry.isDirectory()) {
      results.push(...collectSourceMaps(absolutePath))
    } else if (entry.isFile() && entry.name.endsWith('.map')) {
      results.push(absolutePath)
    }
  }
  return results
}

function toUploadFilename(filePath) {
  return path.relative(path.dirname(DIST_DIR), filePath).replace(/\\/g, '/')
}
```

Change the upload URL:

```js
  const filename = toUploadFilename(filePath)
  const params = new URLSearchParams({
    service: SERVICE_NAME,
    release: RELEASE_ID,
    filename,
  })
  const response = await fetch(`${RESOLVER_ENDPOINT}/v1/sourcemaps?${params.toString()}`, {
```

Print release metadata:

```js
  console.log(`Service name: ${SERVICE_NAME}`)
  console.log(`Release id: ${RELEASE_ID}`)
```

- [ ] **Step 2: Add package script**

In `package.json`, add:

```json
"upload:sourcemaps": "node ./scripts/upload-sourcemaps.mjs"
```

- [ ] **Step 3: Run a dry local check**

Run:

```bash
cd /home/meteor/DEV/projects/test/contract-frontend
SOURCEMAP_RELEASE=test-release SOURCEMAP_RESOLVER_ENDPOINT=http://127.0.0.1:9 pnpm upload:sourcemaps
```

Expected if `dist/assets` has no maps: exits 0 with `No source map files found.`
Expected if maps exist: fails on connection refused after printing `Service name` and `Release id`.

---

### Task 7: Wire CI/CD Release-Scoped Upload

**Files:**
- Modify: `.github/workflows/cd.yml`
- Modify: `.github/workflows/frontend-release.yml`
- Modify: `scripts/release/frontend-package.sh`

- [ ] **Step 1: Update CD upload env**

In `.github/workflows/cd.yml`, change the `Upload sourcemaps` step env to:

```yaml
        env:
          DIST_DIR: ./dist/assets
          SOURCEMAP_RESOLVER_ENDPOINT: ${{ secrets.SOURCEMAP_RESOLVER_ENDPOINT }}
          SOURCEMAP_SERVICE_NAME: contract-frontend
          SOURCEMAP_RELEASE: ${{ github.sha }}
```

Change the command to:

```yaml
        run: pnpm upload:sourcemaps
```

- [ ] **Step 2: Add optional upload to tag release workflow**

In `.github/workflows/frontend-release.yml`, add this step after `Package frontend release` and before artifact upload:

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

- [ ] **Step 3: Ensure release script leaves dist sourcemaps available for upload**

Verify `scripts/release/frontend-package.sh` still leaves `dist/assets/*.map` in place after packaging. It currently copies maps to `release-artifacts/sourcemap-files`, packages them, and removes only the staging directory. Do not add `rm dist/**/*.map`.

- [ ] **Step 4: Run workflow syntax checks locally by grep**

Run:

```bash
cd /home/meteor/DEV/projects/test/contract-frontend
rg -n "SOURCEMAP_RELEASE|pnpm upload:sourcemaps|Upload release sourcemaps" .github/workflows scripts package.json
```

Expected: matches in both workflows and `package.json`.

---

### Task 8: Document Release-Scoped Sourcemap Operations

**Files:**
- Modify: `docs/how-to/operations/frontend-observability.md`
- Modify: `docs/reference/development/scripts-annotations.md`

- [ ] **Step 1: Update operations docs**

In `docs/how-to/operations/frontend-observability.md`, add a `## Sourcemap Release Scope` section:

```md
## Sourcemap Release Scope

Sourcemaps are stored by frontend service and release:

```text
SOURCEMAP_DIR/<service>/<release>/<filename>
```

`contract-frontend` release uploads use:

- `service=contract-frontend`
- `release=<tag>` for tag releases
- `release=<github.sha>` for main branch CD packages
- `filename=assets/<file>.js.map`

`service.version` is a semantic product version and is not the resolver lookup key. Keep `git.commit`, `git.branch`, `build.id`, and `release.channel` as searchable attributes in SigNoz.

Public frontend assets must not expose `.map` files. Release packaging keeps assets and sourcemaps as separate artifacts, and CI uploads sourcemaps to `frontend-observability` when `SOURCEMAP_RESOLVER_ENDPOINT` is configured.

CSP and error symbolication must use `service + release + sourceFile` so older browser sessions keep resolving against the sourcemap that matches the deployed bundle they loaded.
```
```

- [ ] **Step 2: Update upload script documentation**

In `docs/reference/development/scripts-annotations.md`, update the `scripts/upload-sourcemaps.mjs` section to include:

```md
- `SOURCEMAP_SERVICE_NAME` defaults to `contract-frontend`.
- `SOURCEMAP_RELEASE` is required unless `RELEASE_ID` or `GITHUB_SHA` is present.
- Upload uses `PUT /v1/sourcemaps?service=<service>&release=<release>&filename=<relative map path>`.
- The service stores maps under `SOURCEMAP_DIR/<service>/<release>/`.
```

- [ ] **Step 3: Run docs check**

Run:

```bash
cd /home/meteor/DEV/projects/test/contract-frontend
bash ./scripts/check-docs.sh
```

Expected: PASS.

---

### Task 9: Final Verification

**Files:**
- No new files. This task validates the full change set.

- [ ] **Step 1: Run frontend-observability tests**

Run:

```bash
cd /home/meteor/DEV/projects/test/frontend-observability
pnpm exec vitest run
pnpm build
```

Expected: all tests pass and TypeScript build succeeds.

- [ ] **Step 2: Run contract-frontend focused tests**

Run:

```bash
cd /home/meteor/DEV/projects/test/contract-frontend
pnpm test:unit --run src/app/observability/collectors/__tests__/security-policy-collector.spec.ts src/app/observability/transports/__tests__/security-report-transport.spec.ts src/app/observability/__tests__/index.spec.ts
```

Expected: all selected tests pass.

- [ ] **Step 3: Run release package script**

Run:

```bash
cd /home/meteor/DEV/projects/test/contract-frontend
RELEASE_TAG=test-release RELEASE_ID=test-release REPO_COMMIT=$(git rev-parse HEAD) bash scripts/release/frontend-package.sh
```

Expected:

```text
release-artifacts/frontend-test-release.tar.gz
release-artifacts/frontend-test-release-sourcemaps.tar.gz
release-artifacts/frontend-test-release.metadata
```

- [ ] **Step 4: Confirm public asset bundle excludes maps**

Run:

```bash
cd /home/meteor/DEV/projects/test/contract-frontend
tar -tzf release-artifacts/frontend-test-release.tar.gz | rg '\\.map$'
```

Expected: no output and non-zero `rg` exit code.

- [ ] **Step 5: Confirm sourcemap bundle contains maps**

Run:

```bash
cd /home/meteor/DEV/projects/test/contract-frontend
tar -tzf release-artifacts/frontend-test-release-sourcemaps.tar.gz | rg '\\.map$' | head
```

Expected: map filenames are printed.

---

## Rollback Plan

If release-scoped upload fails in CI:

1. Disable sourcemap upload by unsetting `SOURCEMAP_RESOLVER_ENDPOINT` or setting `upload_sourcemaps=false` for manual CD.
2. Keep build and asset artifact upload unchanged.
3. Existing legacy sourcemap lookup remains available because resolver falls back to `SOURCEMAP_DIR/<filename>`.

## Self-Review

- Spec coverage: plan covers service-side release-scoped storage, release-scoped symbolication, CSP source attribution, frontend runtime release metadata, CI/CD upload, release packaging, docs, and verification.
- Placeholder scan: no `TBD`, `TODO`, or unspecified implementation steps remain.
- Type consistency: `SourceMapScope`, `service`, `release`, and CSP attribution field names are used consistently across tasks.
