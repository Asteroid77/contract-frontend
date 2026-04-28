Status: active
Owner: frontend
Last verified: 2026-04-27
Source of truth: yes

# CSP Violation Anti-Storm Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development and superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Do not commit or create branches unless the user explicitly asks.

**Goal:** Add bounded CSP violation anti-storm handling without losing security attribution, so repeated browser `securitypolicyviolation` events do not flood SigNoz while still preserving occurrence counts and release-scoped source attribution.

**Architecture:** Keep the frontend collector lossless for first occurrences, then cap repeated identical violations per browser session/window and emit a duplicate summary event with occurrence counts. Keep dev-only noise filtering in SigNoz queries, not in the frontend collector. Extend `frontend-observability` OTLP mapping to carry dedupe metadata as searchable log attributes.

**Tech Stack:** Vue 3, TypeScript, Vitest, browser `securitypolicyviolation`, `frontend-observability`, OTLP logs, SigNoz.

---

## Constraints

- Do not drop CSP categories by source path in the frontend collector.
- Do not treat branch or `service.version` as sourcemap lookup keys.
- Preserve `service.name + service.release + source_file` attribution behavior.
- Keep detailed reports for the first few events of a fingerprint.
- Add summary metadata when duplicates are suppressed.
- Do not commit git changes during execution.

## File Structure

- Create: `src/app/observability/collectors/csp-violation-anti-storm.ts`
  - Pure fingerprinting and short-window duplicate accounting.
- Create: `src/app/observability/collectors/__tests__/csp-violation-anti-storm.spec.ts`
  - TDD coverage for fingerprint stability, detail cap, summary counts, window reset, cache bound.
- Modify: `src/app/observability/types.ts`
  - Add optional CSP dedupe metadata fields to `CspViolationPayload`.
- Modify: `src/app/observability/collectors/security-policy-collector.ts`
  - Use anti-storm decisions before `sendCspViolationReport`.
  - Flush pending summaries on `destroy()` and `pagehide`.
- Modify: `src/app/observability/collectors/__tests__/security-policy-collector.spec.ts`
  - Verify first events are sent, repeated duplicates are summarized, and production events are not path-filtered.
- Modify: `/home/meteor/DEV/projects/test/frontend-observability/src/ingest/csp-reports.ts`
  - Normalize dedupe metadata and map it to OTLP attributes.
- Modify: `/home/meteor/DEV/projects/test/frontend-observability/src/__tests__/csp-reports.spec.ts`
  - Verify dedupe metadata reaches OTLP logs.
- Modify: `docs/how-to/operations/frontend-observability.md`
  - Document SigNoz filters and dedupe attributes.

## Dedupe Contract

Use this fingerprint material:

```ts
type CspViolationFingerprintInput = {
  blockedUri?: string
  columnNumber?: number
  disposition?: 'enforce' | 'report'
  documentUri: string
  effectiveDirective: string
  lineNumber?: number
  originalPolicy: string
  referrer?: string
  route?: string
  sample?: string
  sourceFile?: string
  statusCode?: number
  violatedDirective: string
}
```

Fingerprint format:

```text
effectiveDirective|violatedDirective|blockedUri|sourceFile|lineNumber|columnNumber|disposition|documentUri
```

Frontend default policy:

```text
windowMs = 60_000
maxDetailedReportsPerWindow = 3
maxFingerprints = 100
```

Payload metadata fields:

```ts
cspFingerprint?: string
cspReportKind?: 'detail' | 'duplicate-summary'
cspOccurrenceCount?: number
cspSuppressedDuplicateCount?: number
cspDedupeWindowMs?: number
cspDedupeFirstObservedAt?: number
cspDedupeLastObservedAt?: number
```

OTLP attributes:

```text
csp.fingerprint
csp.report_kind
csp.occurrence_count
csp.suppressed_duplicate_count
csp.dedupe_window_ms
csp.dedupe_first_observed_at
csp.dedupe_last_observed_at
```

Duplicate summary reports must keep the last observed exemplar violation fields (`documentUri`, `effectiveDirective`, `violatedDirective`, `blockedUri`, `sourceFile`, `lineNumber`, `columnNumber`, `originalPolicy`, and related optional fields). Do not replace those fields with synthetic `duplicate-summary` directive or source values, because backend source attribution still depends on the original `sourceFile` plus release metadata.

