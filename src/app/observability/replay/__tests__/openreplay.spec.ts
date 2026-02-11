import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { trackerMock, trackerCtor } = vi.hoisted(() => {
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

  const ctor = vi.fn(() => tracker)

  return {
    trackerMock: tracker,
    trackerCtor: ctor,
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
  beforeEach(() => {
    vi.clearAllMocks()
    sessionStorage.clear()
    stopOpenReplay()
  })

  afterEach(() => {
    stopOpenReplay()
    sessionStorage.clear()
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
    expect(trackerMock.event).toHaveBeenCalledWith('error', expect.objectContaining({ message: 'boom' }))

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
