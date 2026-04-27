import { beforeEach, describe, expect, it, vi } from 'vitest'
import { sendBatchToSigNoz, sendToSigNoz } from '@/app/observability/transports/signoz-transport'
import type { ObservabilityConfig, ObservabilityError } from '@/app/observability/types'
import { sendEventBatch, sendEventEnvelope } from '@/app/observability/transports/events-transport'

vi.mock('@/app/observability/transports/events-transport', () => ({
  sendEventEnvelope: vi.fn(),
  sendEventBatch: vi.fn(),
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
  })

  it('does not send when config.enabled is false', async () => {
    await sendToSigNoz(baseError, {
      ...baseConfig,
      enabled: false,
    })

    expect(sendEventEnvelope).not.toHaveBeenCalled()
  })

  it('maps errors to the unified events transport', async () => {
    vi.mocked(sendEventEnvelope).mockResolvedValue(undefined)

    await sendToSigNoz(baseError, {
      ...baseConfig,
      frontendObservabilityEndpoint: 'https://frontend-observability.example.com',
    })

    expect(sendEventEnvelope).toHaveBeenCalledWith(
      expect.objectContaining({
        eventId: 'err-1',
        category: 'error',
        level: 'error',
        message: 'boom',
        service: expect.objectContaining({
          version: '1.0.0',
          release: 'release-a',
        }),
        payload: {
          kind: 'error',
          data: expect.objectContaining({
            source: 'js',
          }),
        },
        tags: expect.objectContaining({
          'git.commit': 'commit-a',
          'git.branch': 'main',
          'build.id': 'run-123',
          'release.channel': 'staging',
        }),
      }),
      expect.objectContaining(baseConfig),
    )
  })

  it('sendBatchToSigNoz skips when disabled/empty and batches each error otherwise', async () => {
    vi.mocked(sendEventBatch).mockResolvedValue(undefined)

    await sendBatchToSigNoz([], baseConfig)
    expect(sendEventBatch).not.toHaveBeenCalled()

    await sendBatchToSigNoz([baseError], { ...baseConfig, enabled: false })
    expect(sendEventBatch).not.toHaveBeenCalled()

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

    expect(sendEventBatch).toHaveBeenCalledTimes(1)
    expect(sendEventBatch).toHaveBeenCalledWith(
      [
        expect.objectContaining({
          eventId: 'err-1',
          category: 'error',
        }),
        expect.objectContaining({
          eventId: 'err-2',
          category: 'error',
        }),
      ],
      expect.objectContaining(baseConfig),
    )
  })
})