### Task 1: Add Pure Anti-Storm Unit

**Files:**
- Create: `src/app/observability/collectors/csp-violation-anti-storm.ts`
- Create: `src/app/observability/collectors/__tests__/csp-violation-anti-storm.spec.ts`

- [ ] **Step 1: Write failing tests for fingerprint and detail cap**

Add `src/app/observability/collectors/__tests__/csp-violation-anti-storm.spec.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { createCspViolationAntiStorm } from '@/app/observability/collectors/csp-violation-anti-storm'

const violation = {
  blockedUri: 'eval',
  columnNumber: 29,
  disposition: 'report' as const,
  documentUri: 'https://dev.astro777.cfd/dashboard',
  effectiveDirective: 'script-src',
  lineNumber: 75,
  originalPolicy: "script-src 'self'",
  sourceFile: 'https://dev.astro777.cfd/assets/index.js',
  violatedDirective: 'script-src',
}

describe('csp violation anti-storm', () => {
  it('allows the first detailed reports and suppresses later duplicates in the same window', () => {
    const antiStorm = createCspViolationAntiStorm({
      windowMs: 60_000,
      maxDetailedReportsPerWindow: 3,
      maxFingerprints: 100,
    })

    expect(antiStorm.record(violation, 1_000).decision).toBe('send-detail')
    expect(antiStorm.record(violation, 2_000).decision).toBe('send-detail')
    expect(antiStorm.record(violation, 3_000).decision).toBe('send-detail')
    expect(antiStorm.record(violation, 4_000).decision).toBe('suppress-duplicate')
    expect(antiStorm.record(violation, 5_000).decision).toBe('suppress-duplicate')

    const summaries = antiStorm.flush(61_000)

    expect(summaries).toHaveLength(1)
    expect(summaries[0]).toEqual(
      expect.objectContaining({
        cspReportKind: 'duplicate-summary',
        cspOccurrenceCount: 2,
        cspSuppressedDuplicateCount: 2,
        cspDedupeWindowMs: 60_000,
        cspDedupeFirstObservedAt: 4_000,
        cspDedupeLastObservedAt: 5_000,
        exemplar: expect.objectContaining({
          effectiveDirective: 'script-src',
          sourceFile: 'https://dev.astro777.cfd/assets/index.js',
        }),
      }),
    )
  })

  it('starts a new detail window after the previous window expires', () => {
    const antiStorm = createCspViolationAntiStorm({
      windowMs: 60_000,
      maxDetailedReportsPerWindow: 1,
      maxFingerprints: 100,
    })

    expect(antiStorm.record(violation, 1_000).decision).toBe('send-detail')
    expect(antiStorm.record(violation, 2_000).decision).toBe('suppress-duplicate')
    expect(antiStorm.record(violation, 62_000).decision).toBe('send-detail')
  })
})
```

- [ ] **Step 2: Run the new test and verify RED**

Run:

```bash
pnpm test:unit --run src/app/observability/collectors/__tests__/csp-violation-anti-storm.spec.ts
```

Expected: FAIL because `csp-violation-anti-storm.ts` does not exist.

- [ ] **Step 3: Implement the pure anti-storm unit**

Create `src/app/observability/collectors/csp-violation-anti-storm.ts`:

