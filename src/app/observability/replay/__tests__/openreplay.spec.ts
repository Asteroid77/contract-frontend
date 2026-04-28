import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { trackerMock, trackerCtor, workerCtor, createObjectURLMock } = vi.hoisted(() => {
  const tracker = {
    start: vi.fn(() => Promise.resolve({ sessionID: 'session-abc' })),
    getSessionID: vi.fn(() => 'session-live'),
    getSessionURL: vi.fn(() => 'https://openreplay.example.com/session/session-live'),
    setUserID: vi.fn(),
    setMetadata: vi.fn(),
    event: vi.fn(),
    issue: vi.fn(),
    stop: vi.fn(),
  }

  const worker = vi.fn(function WorkerMock(_scriptURL?: string | URL, _options?: WorkerOptions) {
    return {
      postMessage: vi.fn(),
      terminate: vi.fn(),
    }
  })
  const createObjectURL = vi.fn(
    (_object: Blob | MediaSource) => 'blob:https://example.test/openreplay-worker',
  )
  const ctor = vi.fn(() => {
    const workerUrl = createObjectURL(
      new Blob(['self.onmessage = () => {}'], { type: 'text/javascript' }),
    )
    new globalThis.Worker(workerUrl)
    return tracker
  })

  return {
    trackerMock: tracker,
    trackerCtor: ctor,
    workerCtor: worker,
    createObjectURLMock: createObjectURL,
  }
})

vi.mock('@openreplay/tracker', () => ({
  default: trackerCtor,
}))

import {
  getSessionId,
  getSessionUrl,
  getTracker,
  initOpenReplay,
  setUser,
  stopOpenReplay,
  trackError,
  trackEvent,
  trackIssue,
} from '@/app/observability/replay/openreplay'

