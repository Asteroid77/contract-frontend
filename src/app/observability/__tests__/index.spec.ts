import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  initTracerSpy,
  shutdownTracerSpy,
  initErrorCollectorSpy,
  setupVueErrorHandlerSpy,
  initOpenReplaySpy,
  stopOpenReplaySpy,
  getSessionIdSpy,
  getSessionUrlSpy,
  setReplayUserSpy,
  jsInitSpy,
  jsDestroySpy,
} = vi.hoisted(() => ({
  initTracerSpy: vi.fn(),
  shutdownTracerSpy: vi.fn(() => Promise.resolve()),
  initErrorCollectorSpy: vi.fn(),
  setupVueErrorHandlerSpy: vi.fn(),
  initOpenReplaySpy: vi.fn(),
  stopOpenReplaySpy: vi.fn(),
  getSessionIdSpy: vi.fn(() => 'session-1'),
  getSessionUrlSpy: vi.fn(() => 'https://replay.example.com/s/session-1'),
  setReplayUserSpy: vi.fn(),
  jsInitSpy: vi.fn(),
  jsDestroySpy: vi.fn(),
}))

vi.mock('@/app/observability/otel/tracer', () => ({
  initTracer: initTracerSpy,
  shutdownTracer: shutdownTracerSpy,
  getTracer: vi.fn(),
  withSpan: vi.fn(),
  getCurrentTraceContext: vi.fn(),
  recordError: vi.fn(),
}))

vi.mock('@/app/observability/collectors/error-collector', () => ({
  initErrorCollector: initErrorCollectorSpy,
  captureError: vi.fn(),
  captureVueError: vi.fn(),
  captureHttpError: vi.fn(),
  capturePermissionError: vi.fn(),
  getRecentErrors: vi.fn(() => []),
}))

vi.mock('@/app/observability/collectors/js-error-collector', () => ({
  jsErrorCollector: {
    init: jsInitSpy,
    destroy: jsDestroySpy,
  },
}))

vi.mock('@/app/observability/collectors/vue-error-collector', () => ({
  setupVueErrorHandler: setupVueErrorHandlerSpy,
}))

vi.mock('@/app/observability/replay/openreplay', () => ({
  initOpenReplay: initOpenReplaySpy,
  stopOpenReplay: stopOpenReplaySpy,
  getSessionId: getSessionIdSpy,
  getSessionUrl: getSessionUrlSpy,
  setUser: setReplayUserSpy,
  trackEvent: vi.fn(),
  trackIssue: vi.fn(),
}))

describe('observability index', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('initObservability initializes all modules and prevents duplicate init', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    const module = await import('@/app/observability')
    const app = { config: {} }

    module.initObservability(app as never, {
      observability: {
        enabled: true,
        debug: true,
      },
      openReplay: {
        projectKey: 'pk',
        enabled: true,
      },
    })

    expect(initErrorCollectorSpy).toHaveBeenCalledTimes(1)
    expect(initTracerSpy).toHaveBeenCalledTimes(1)
    expect(setupVueErrorHandlerSpy).toHaveBeenCalledWith(app)
    expect(jsInitSpy).toHaveBeenCalledTimes(1)
    expect(initOpenReplaySpy).toHaveBeenCalledTimes(1)

    module.initObservability(app as never)
    expect(warnSpy).toHaveBeenCalledWith('[Observability] Already initialized')
    expect(initErrorCollectorSpy).toHaveBeenCalledTimes(1)

    warnSpy.mockRestore()
    logSpy.mockRestore()
  })

  it('shutdownObservability no-ops before init and clears resources after init', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    const module = await import('@/app/observability')
    const app = { config: {} }

    await module.shutdownObservability()
    expect(jsDestroySpy).not.toHaveBeenCalled()

    module.initObservability(app as never, {
      observability: {
        enabled: true,
      },
    })

    await module.shutdownObservability()

    expect(jsDestroySpy).toHaveBeenCalledTimes(1)
    expect(stopOpenReplaySpy).toHaveBeenCalledTimes(1)
    expect(shutdownTracerSpy).toHaveBeenCalledTimes(1)

    logSpy.mockRestore()
  })

  it('setUser/getSessionInfo delegate to replay layer', async () => {
    const module = await import('@/app/observability')

    module.setUser('u-1', {
      username: 'alice',
      email: 'alice@example.com',
    })

    expect(setReplayUserSpy).toHaveBeenCalledWith('u-1', {
      username: 'alice',
      email: 'alice@example.com',
    })

    expect(module.getSessionInfo()).toEqual({
      sessionId: 'session-1',
      sessionUrl: 'https://replay.example.com/s/session-1',
    })
  })
})
