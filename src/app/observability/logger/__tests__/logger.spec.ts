import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ObservabilityConfig } from '@/app/observability/types'
import { getCurrentTraceContext } from '@/app/observability/otel/tracer'
import { getSessionId, getSessionUrl } from '@/app/observability/replay/openreplay'
import { sendEventEnvelope } from '@/app/observability/transports/events-transport'

vi.mock('@/app/observability/otel/tracer', () => ({
  getCurrentTraceContext: vi.fn(() => ({ traceId: 'trace-1', spanId: 'span-1' })),
}))

vi.mock('@/app/observability/replay/openreplay', () => ({
  getSessionId: vi.fn(() => 'session-1'),
  getSessionUrl: vi.fn(() => 'https://replay.example.com/s/session-1'),
}))

vi.mock('@/app/observability/transports/events-transport', () => ({
  sendEventEnvelope: vi.fn(),
}))

vi.mock('@/app/observability/utils/nanoid', () => ({
  nanoid: vi.fn(() => 'evt-fixed-id'),
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
  enabled: true,
  sampleRate: 1,
  debug: true,
}

describe('logger facade', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
    window.history.replaceState({}, '', '/approval/1?tab=activity')
  })

  it.each(['debug', 'info', 'warn', 'error'] as const)(
    'builds a %s event envelope with common runtime context',
    async (level) => {
      const { initLogger, logger } = await import('@/app/observability/logger')

      initLogger(baseConfig)
      await logger[level]('frontend ready', {
        module: 'approval',
        component: 'ApprovalView',
        data: {
          step: 'boot',
        },
      })

      expect(getCurrentTraceContext).toHaveBeenCalledTimes(1)
      expect(getSessionId).toHaveBeenCalledTimes(1)
      expect(getSessionUrl).toHaveBeenCalledTimes(1)
      expect(sendEventEnvelope).toHaveBeenCalledWith(
        expect.objectContaining({
          eventId: 'evt-fixed-id',
          category: 'log',
          level,
          message: 'frontend ready',
          service: {
            name: 'contract-frontend',
            version: '1.0.0',
            environment: 'development',
            release: 'release-a',
          },
          context: {
            url: `${window.location.origin}/approval/1?tab=activity`,
            route: '/approval/1',
          },
          session: {
            sessionId: 'session-1',
            sessionUrl: 'https://replay.example.com/s/session-1',
          },
          trace: {
            traceId: 'trace-1',
            spanId: 'span-1',
          },
          payload: {
            kind: 'log',
            data: {
              step: 'boot',
            },
          },
          tags: {
            module: 'approval',
            component: 'ApprovalView',
            'git.commit': 'commit-a',
            'git.branch': 'main',
            'build.id': 'run-123',
            'release.channel': 'staging',
          },
        }),
        expect.objectContaining(baseConfig),
      )
    },
  )

  it('skips debug events by default in production', async () => {
    const { initLogger, logger } = await import('@/app/observability/logger')

    initLogger({
      ...baseConfig,
      environment: 'production',
      debug: false,
    })

    await logger.debug('diagnostic detail')

    expect(sendEventEnvelope).not.toHaveBeenCalled()
  })
})
