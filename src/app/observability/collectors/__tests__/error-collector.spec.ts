import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ObservabilityConfig } from '@/app/observability/types'
import {
  captureError,
  captureHttpError,
  capturePermissionError,
  captureVueError,
  clearErrorBuffer,
  getRecentErrors,
  initErrorCollector,
} from '@/app/observability/collectors/error-collector'
import { recordError } from '@/app/observability/otel/tracer'
import { sendToSigNoz } from '@/app/observability/transports/signoz-transport'
import { trackError } from '@/app/observability/replay/openreplay'

vi.mock('@/app/observability/utils/nanoid', () => ({
  nanoid: vi.fn(() => 'err-fixed-id'),
}))

vi.mock('@/app/observability/otel/tracer', () => ({
  getCurrentTraceContext: vi.fn(() => ({ traceId: 'trace-1', spanId: 'span-1' })),
  recordError: vi.fn(),
}))

vi.mock('@/app/observability/transports/signoz-transport', () => ({
  sendToSigNoz: vi.fn(),
}))

vi.mock('@/app/observability/replay/openreplay', () => ({
  getSessionId: vi.fn(() => 'session-1'),
  getSessionUrl: vi.fn(() => 'https://replay.example.com/s/session-1'),
  trackError: vi.fn(),
}))

vi.mock('@/_utils/i18n', () => ({
  $t: (key: string) => `t:${key}`,
}))

const baseConfig: ObservabilityConfig = {
  serviceName: 'contract-frontend',
  serviceVersion: '1.0.0',
  environment: 'development',
  otelEndpoint: 'https://otel.example.com',
  enabled: true,
  sampleRate: 1,
  debug: true,
}

describe('error-collector', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    clearErrorBuffer()
    initErrorCollector({
      ...baseConfig,
      ignoreErrors: undefined,
      ignoreUrls: undefined,
      sampleRate: 1,
    })
  })

  it('captureError enriches payload and delegates to tracer/sigNoz/openreplay', () => {
    const result = captureError(new Error('core-error-1'), {
      source: 'js',
      code: 1001,
      context: { scene: 'unit-test' },
      tags: { feature: 'observability' },
    })

    expect(result).toBeTruthy()
    expect(result?.id).toBe('err-fixed-id')
    expect(result?.message).toBe('core-error-1')
    expect(result?.traceId).toBe('trace-1')
    expect(result?.spanId).toBe('span-1')
    expect(result?.context).toMatchObject({
      scene: 'unit-test',
      sessionId: 'session-1',
      sessionUrl: 'https://replay.example.com/s/session-1',
    })
    expect(result?.tags).toMatchObject({
      feature: 'observability',
      environment: 'development',
      version: '1.0.0',
      'error.source': 'js',
      'session.id': 'session-1',
    })

    expect(recordError).toHaveBeenCalledTimes(1)
    expect(sendToSigNoz).toHaveBeenCalledWith(result, expect.objectContaining(baseConfig))
    expect(trackError).toHaveBeenCalledWith(expect.any(Error), {
      traceId: 'trace-1',
      source: 'js',
      code: 1001,
    })

    expect(getRecentErrors()).toHaveLength(1)
  })

  it('ignores matched errors and sampled-out errors', () => {
    initErrorCollector({
      ...baseConfig,
      ignoreErrors: [/ignore-this-message/],
      sampleRate: 1,
    })

    const ignored = captureError(new Error('ignore-this-message'))
    expect(ignored).toBeNull()

    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.99)
    initErrorCollector({
      ...baseConfig,
      ignoreErrors: undefined,
      sampleRate: 0,
    })

    const sampledOut = captureError(new Error('sample-out-message'))
    expect(sampledOut).toBeNull()
    expect(sendToSigNoz).not.toHaveBeenCalled()

    randomSpy.mockRestore()
  })

  it('deduplicates same error within dedup window', () => {
    const duplicateError = new Error('dup-message')
    const first = captureError(duplicateError)
    const second = captureError(duplicateError)

    expect(first).toBeTruthy()
    expect(second).toBeNull()
    expect(sendToSigNoz).toHaveBeenCalledTimes(1)
  })

  it('captureVueError/captureHttpError/capturePermissionError map source and severity correctly', () => {
    const vue = captureVueError(new Error('vue-boom'), { $options: { name: 'CompA' } }, 'render')
    expect(vue?.source).toBe('vue')
    expect(vue?.severity).toBe('error')

    const httpWarn = captureHttpError(
      Object.assign(new Error('http-400'), { status: 400, code: 40001, traceId: 'trace-http' }),
    )
    expect(httpWarn?.source).toBe('http')
    expect(httpWarn?.severity).toBe('warning')

    const httpError = captureHttpError(
      Object.assign(new Error('http-500'), { status: 500, code: 50001, traceId: 'trace-http-500' }),
    )
    expect(httpError?.severity).toBe('error')

    const permission = capturePermissionError('create', 'User', 'forbidden')
    expect(permission?.source).toBe('permission')
    expect(permission?.severity).toBe('warning')
    expect(permission?.tags).toMatchObject({
      'permission.action': 'create',
      'permission.subject': 'User',
    })
  })

  it('clearErrorBuffer clears previously captured errors', () => {
    captureError(new Error('buffer-a'))
    captureError(new Error('buffer-b'))
    expect(getRecentErrors().length).toBeGreaterThan(0)

    clearErrorBuffer()
    expect(getRecentErrors()).toEqual([])
  })
})