describe('openreplay', () => {
  const originalCreateObjectURL = URL.createObjectURL
  const originalWorker = globalThis.Worker

  beforeEach(() => {
    vi.clearAllMocks()
    sessionStorage.clear()
    stopOpenReplay()
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      writable: true,
      value: createObjectURLMock,
    })
    Object.defineProperty(globalThis, 'Worker', {
      configurable: true,
      writable: true,
      value: workerCtor,
    })
  })

  afterEach(() => {
    stopOpenReplay()
    sessionStorage.clear()
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      writable: true,
      value: originalCreateObjectURL,
    })
    if (originalWorker) {
      Object.defineProperty(globalThis, 'Worker', {
        configurable: true,
        writable: true,
        value: originalWorker,
      })
    } else {
      Reflect.deleteProperty(globalThis, 'Worker')
    }
    Reflect.deleteProperty(window as Window & { trustedTypes?: unknown }, 'trustedTypes')
  })

  it('returns null and does not initialize when disabled', () => {
    const result = initOpenReplay({
      projectKey: 'pk',
      enabled: false,
    })

    expect(result).toBeNull()
    expect(trackerCtor).not.toHaveBeenCalled()
  })

  it('initializes tracker once and reuses instance on repeated init', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    const first = initOpenReplay({
      projectKey: 'pk',
      ingestPoint: 'https://ingest.example.com',
      enabled: true,
    })

    expect(first).toBe(trackerMock)
    expect(getTracker()).toBe(trackerMock)
    expect(trackerCtor).toHaveBeenCalledTimes(1)

    await Promise.resolve()
    expect(sessionStorage.getItem('openreplay_session_id')).toBe('session-abc')

    const second = initOpenReplay({
      projectKey: 'pk',
      enabled: true,
    })

    expect(second).toBe(first)
    expect(warnSpy).toHaveBeenCalledWith('[OpenReplay] Already initialized')

    warnSpy.mockRestore()
    logSpy.mockRestore()
  })

  it('resolves same-origin relative ingest points before constructing tracker', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    initOpenReplay({
      projectKey: 'pk',
      ingestPoint: '/observability/frontend/replay',
      enabled: true,
    })

    expect(trackerCtor).toHaveBeenCalledWith(
      expect.objectContaining({
        ingestPoint: `${window.location.origin}/observability/frontend/replay`,
      }),
    )

    logSpy.mockRestore()
  })

  it('defaults ingest point to same-origin replay path when not configured', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    initOpenReplay({
      projectKey: 'pk',
      enabled: true,
    })

    expect(trackerCtor).toHaveBeenCalledWith(
      expect.objectContaining({
        ingestPoint: `${window.location.origin}/observability/frontend/replay`,
      }),
    )

    logSpy.mockRestore()
  })

  it('wraps OpenReplay worker blob URLs with Trusted Types when supported', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    const createScriptURLSpy = vi.fn((input: string) => `trusted:${input}`)
    const createPolicySpy = vi.fn(() => ({
      createHTML: (input: string) => input,
      createScriptURL: createScriptURLSpy,
    }))

    Object.defineProperty(window, 'trustedTypes', {
      configurable: true,
      value: {
        createPolicy: createPolicySpy,
      },
    })

    initOpenReplay({
      projectKey: 'pk',
      enabled: true,
    })

    expect(createPolicySpy).toHaveBeenCalledTimes(1)
    expect(createScriptURLSpy).toHaveBeenCalledWith('blob:https://example.test/openreplay-worker')
    expect(workerCtor).toHaveBeenCalledWith(
      'trusted:blob:https://example.test/openreplay-worker',
      undefined,
    )

    logSpy.mockRestore()
  })

  it('keeps wrapping blob worker URLs created after tracker construction', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    const createScriptURLSpy = vi.fn((input: string) => `trusted:${input}`)
    const createPolicySpy = vi.fn(() => ({
      createHTML: (input: string) => input,
      createScriptURL: createScriptURLSpy,
    }))

    Object.defineProperty(window, 'trustedTypes', {
      configurable: true,
      value: {
        createPolicy: createPolicySpy,
      },
    })

    trackerCtor.mockImplementationOnce(() => trackerMock)
    trackerMock.start.mockImplementationOnce(() => {
      const workerUrl = createObjectURLMock(
        new Blob(['self.onmessage = () => {}'], { type: 'text/javascript' }),
      )
      new globalThis.Worker(workerUrl)
      return Promise.resolve({ sessionID: 'session-abc' })
    })

    initOpenReplay({
      projectKey: 'pk',
      enabled: true,
    })

    expect(createScriptURLSpy).toHaveBeenCalledWith('blob:https://example.test/openreplay-worker')
    expect(workerCtor).toHaveBeenCalledWith(
      'trusted:blob:https://example.test/openreplay-worker',
      undefined,
    )

    logSpy.mockRestore()
  })

  it('provides session helpers and event wrappers', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    initOpenReplay({
      projectKey: 'pk',
      enabled: true,
    })

    expect(getSessionId()).toBe('session-live')
    expect(getSessionUrl()).toBe('https://openreplay.example.com/session/session-live')

    setUser('u-1', { role: 'admin', env: 'dev' })
    expect(trackerMock.setUserID).toHaveBeenCalledWith('u-1')
    expect(trackerMock.setMetadata).toHaveBeenCalledWith('role', 'admin')
    expect(trackerMock.setMetadata).toHaveBeenCalledWith('env', 'dev')

    trackEvent('click', { a: 1 })
    expect(trackerMock.event).toHaveBeenCalledWith('click', { a: 1 })

    trackError(new Error('boom'), { traceId: 't-1' })
    expect(trackerMock.event).toHaveBeenCalledWith(
      'error',
      expect.objectContaining({ message: 'boom' }),
    )

    trackIssue('issue title', { traceId: 't-1' })
    expect(trackerMock.issue).toHaveBeenCalledWith('issue title', { traceId: 't-1' })

    logSpy.mockRestore()
  })

  it('falls back to sessionStorage and clears state on stop', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    initOpenReplay({ projectKey: 'pk', enabled: true })
    trackerMock.getSessionID.mockReturnValueOnce(null as never)
    sessionStorage.setItem('openreplay_session_id', 'session-from-storage')

    expect(getSessionId()).toBe('session-from-storage')

    stopOpenReplay()
    expect(trackerMock.stop).toHaveBeenCalledTimes(1)
    expect(getTracker()).toBeNull()
    expect(sessionStorage.getItem('openreplay_session_id')).toBeNull()

    logSpy.mockRestore()
  })
})