```ts
export type CspViolationFingerprintInput = {
  blockedUri?: string
  columnNumber?: number
  disposition?: 'enforce' | 'report'
  documentUri: string
  effectiveDirective: string
  lineNumber?: number
  originalPolicy: string
  referrer?: string
  route?: string
  sample?: string
  sourceFile?: string
  statusCode?: number
  violatedDirective: string
}

export type CspAntiStormMetadata = {
  cspFingerprint: string
  cspReportKind: 'detail' | 'duplicate-summary'
  cspOccurrenceCount: number
  cspSuppressedDuplicateCount?: number
  cspDedupeWindowMs: number
  cspDedupeFirstObservedAt?: number
  cspDedupeLastObservedAt?: number
}

export type CspDuplicateSummary = CspAntiStormMetadata & {
  cspReportKind: 'duplicate-summary'
  exemplar: CspViolationFingerprintInput
}

type AntiStormOptions = {
  windowMs: number
  maxDetailedReportsPerWindow: number
  maxFingerprints: number
}

type FingerprintState = {
  windowStartedAt: number
  detailedCount: number
  suppressedCount: number
  firstSuppressedAt?: number
  lastSuppressedAt?: number
  lastSeenAt: number
  exemplar: CspViolationFingerprintInput
}

const normalize = (value: string | number | undefined) => String(value ?? '')

export const createCspViolationFingerprint = (input: CspViolationFingerprintInput) =>
  [
    input.effectiveDirective,
    input.violatedDirective,
    input.blockedUri,
    input.sourceFile,
    input.lineNumber,
    input.columnNumber,
    input.disposition,
    input.documentUri,
  ]
    .map(normalize)
    .join('|')

export const createCspViolationAntiStorm = (options: AntiStormOptions) => {
  const states = new Map<string, FingerprintState>()

  const evictIfNeeded = () => {
    while (states.size > options.maxFingerprints) {
      const oldest = [...states.entries()].sort(([, a], [, b]) => a.lastSeenAt - b.lastSeenAt)[0]
      if (!oldest) return
      states.delete(oldest[0])
    }
  }

  const buildDetailMetadata = (fingerprint: string): CspAntiStormMetadata => ({
    cspFingerprint: fingerprint,
    cspReportKind: 'detail',
    cspOccurrenceCount: 1,
    cspDedupeWindowMs: options.windowMs,
  })

  const buildSummary = (
    fingerprint: string,
    state: FingerprintState,
  ): CspDuplicateSummary | null => {
    if (state.suppressedCount === 0) return null

    return {
      cspFingerprint: fingerprint,
      cspReportKind: 'duplicate-summary',
      cspOccurrenceCount: state.suppressedCount,
      cspSuppressedDuplicateCount: state.suppressedCount,
      cspDedupeWindowMs: options.windowMs,
      cspDedupeFirstObservedAt: state.firstSuppressedAt,
      cspDedupeLastObservedAt: state.lastSuppressedAt,
      exemplar: state.exemplar,
    }
  }

  return {
    record(input: CspViolationFingerprintInput, now: number) {
      const fingerprint = createCspViolationFingerprint(input)
      const existing = states.get(fingerprint)

      if (!existing || now - existing.windowStartedAt >= options.windowMs) {
        states.set(fingerprint, {
          windowStartedAt: now,
          detailedCount: 1,
          suppressedCount: 0,
          lastSeenAt: now,
          exemplar: input,
        })
        evictIfNeeded()
        return { decision: 'send-detail' as const, metadata: buildDetailMetadata(fingerprint) }
      }

      existing.lastSeenAt = now
      existing.exemplar = input

      if (existing.detailedCount < options.maxDetailedReportsPerWindow) {
        existing.detailedCount += 1
        return { decision: 'send-detail' as const, metadata: buildDetailMetadata(fingerprint) }
      }

      existing.suppressedCount += 1
      existing.firstSuppressedAt ??= now
      existing.lastSuppressedAt = now
      return { decision: 'suppress-duplicate' as const, fingerprint }
    },

    flush(now: number) {
      const summaries: CspDuplicateSummary[] = []

      for (const [fingerprint, state] of states.entries()) {
        if (state.suppressedCount === 0) continue
        if (now - state.windowStartedAt < options.windowMs) continue

        const summary = buildSummary(fingerprint, state)
        if (summary) summaries.push(summary)
        states.delete(fingerprint)
      }

      return summaries
    },

    reset() {
      states.clear()
    },
  }
}
```

- [ ] **Step 4: Run the new test and verify GREEN**

Run:

```bash
pnpm test:unit --run src/app/observability/collectors/__tests__/csp-violation-anti-storm.spec.ts
```

Expected: PASS.

### Task 2: Wire Anti-Storm Into Frontend Collector

**Files:**
- Modify: `src/app/observability/types.ts`
- Modify: `src/app/observability/collectors/security-policy-collector.ts`
- Modify: `src/app/observability/collectors/__tests__/security-policy-collector.spec.ts`

