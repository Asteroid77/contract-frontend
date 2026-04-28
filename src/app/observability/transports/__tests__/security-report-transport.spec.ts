import { beforeEach, describe, expect, it, vi } from 'vitest'
import { sendCspViolationReport } from '@/app/observability/transports/security-report-transport'
import type { CspViolationPayload, ObservabilityConfig } from '@/app/observability/types'

const baseConfig: ObservabilityConfig = {
  serviceName: 'contract-frontend',
  serviceVersion: '1.0.0',
  serviceRelease: 'release-a',
  environment: 'development',
  otelTracesEndpoint: 'https://otel.example.com',
  otelEndpoint: 'https://otel.example.com',
  frontendObservabilityEndpoint: 'https://frontend-observability.example.com',
  enabled: false,
  sampleRate: 1,
  debug: true,
}

const basePayload: CspViolationPayload = {
  channel: 'securitypolicyviolation',
  documentUri: 'https://dev.astro777.cfd/approval/1',
  violatedDirective: 'script-src-elem',
  effectiveDirective: 'script-src-elem',
  originalPolicy: "default-src 'self'; script-src 'self'",
  blockedUri: 'https://evil.example.com/app.js',
  disposition: 'report',
  referrer: 'https://dev.astro777.cfd/dashboard',
  route: '/approval/1',
  observedAt: 1700000000000,
  sessionId: 'session-1',
  sessionUrl: 'https://replay.example.com/session-1',
}

describe('security-report-transport', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('fetch', vi.fn())
  })

  it('posts CSP violation payloads to frontend observability endpoint even when general observability is disabled', async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: true } as never)

    await sendCspViolationReport(basePayload, baseConfig)

    expect(fetch).toHaveBeenCalledTimes(1)
    const [url, options] = vi.mocked(fetch).mock.calls[0]
    expect(url).toBe('https://frontend-observability.example.com/v1/security/csp-reports')
    expect((options as RequestInit).method).toBe('POST')
    expect((options as RequestInit).keepalive).toBe(true)
    expect((options as RequestInit).headers).toEqual({ 'Content-Type': 'application/json' })
    expect(typeof (options as RequestInit).body).toBe('string')
  })

  it('warns in debug mode when delivery fails', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    vi.mocked(fetch).mockResolvedValueOnce({ ok: false, status: 500 } as never)
    await sendCspViolationReport(basePayload, baseConfig)

    vi.mocked(fetch).mockRejectedValueOnce(new Error('network down'))
    await sendCspViolationReport(basePayload, baseConfig)

    expect(warnSpy).toHaveBeenCalledTimes(2)
    warnSpy.mockRestore()
  })
})
