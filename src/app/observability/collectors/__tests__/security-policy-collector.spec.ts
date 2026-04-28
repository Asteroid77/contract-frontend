import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { securityPolicyCollector } from '@/app/observability/collectors/security-policy-collector'
import type { ObservabilityConfig } from '@/app/observability/types'
import { getCurrentTraceContext } from '@/app/observability/otel/tracer'
import { getSessionId, getSessionUrl, trackEvent } from '@/app/observability/replay/openreplay'
import { sendCspViolationReport } from '@/app/observability/transports/security-report-transport'

vi.mock('@/app/observability/otel/tracer', () => ({
  getCurrentTraceContext: vi.fn(() => ({ traceId: 'trace-1', spanId: 'span-1' })),
}))

vi.mock('@/app/observability/replay/openreplay', () => ({
  getSessionId: vi.fn(() => 'session-1'),
  getSessionUrl: vi.fn(() => 'https://replay.example.com/session-1'),
  trackEvent: vi.fn(),
}))

vi.mock('@/app/observability/transports/security-report-transport', () => ({
  sendCspViolationReport: vi.fn(),
}))

const baseConfig: ObservabilityConfig = {
  serviceName: 'contract-frontend',
  serviceVersion: '1.0.0',
  serviceRelease: 'release-a',
  gitCommit: 'commit-a',
  gitBranch: 'main',
  buildId: 'run-123',
  releaseChannel: 'staging',
  environment: 'development',
  otelTracesEndpoint: 'https://otel.example.com',
  otelEndpoint: 'https://otel.example.com',
  frontendObservabilityEndpoint: 'https://frontend-observability.example.com',
  enabled: false,
  sampleRate: 1,
  debug: true,
}

function createSecurityPolicyViolationEvent() {
  const event = new Event('securitypolicyviolation') as SecurityPolicyViolationEvent

  Object.assign(event, {
    blockedURI: 'https://evil.example.com/app.js',
    columnNumber: 17,
    disposition: 'report',
    documentURI: 'https://dev.astro777.cfd/approval/1',
    effectiveDirective: 'script-src-elem',
    lineNumber: 9,
    originalPolicy: "default-src 'self'; script-src 'self'",
    sample: '<script src="https://evil.example.com/app.js">',
    sourceFile: 'https://dev.astro777.cfd/index.html',
    statusCode: 200,
    violatedDirective: 'script-src-elem',
  })

  return event
}

function createOtelEvalViolationEvent() {
  const event = new Event('securitypolicyviolation') as SecurityPolicyViolationEvent

  Object.assign(event, {
    blockedURI: 'eval',
    columnNumber: 32,
    disposition: 'report',
    documentURI: 'https://dev.astro777.cfd/dashboard',
    effectiveDirective: 'script-src',
    lineNumber: 399,
    originalPolicy: "default-src 'self'; script-src 'self'",
    sample: 'require',
    sourceFile:
      'https://dev.astro777.cfd/node_modules/.vite/deps/@opentelemetry_exporter-trace-otlp-http.js',
    statusCode: 200,
    violatedDirective: 'script-src',
  })

  return event
}

