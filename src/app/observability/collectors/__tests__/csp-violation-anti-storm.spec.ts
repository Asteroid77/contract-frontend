import { describe, expect, it } from 'vitest'
import {
  createCspViolationAntiStorm,
  createCspViolationFingerprint,
} from '@/app/observability/collectors/csp-violation-anti-storm'

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
  it('creates stable fingerprints from the configured attribution fields', () => {
    const fingerprint = createCspViolationFingerprint(violation)

    expect(fingerprint).toBe(
      'script-src|script-src|eval|https://dev.astro777.cfd/assets/index.js|75|29|report|https://dev.astro777.cfd/dashboard',
    )
    expect(
      createCspViolationFingerprint({
        ...violation,
        route: '/approval/1',
        sample: 'different sample',
      }),
    ).toBe(fingerprint)
    expect(
      createCspViolationFingerprint({
        ...violation,
        sourceFile: 'https://dev.astro777.cfd/assets/chunk.js',
      }),
    ).not.toBe(fingerprint)
  })

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

  it('bounds fingerprint cache by evicting the oldest seen fingerprint', () => {
    const antiStorm = createCspViolationAntiStorm({
      windowMs: 60_000,
      maxDetailedReportsPerWindow: 1,
      maxFingerprints: 1,
    })
    const anotherViolation = {
      ...violation,
      blockedUri: 'https://evil.example.com/app.js',
    }

    expect(antiStorm.record(violation, 1_000).decision).toBe('send-detail')
    expect(antiStorm.record(anotherViolation, 2_000).decision).toBe('send-detail')
    expect(antiStorm.record(violation, 3_000).decision).toBe('send-detail')
  })
})