- [ ] **Step 1: Add failing collector tests**

Extend `src/app/observability/collectors/__tests__/security-policy-collector.spec.ts`:

```ts
it('caps duplicate CSP violation reports and emits a duplicate summary after the window', () => {
  vi.useFakeTimers()
  vi.setSystemTime(1_000)
  securityPolicyCollector.init(baseConfig)

  window.dispatchEvent(createSecurityPolicyViolationEvent())
  window.dispatchEvent(createSecurityPolicyViolationEvent())
  window.dispatchEvent(createSecurityPolicyViolationEvent())
  window.dispatchEvent(createSecurityPolicyViolationEvent())
  window.dispatchEvent(createSecurityPolicyViolationEvent())

  expect(sendCspViolationReport).toHaveBeenCalledTimes(3)

  vi.setSystemTime(61_000)
  vi.advanceTimersByTime(60_000)

  expect(sendCspViolationReport).toHaveBeenCalledTimes(4)
  expect(sendCspViolationReport).toHaveBeenLastCalledWith(
    expect.objectContaining({
      cspReportKind: 'duplicate-summary',
      cspOccurrenceCount: 2,
      cspSuppressedDuplicateCount: 2,
      release: 'release-a',
      sourceFile: 'https://dev.astro777.cfd/index.html',
    }),
    expect.objectContaining(baseConfig),
  )

  vi.useRealTimers()
})
```

- [ ] **Step 2: Run collector tests and verify RED**

Run:

```bash
pnpm test:unit --run src/app/observability/collectors/__tests__/security-policy-collector.spec.ts
```

Expected: FAIL because the collector still sends all duplicate events and has no summary metadata.

- [ ] **Step 3: Extend `CspViolationPayload` metadata fields**

Modify `src/app/observability/types.ts`:

```ts
export interface CspViolationPayload {
  buildId?: string
  channel: 'securitypolicyviolation' | 'browser-report' | 'report-to'
  blockedUri?: string
  columnNumber?: number
  cspDedupeFirstObservedAt?: number
  cspDedupeLastObservedAt?: number
  cspDedupeWindowMs?: number
  cspFingerprint?: string
  cspOccurrenceCount?: number
  cspReportKind?: 'detail' | 'duplicate-summary'
  cspSuppressedDuplicateCount?: number
  disposition?: 'enforce' | 'report'
  documentUri: string
  effectiveDirective: string
  environment?: string
  gitBranch?: string
  gitCommit?: string
  language?: string
  lineNumber?: number
  observedAt: number
  originalPolicy: string
  referrer?: string
  release?: string
  releaseChannel?: 'development' | 'staging' | 'production'
  route?: string
  sample?: string
  sessionId?: string
  sessionUrl?: string
  serviceName?: string
  serviceVersion?: string
  sourceFile?: string
  spanId?: string
  statusCode?: number
  traceId?: string
  userAgent?: string
  violatedDirective: string
  viewport?: { width: number; height: number }
}
```

- [ ] **Step 4: Wire anti-storm decisions in `security-policy-collector.ts`**

Use one module-level anti-storm instance and one flush timer. Keep the existing payload construction, then merge metadata only when sending:

```ts
import {
  createCspViolationAntiStorm,
  type CspAntiStormMetadata,
} from './csp-violation-anti-storm'

const CSP_DEDUPE_WINDOW_MS = 60_000
const CSP_MAX_DETAILED_REPORTS_PER_WINDOW = 3
const CSP_MAX_FINGERPRINTS = 100

const antiStorm = createCspViolationAntiStorm({
  windowMs: CSP_DEDUPE_WINDOW_MS,
  maxDetailedReportsPerWindow: CSP_MAX_DETAILED_REPORTS_PER_WINDOW,
  maxFingerprints: CSP_MAX_FINGERPRINTS,
})

let summaryFlushTimer: ReturnType<typeof window.setTimeout> | null = null

const sendPayload = (payload: CspViolationPayload, metadata: CspAntiStormMetadata) => {
  if (!config) return
  void sendCspViolationReport({ ...payload, ...metadata }, config)
}
```

Inside `handleViolation`, after `payload` is built:

