import type { CspViolationPayload, ObservabilityConfig } from '../types'
import { getCurrentTraceContext } from '../otel/tracer'
import { getSessionId, getSessionUrl, trackEvent } from '../replay/openreplay'
import { sendCspViolationReport } from '../transports/security-report-transport'

let isInitialized = false
let config: ObservabilityConfig | null = null

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
    release: config.serviceRelease ?? config.serviceVersion,
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

  void sendCspViolationReport(payload, config)

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
    isInitialized = true
  },

  destroy(): void {
    if (typeof window === 'undefined') {
      config = null
      isInitialized = false
      return
    }

    if (isInitialized) {
      window.removeEventListener('securitypolicyviolation', handleViolation)
    }

    isInitialized = false
    config = null
  },
}
