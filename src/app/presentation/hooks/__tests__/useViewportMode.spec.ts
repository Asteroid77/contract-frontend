import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import { useViewportMode } from '@/app/presentation/hooks/useViewportMode'

const setViewportWidth = (width: number) => {
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    writable: true,
    value: width,
  })
  window.dispatchEvent(new Event('resize'))
}

const mountHook = () =>
  mount(
    defineComponent({
      setup() {
        const mode = useViewportMode()
        return () => h('div', { 'data-test': 'viewport-mode' }, mode.value)
      },
    }),
  )

describe('useViewportMode', () => {
  const addEventListenerSpy = vi.spyOn(window, 'addEventListener')
  const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')

  beforeEach(() => {
    vi.clearAllMocks()
    setViewportWidth(1366)
  })

  afterEach(() => {
    addEventListenerSpy.mockClear()
    removeEventListenerSpy.mockClear()
  })

  it('maps viewport widths to desktop, compact-desktop and mobile', async () => {
    const wrapper = mountHook()
    await nextTick()

    expect(wrapper.get('[data-test="viewport-mode"]').text()).toBe('desktop')

    setViewportWidth(1024)
    await nextTick()
    expect(wrapper.get('[data-test="viewport-mode"]').text()).toBe('compact-desktop')

    setViewportWidth(375)
    await nextTick()
    expect(wrapper.get('[data-test="viewport-mode"]').text()).toBe('mobile')
  })

  it('registers and cleans up resize listeners', () => {
    const wrapper = mountHook()

    expect(addEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function))

    wrapper.unmount()

    expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function))
  })
})