```ts
const result = antiStorm.record(payload, payload.observedAt)

if (result.decision === 'send-detail') {
  sendPayload(payload, result.metadata)
} else if (!summaryFlushTimer) {
  summaryFlushTimer = window.setTimeout(() => {
    summaryFlushTimer = null
    flushCspDuplicateSummaries()
  }, CSP_DEDUPE_WINDOW_MS)
}
```

Add:

```ts
function flushCspDuplicateSummaries() {
  if (!config) return
  const summaries = antiStorm.flush(Date.now())

  for (const summary of summaries) {
    const { exemplar, ...metadata } = summary

    void sendCspViolationReport(
      {
        ...exemplar,
        channel: 'securitypolicyviolation',
        observedAt: Date.now(),
        route: exemplar.route ?? window.location.pathname,
        release: config.serviceRelease,
        serviceName: config.serviceName,
        serviceVersion: config.serviceVersion,
        environment: config.environment,
        userAgent: navigator.userAgent,
        language: navigator.language,
        ...metadata,
      },
      config,
    )
  }
}
```

In `destroy()`:

```ts
flushCspDuplicateSummaries()
antiStorm.reset()
if (summaryFlushTimer) {
  window.clearTimeout(summaryFlushTimer)
  summaryFlushTimer = null
}
```

- [ ] **Step 5: Run collector tests and verify GREEN**

Run:

```bash
pnpm test:unit --run src/app/observability/collectors/__tests__/csp-violation-anti-storm.spec.ts src/app/observability/collectors/__tests__/security-policy-collector.spec.ts
```

Expected: PASS.

### Task 3: Carry Dedupe Metadata Through Frontend Observability

**Files:**
- Modify: `/home/meteor/DEV/projects/test/frontend-observability/src/ingest/csp-reports.ts`
- Modify: `/home/meteor/DEV/projects/test/frontend-observability/src/__tests__/csp-reports.spec.ts`

- [ ] **Step 1: Add failing backend OTLP metadata test**

In `/home/meteor/DEV/projects/test/frontend-observability/src/__tests__/csp-reports.spec.ts`, add a test that posts an enhanced `securitypolicyviolation` payload with:

```ts
cspFingerprint: 'script-src|script-src|eval|https://dev.astro777.cfd/assets/index.js|75|29|report|https://dev.astro777.cfd/dashboard',
cspReportKind: 'duplicate-summary',
cspOccurrenceCount: 8,
cspSuppressedDuplicateCount: 8,
cspDedupeWindowMs: 60000,
cspDedupeFirstObservedAt: 1777140000000,
cspDedupeLastObservedAt: 1777140059000,
```

Assert the forwarded OTLP attributes include:

```ts
expect(attributes['csp.fingerprint']).toBe('script-src|script-src|eval|https://dev.astro777.cfd/assets/index.js|75|29|report|https://dev.astro777.cfd/dashboard')
expect(attributes['csp.report_kind']).toBe('duplicate-summary')
expect(attributes['csp.occurrence_count']).toBe(8)
expect(attributes['csp.suppressed_duplicate_count']).toBe(8)
expect(attributes['csp.dedupe_window_ms']).toBe(60000)
expect(attributes['csp.dedupe_first_observed_at']).toBe(1777140000000)
expect(attributes['csp.dedupe_last_observed_at']).toBe(1777140059000)
```

- [ ] **Step 2: Run backend test and verify RED**

Run:

```bash
cd /home/meteor/DEV/projects/test/frontend-observability
pnpm exec vitest run src/__tests__/csp-reports.spec.ts
```

Expected: FAIL because dedupe attributes are not yet mapped.

- [ ] **Step 3: Extend backend record and OTLP mapping**

In `/home/meteor/DEV/projects/test/frontend-observability/src/ingest/csp-reports.ts`, extend `CspReportRecord`:

```ts
cspDedupeFirstObservedAt?: number
cspDedupeLastObservedAt?: number
cspDedupeWindowMs?: number
cspFingerprint?: string
cspOccurrenceCount?: number
cspReportKind?: 'detail' | 'duplicate-summary'
cspSuppressedDuplicateCount?: number
```

Normalize these fields in enhanced payload handling:

```ts
cspDedupeFirstObservedAt: asNumber(body.cspDedupeFirstObservedAt),
cspDedupeLastObservedAt: asNumber(body.cspDedupeLastObservedAt),
cspDedupeWindowMs: asNumber(body.cspDedupeWindowMs),
cspFingerprint: asString(body.cspFingerprint),
cspOccurrenceCount: asNumber(body.cspOccurrenceCount),
cspReportKind: asString(body.cspReportKind) === 'duplicate-summary' ? 'duplicate-summary' : 'detail',
cspSuppressedDuplicateCount: asNumber(body.cspSuppressedDuplicateCount),
```

Add OTLP attributes:

```ts
buildStringAttribute('csp.fingerprint', report.cspFingerprint),
buildStringAttribute('csp.report_kind', report.cspReportKind),
buildIntAttribute('csp.occurrence_count', report.cspOccurrenceCount),
buildIntAttribute('csp.suppressed_duplicate_count', report.cspSuppressedDuplicateCount),
buildIntAttribute('csp.dedupe_window_ms', report.cspDedupeWindowMs),
buildIntAttribute('csp.dedupe_first_observed_at', report.cspDedupeFirstObservedAt),
buildIntAttribute('csp.dedupe_last_observed_at', report.cspDedupeLastObservedAt),
```

- [ ] **Step 4: Run backend tests and verify GREEN**

Run:

```bash
cd /home/meteor/DEV/projects/test/frontend-observability
pnpm exec vitest run src/__tests__/csp-reports.spec.ts
```

Expected: PASS.

### Task 4: Document SigNoz Usage

**Files:**
- Modify: `docs/how-to/operations/frontend-observability.md`

- [ ] **Step 1: Add CSP anti-storm dashboard notes**

Add:

```md
## CSP violation anti-storm fields

The frontend collector keeps the first detailed CSP violation reports for each short-window fingerprint and emits a duplicate summary when repeated events exceed the local cap.

Dashboard filters should still filter dev-only noise at query time rather than dropping events in the frontend collector:

```text
attribute.security.type = 'csp'
AND resource.service.name = 'contract-frontend'
```

Useful grouping fields:

```text
attribute.csp.report_kind
attribute.csp.fingerprint
attribute.csp.effective_directive
attribute.csp.source_file
attribute.csp.blocked_uri
resource.service.release
```

Useful count fields:

```text
attribute.csp.occurrence_count
attribute.csp.suppressed_duplicate_count
```
```

- [ ] **Step 2: Verify documentation references**

Run:

```bash
rg -n "CSP violation anti-storm|csp.report_kind|csp.suppressed_duplicate_count" docs/how-to/operations/frontend-observability.md
```

Expected: all three terms are present.

### Task 5: Final Verification

**Files:**
- Verify frontend focused tests.
- Verify frontend-observability focused tests.
- Verify CSP checks.

- [ ] **Step 1: Run frontend focused tests**

Run:

```bash
pnpm test:unit --run src/app/observability/collectors/__tests__/csp-violation-anti-storm.spec.ts src/app/observability/collectors/__tests__/security-policy-collector.spec.ts src/app/observability/transports/__tests__/security-report-transport.spec.ts
```

Expected: PASS.

- [ ] **Step 2: Run frontend-observability focused tests**

Run:

```bash
cd /home/meteor/DEV/projects/test/frontend-observability
pnpm exec vitest run src/__tests__/csp-reports.spec.ts src/__tests__/csp-source-attribution.spec.ts
```

Expected: PASS.

- [ ] **Step 3: Run CSP guard checks**

Run:

```bash
pnpm check:csp:src
pnpm check:csp:dist
```

Expected: PASS. If `dist` is stale, run `pnpm build` first and state that boundary in the final report.

## Acceptance Criteria

- First occurrences of each CSP fingerprint are still sent as detailed reports.
- Repeated duplicate violations in the same short window do not flood network requests.
- Suppressed duplicates are represented by summary reports with occurrence counts.
- No source-path category is hard-dropped in the frontend collector.
- SigNoz can group by `csp.report_kind`, `csp.fingerprint`, and release metadata.
- Existing release-scoped sourcemap attribution remains unchanged.