describe('securityPolicyCollector', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    securityPolicyCollector.destroy()
  })

  afterEach(() => {
    securityPolicyCollector.destroy()
    vi.useRealTimers()
  })

  it('registers listener only once and removes it on destroy', () => {
    const addSpy = vi.spyOn(window, 'addEventListener')
    const removeSpy = vi.spyOn(window, 'removeEventListener')

    securityPolicyCollector.init(baseConfig)
    securityPolicyCollector.init(baseConfig)
    securityPolicyCollector.destroy()

    expect(addSpy).toHaveBeenCalledTimes(2)
    expect(addSpy).toHaveBeenCalledWith('securitypolicyviolation', expect.any(Function))
    expect(addSpy).toHaveBeenCalledWith('pagehide', expect.any(Function))
    expect(removeSpy).toHaveBeenCalledTimes(2)
    expect(removeSpy).toHaveBeenCalledWith('securitypolicyviolation', expect.any(Function))
    expect(removeSpy).toHaveBeenCalledWith('pagehide', expect.any(Function))

    addSpy.mockRestore()
    removeSpy.mockRestore()
  })

  it('enriches violation events with tracing and session context', () => {
    securityPolicyCollector.init(baseConfig)

    window.dispatchEvent(createSecurityPolicyViolationEvent())

    expect(getCurrentTraceContext).toHaveBeenCalledTimes(1)
    expect(getSessionId).toHaveBeenCalledTimes(1)
    expect(getSessionUrl).toHaveBeenCalledTimes(1)
    expect(sendCspViolationReport).toHaveBeenCalledWith(
      expect.objectContaining({
        channel: 'securitypolicyviolation',
        blockedUri: 'https://evil.example.com/app.js',
        documentUri: 'https://dev.astro777.cfd/approval/1',
        effectiveDirective: 'script-src-elem',
        violatedDirective: 'script-src-elem',
        route: window.location.pathname,
        traceId: 'trace-1',
        spanId: 'span-1',
        sessionId: 'session-1',
        sessionUrl: 'https://replay.example.com/session-1',
        serviceName: 'contract-frontend',
        serviceVersion: '1.0.0',
        release: 'release-a',
        gitCommit: 'commit-a',
        gitBranch: 'main',
        buildId: 'run-123',
        releaseChannel: 'staging',
        environment: 'development',
      }),
      expect.objectContaining(baseConfig),
    )
    expect(trackEvent).toHaveBeenCalledWith(
      'csp_violation',
      expect.objectContaining({
        effectiveDirective: 'script-src-elem',
        violatedDirective: 'script-src-elem',
      }),
    )
  })

  it('reports known OTel dev eval violation noise in development', () => {
    securityPolicyCollector.init(baseConfig)

    window.dispatchEvent(createOtelEvalViolationEvent())

    expect(getCurrentTraceContext).toHaveBeenCalledTimes(1)
    expect(getSessionId).toHaveBeenCalledTimes(1)
    expect(getSessionUrl).toHaveBeenCalledTimes(1)
    expect(sendCspViolationReport).toHaveBeenCalledWith(
      expect.objectContaining({
        blockedUri: 'eval',
        effectiveDirective: 'script-src',
        sample: 'require',
        sourceFile:
          'https://dev.astro777.cfd/node_modules/.vite/deps/@opentelemetry_exporter-trace-otlp-http.js',
        violatedDirective: 'script-src',
      }),
      expect.objectContaining(baseConfig),
    )
    expect(trackEvent).toHaveBeenCalledWith(
      'csp_violation',
      expect.objectContaining({
        effectiveDirective: 'script-src',
        violatedDirective: 'script-src',
      }),
    )
  })

  it('does not ignore the same OTel eval signature outside development', () => {
    securityPolicyCollector.init({
      ...baseConfig,
      environment: 'production',
    })

    window.dispatchEvent(createOtelEvalViolationEvent())

    expect(sendCspViolationReport).toHaveBeenCalledTimes(1)
    expect(trackEvent).toHaveBeenCalledTimes(1)
  })

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
  })

  it('flushes pending duplicate CSP summaries on pagehide', () => {
    vi.useFakeTimers()
    vi.setSystemTime(1_000)
    securityPolicyCollector.init(baseConfig)

    window.dispatchEvent(createSecurityPolicyViolationEvent())
    window.dispatchEvent(createSecurityPolicyViolationEvent())
    window.dispatchEvent(createSecurityPolicyViolationEvent())
    window.dispatchEvent(createSecurityPolicyViolationEvent())

    expect(sendCspViolationReport).toHaveBeenCalledTimes(3)

    window.dispatchEvent(new Event('pagehide'))

    expect(sendCspViolationReport).toHaveBeenCalledTimes(4)
    expect(sendCspViolationReport).toHaveBeenLastCalledWith(
      expect.objectContaining({
        cspReportKind: 'duplicate-summary',
        cspOccurrenceCount: 1,
        cspSuppressedDuplicateCount: 1,
        sourceFile: 'https://dev.astro777.cfd/index.html',
      }),
      expect.objectContaining(baseConfig),
    )
  })
})
