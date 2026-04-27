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
  detailedCount: number
  exemplar: CspViolationFingerprintInput
  firstSuppressedAt?: number
  lastSeenAt: number
  lastSuppressedAt?: number
  suppressedCount: number
  windowStartedAt: number
}

type FlushOptions = {
  includeOpenWindow?: boolean
}

const normalize = (value: string | number | undefined) => String(value ?? '')

const copyExemplar = (input: CspViolationFingerprintInput): CspViolationFingerprintInput => ({
  ...input,
})

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
      if (!oldest) {
        return
      }
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
    if (state.suppressedCount === 0) {
      return null
    }

    return {
      cspFingerprint: fingerprint,
      cspReportKind: 'duplicate-summary',
      cspOccurrenceCount: state.suppressedCount,
      cspSuppressedDuplicateCount: state.suppressedCount,
      cspDedupeWindowMs: options.windowMs,
      cspDedupeFirstObservedAt: state.firstSuppressedAt,
      cspDedupeLastObservedAt: state.lastSuppressedAt,
      exemplar: copyExemplar(state.exemplar),
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
          exemplar: copyExemplar(input),
        })
        evictIfNeeded()
        return { decision: 'send-detail' as const, metadata: buildDetailMetadata(fingerprint) }
      }

      existing.lastSeenAt = now
      existing.exemplar = copyExemplar(input)

      if (existing.detailedCount < options.maxDetailedReportsPerWindow) {
        existing.detailedCount += 1
        return { decision: 'send-detail' as const, metadata: buildDetailMetadata(fingerprint) }
      }

      existing.suppressedCount += 1
      existing.firstSuppressedAt ??= now
      existing.lastSuppressedAt = now
      return { decision: 'suppress-duplicate' as const, fingerprint }
    },

    flush(now: number, flushOptions: FlushOptions = {}) {
      const summaries: CspDuplicateSummary[] = []

      for (const [fingerprint, state] of states.entries()) {
        if (state.suppressedCount === 0) {
          continue
        }
        if (!flushOptions.includeOpenWindow && now - state.windowStartedAt < options.windowMs) {
          continue
        }

        const summary = buildSummary(fingerprint, state)
        if (summary) {
          summaries.push(summary)
        }
        states.delete(fingerprint)
      }

      return summaries
    },

    reset() {
      states.clear()
    },
  }
}
