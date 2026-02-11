import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { App } from 'vue'
import { setupVueErrorHandler } from '@/app/observability/collectors/vue-error-collector'
import { captureVueError } from '@/app/observability/collectors/error-collector'

vi.mock('@/app/observability/collectors/error-collector', () => ({
  captureVueError: vi.fn(),
}))

describe('setupVueErrorHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('captures vue errors and delegates to original errorHandler', () => {
    const originalHandler = vi.fn()
    const app = {
      config: {
        errorHandler: originalHandler,
      },
    } as unknown as App

    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    setupVueErrorHandler(app)

    const err = new Error('component failed')
    app.config.errorHandler?.(err, { $options: { name: 'TestComp' } } as never, 'mounted')

    expect(captureVueError).toHaveBeenCalledWith(
      err,
      expect.objectContaining({ $options: { name: 'TestComp' } }),
      'mounted',
    )
    expect(originalHandler).toHaveBeenCalledWith(
      err,
      expect.objectContaining({ $options: { name: 'TestComp' } }),
      'mounted',
    )

    logSpy.mockRestore()
    errorSpy.mockRestore()
  })

  it('converts non-Error values before capturing', () => {
    const app = {
      config: {},
    } as unknown as App

    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    setupVueErrorHandler(app)

    app.config.errorHandler?.('string-error' as never, null, 'render')

    expect(captureVueError).toHaveBeenCalledTimes(1)
    const [firstArg, secondArg, thirdArg] = vi.mocked(captureVueError).mock.calls[0]
    expect(firstArg).toBeInstanceOf(Error)
    expect((firstArg as Error).message).toBe('string-error')
    expect(secondArg).toBeNull()
    expect(thirdArg).toBe('render')

    logSpy.mockRestore()
    errorSpy.mockRestore()
  })
})
