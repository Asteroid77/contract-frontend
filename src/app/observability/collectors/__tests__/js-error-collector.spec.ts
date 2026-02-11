import { beforeEach, describe, expect, it, vi } from 'vitest'
import { jsErrorCollector } from '@/app/observability/collectors/js-error-collector'

vi.mock('@/app/observability/collectors/error-collector', () => ({
  captureError: vi.fn(),
}))

describe('jsErrorCollector', () => {
  beforeEach(() => {
    jsErrorCollector.destroy()
    vi.clearAllMocks()
  })

  it('registers global listeners only once', () => {
    const addSpy = vi.spyOn(window, 'addEventListener')

    jsErrorCollector.init()
    jsErrorCollector.init()

    expect(addSpy).toHaveBeenCalledTimes(3)
    expect(addSpy).toHaveBeenCalledWith('error', expect.any(Function))
    expect(addSpy).toHaveBeenCalledWith('unhandledrejection', expect.any(Function))
    expect(addSpy).toHaveBeenCalledWith('error', expect.any(Function), true)

    addSpy.mockRestore()
  })

  it('removes listeners on destroy', () => {
    const removeSpy = vi.spyOn(window, 'removeEventListener')

    jsErrorCollector.init()
    jsErrorCollector.destroy()

    expect(removeSpy).toHaveBeenCalledTimes(3)
    expect(removeSpy).toHaveBeenCalledWith('error', expect.any(Function))
    expect(removeSpy).toHaveBeenCalledWith('unhandledrejection', expect.any(Function))
    expect(removeSpy).toHaveBeenCalledWith('error', expect.any(Function), true)

    removeSpy.mockRestore()
  })
})
