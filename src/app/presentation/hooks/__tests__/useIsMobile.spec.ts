import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import { useIsMobile } from '@/app/presentation/hooks/useIsMobile'

const setViewportWidth = (width: number) => {
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    writable: true,
    value: width,
  })
  window.dispatchEvent(new Event('resize'))
}

const mountHook = (breakpoint = 768) => {
  return mount(
    defineComponent({
      setup() {
        const isMobile = useIsMobile(breakpoint)
        return () => h('div', { 'data-test': 'mobile' }, String(isMobile.value))
      },
    }),
  )
}

describe('useIsMobile', () => {
  const addEventListenerSpy = vi.spyOn(window, 'addEventListener')
  const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')

  beforeEach(() => {
    vi.clearAllMocks()
    setViewportWidth(1280)
  })

  afterEach(() => {
    addEventListenerSpy.mockClear()
    removeEventListenerSpy.mockClear()
  })

  it('returns false above breakpoint', async () => {
    const wrapper = mountHook(768)
    await nextTick()

    expect(wrapper.get('[data-test="mobile"]').text()).toBe('false')
  })

  it('returns true below breakpoint and reacts to resize', async () => {
    setViewportWidth(375)
    const wrapper = mountHook(768)
    await nextTick()

    expect(wrapper.get('[data-test="mobile"]').text()).toBe('true')

    setViewportWidth(1024)
    await nextTick()

    expect(wrapper.get('[data-test="mobile"]').text()).toBe('false')
  })

  it('registers and cleans up resize listener', () => {
    const wrapper = mountHook(768)

    expect(addEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function))

    wrapper.unmount()

    expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function))
  })
})
