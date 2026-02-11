import { beforeEach, describe, expect, it, vi } from 'vitest'
import { sendBatchToSigNoz, sendToSigNoz } from '@/app/observability/transports/signoz-transport'
import type { ObservabilityConfig, ObservabilityError } from '@/app/observability/types'

const baseConfig: ObservabilityConfig = {
  serviceName: 'contract-frontend',
  serviceVersion: '1.0.0',
  environment: 'development',
  otelEndpoint: 'https://otel.example.com',
  enabled: true,
  sampleRate: 1,
  debug: true,
}

const baseError: ObservabilityError = {
  id: 'err-1',
  source: 'js',
  severity: 'error',
  message: 'boom',
  timestamp: 1700000000000,
  page: {
    url: 'https://app.example.com',
  },
}

describe('signoz-transport', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('fetch', vi.fn())
  })

  it('does not send when config.enabled is false', async () => {
    await sendToSigNoz(baseError, {
      ...baseConfig,
      enabled: false,
    })

    expect(fetch).not.toHaveBeenCalled()
  })

  it('sends payload to sourcemap endpoint when configured', async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: true } as never)

    await sendToSigNoz(baseError, {
      ...baseConfig,
      sourcemapResolverEndpoint: 'https://resolver.example.com',
    })

    expect(fetch).toHaveBeenCalledTimes(1)
    const [url, options] = vi.mocked(fetch).mock.calls[0]
    expect(url).toBe('https://resolver.example.com/v1/errors')
    expect((options as RequestInit).method).toBe('POST')
    expect((options as RequestInit).keepalive).toBe(true)
    expect((options as RequestInit).headers).toEqual({ 'Content-Type': 'application/json' })
    expect(typeof (options as RequestInit).body).toBe('string')
  })

  it('warns in debug mode when response is not ok or fetch fails', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    vi.mocked(fetch).mockResolvedValueOnce({ ok: false, status: 500 } as never)
    await sendToSigNoz(baseError, baseConfig)

    vi.mocked(fetch).mockRejectedValueOnce(new Error('network down'))
    await sendToSigNoz(baseError, baseConfig)

    expect(warnSpy).toHaveBeenCalledTimes(2)
    warnSpy.mockRestore()
  })

  it('sendBatchToSigNoz skips when disabled/empty and sends each error otherwise', async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: true } as never)

    await sendBatchToSigNoz([], baseConfig)
    expect(fetch).not.toHaveBeenCalled()

    await sendBatchToSigNoz([baseError], { ...baseConfig, enabled: false })
    expect(fetch).not.toHaveBeenCalled()

    await sendBatchToSigNoz(
      [
        baseError,
        {
          ...baseError,
          id: 'err-2',
          message: 'boom-2',
        },
      ],
      baseConfig,
    )

    expect(fetch).toHaveBeenCalledTimes(2)
  })
})
