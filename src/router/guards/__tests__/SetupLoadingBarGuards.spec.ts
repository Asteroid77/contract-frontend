import { describe, expect, it, vi } from 'vitest'
import { setupLoadingBarGuards } from '@/router/guards/SetupLoadingBarGuards'

const { loadingBarStartSpy, loadingBarFinishSpy, loadingBarErrorSpy, notificationErrorSpy } =
  vi.hoisted(() => ({
    loadingBarStartSpy: vi.fn(),
    loadingBarFinishSpy: vi.fn(),
    loadingBarErrorSpy: vi.fn(),
    notificationErrorSpy: vi.fn(),
  }))

vi.mock('@/_utils/discrete_naive_api', () => ({
  loadingBar: {
    start: loadingBarStartSpy,
    finish: loadingBarFinishSpy,
    error: loadingBarErrorSpy,
  },
  notification: {
    error: notificationErrorSpy,
  },
}))

describe('setupLoadingBarGuards', () => {
  it('registers beforeEach, afterEach and onError handlers', () => {
    const beforeEach = vi.fn()
    const afterEach = vi.fn()
    const onError = vi.fn()

    const router = {
      beforeEach,
      afterEach,
      onError,
    } as unknown as Parameters<typeof setupLoadingBarGuards>[0]

    setupLoadingBarGuards(router)

    expect(beforeEach).toHaveBeenCalledTimes(1)
    expect(afterEach).toHaveBeenCalledTimes(1)
    expect(onError).toHaveBeenCalledTimes(1)
  })

  it('starts loading bar in beforeEach and calls next', async () => {
    const beforeEach = vi.fn()
    const router = {
      beforeEach,
      afterEach: vi.fn(),
      onError: vi.fn(),
    } as unknown as Parameters<typeof setupLoadingBarGuards>[0]

    setupLoadingBarGuards(router)
    const guard = beforeEach.mock.calls[0][0] as (
      to: unknown,
      from: unknown,
      next: () => void,
    ) => Promise<void>

    const next = vi.fn()
    await guard({}, {}, next)

    expect(loadingBarStartSpy).toHaveBeenCalledTimes(1)
    expect(next).toHaveBeenCalledTimes(1)
  })

  it('finishes loading bar in afterEach', () => {
    const afterEach = vi.fn()
    const router = {
      beforeEach: vi.fn(),
      afterEach,
      onError: vi.fn(),
    } as unknown as Parameters<typeof setupLoadingBarGuards>[0]

    setupLoadingBarGuards(router)
    const hook = afterEach.mock.calls[0][0] as () => void

    hook()

    expect(loadingBarFinishSpy).toHaveBeenCalledTimes(1)
  })

  it('reports loading error and shows notification on router error', () => {
    const onError = vi.fn()
    const router = {
      beforeEach: vi.fn(),
      afterEach: vi.fn(),
      onError,
    } as unknown as Parameters<typeof setupLoadingBarGuards>[0]

    setupLoadingBarGuards(router)
    const hook = onError.mock.calls[0][0] as (error: Error) => void

    hook(new Error('network failed'))

    expect(loadingBarErrorSpy).toHaveBeenCalledTimes(1)
    expect(notificationErrorSpy).toHaveBeenCalledWith({
      title: 'network failed',
      duration: 2500,
    })
  })
})
