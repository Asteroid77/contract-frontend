import type { CspViolationPayload, ObservabilityConfig } from '../types'
import { getCurrentTraceContext } from '../otel/tracer'
import { getSessionId, getSessionUrl, trackEvent } from '../replay/openreplay'
import { sendCspViolationReport } from '../transports/security-report-transport'
import { createCspViolationAntiStorm, type CspAntiStormMetadata } from './csp-violation-anti-storm'

let isInitialized = false
let config: ObservabilityConfig | null = null

const CSP_DEDUPE_WINDOW_MS = 60_000
const CSP_MAX_DETAILED_REPORTS_PER_WINDOW = 3
const CSP_MAX_FINGERPRINTS = 100

const antiStorm = createCspViolationAntiStorm({
  windowMs: CSP_DEDUPE_WINDOW_MS,
  maxDetailedReportsPerWindow: CSP_MAX_DETAILED_REPORTS_PER_WINDOW,
  maxFingerprints: CSP_MAX_FINGERPRINTS,
})

let summaryFlushTimer: number | null = null

function clearSummaryFlushTimer() {
  if (!summaryFlushTimer || typeof window === 'undefined') {
    return
  }

  window.clearTimeout(summaryFlushTimer)
  summaryFlushTimer = null
}

function sendPayload(payload: CspViolationPayload, metadata: CspAntiStormMetadata) {
  if (!config) {
    return
  }

  void sendCspViolationReport({ ...payload, ...metadata }, config)
}

function flushCspDuplicateSummaries(includeOpenWindow = false) {
  if (!config || typeof window === 'undefined') {
    return
  }

  const observedAt = Date.now()
  const summaries = antiStorm.flush(observedAt, { includeOpenWindow })

  for (const summary of summaries) {
    const { exemplar, ...metadata } = summary

    void sendCspViolationReport(
      {
        ...exemplar,
        channel: 'securitypolicyviolation',
        observedAt,
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

function scheduleSummaryFlush() {
  if (summaryFlushTimer || typeof window === 'undefined') {
    return
  }

  summaryFlushTimer = window.setTimeout(() => {
    summaryFlushTimer = null
    flushCspDuplicateSummaries()
  }, CSP_DEDUPE_WINDOW_MS)
}

function flushOpenSummaries() {
  clearSummaryFlushTimer()
  flushCspDuplicateSummaries(true)
}

const handleViolation = (event: Event) => {
  if (!config) {
    return
  }

  const violation = event as SecurityPolicyViolationEvent

  const traceContext = getCurrentTraceContext()
  const sessionId = getSessionId()
  const sessionUrl = getSessionUrl()

  const payload: CspViolationPayload = {
    channel: 'securitypolicyviolation' as const,
    blockedUri: violation.blockedURI || undefined,
    columnNumber: violation.columnNumber || undefined,
    disposition: violation.disposition,
    documentUri: violation.documentURI || window.location.href,
    effectiveDirective: violation.effectiveDirective,
    lineNumber: violation.lineNumber || undefined,
    originalPolicy: violation.originalPolicy,
    referrer: document.referrer || undefined,
    route: window.location.pathname,
    sample: violation.sample || undefined,
    sessionId: sessionId || undefined,
    sessionUrl: sessionUrl || undefined,
    serviceName: config.serviceName,
    serviceVersion: config.serviceVersion,
    sourceFile: violation.sourceFile || undefined,
    spanId: traceContext.spanId,
    statusCode: violation.statusCode || undefined,
    traceId: traceContext.traceId,
    violatedDirective: violation.violatedDirective,
    observedAt: Date.now(),
    release: config.serviceRelease,
    gitCommit: config.gitCommit,
    gitBranch: config.gitBranch,
    buildId: config.buildId,
    releaseChannel: config.releaseChannel,
    environment: config.environment,
    userAgent: navigator.userAgent,
    language: navigator.language,
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight,
    },
  }

  flushCspDuplicateSummaries()

  const result = antiStorm.record(payload, payload.observedAt)

  if (result.decision === 'send-detail') {
    sendPayload(payload, result.metadata)
  } else {
    scheduleSummaryFlush()
  }

  trackEvent('csp_violation', {
    blockedUri: payload.blockedUri,
    disposition: payload.disposition,
    effectiveDirective: payload.effectiveDirective,
    violatedDirective: payload.violatedDirective,
  })
}

export const securityPolicyCollector = {
  init(nextConfig: ObservabilityConfig): void {
    if (isInitialized || typeof window === 'undefined') {
      return
    }

    config = nextConfig
    window.addEventListener('securitypolicyviolation', handleViolation)
    window.addEventListener('pagehide', flushOpenSummaries)
    isInitialized = true
  },

  destroy(): void {
    if (typeof window === 'undefined') {
      antiStorm.reset()
      config = null
      isInitialized = false
      return
    }

    if (isInitialized) {
      window.removeEventListener('securitypolicyviolation', handleViolation)
      window.removeEventListener('pagehide', flushOpenSummaries)
    }

    flushOpenSummaries()
    antiStorm.reset()
    isInitialized = false
    config = null
  },
}
