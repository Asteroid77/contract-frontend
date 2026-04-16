import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import {
  resolveResponsiveTableMode,
  useResponsiveTableMode,
} from '@/modules/shared/presentation/table/useResponsiveTableMode'

class ResizeObserverMock {
  static callback: ResizeObserverCallback | null = null
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()

  constructor(callback: ResizeObserverCallback) {
    ResizeObserverMock.callback = callback
  }
}

const triggerResize = (width: number) => {
  ResizeObserverMock.callback?.(
    [
      {
        contentRect: {
          width,
        },
      } as ResizeObserverEntry,
    ],
    {} as ResizeObserver,
  )
}

describe('useResponsiveTableMode', () => {
  beforeEach(() => {
    vi.stubGlobal('ResizeObserver', ResizeObserverMock)
  })

  it('maps widths into wide, compact and stacked buckets', () => {
    expect(resolveResponsiveTableMode(960)).toBe('wide')
    expect(resolveResponsiveTableMode(760)).toBe('compact')
    expect(resolveResponsiveTableMode(520)).toBe('stacked')
  })

  it('updates mode from observed container width', async () => {
    const wrapper = mount(
      defineComponent({
        setup() {
          const { containerRef, mode } = useResponsiveTableMode()
          return () =>
            h('div', [
              h('div', { ref: containerRef, 'data-test': 'table-shell' }),
              h('span', { 'data-test': 'table-mode' }, mode.value),
            ])
        },
      }),
    )

    await nextTick()
    triggerResize(720)
    await nextTick()
    expect(wrapper.get('[data-test="table-mode"]').text()).toBe('compact')

    triggerResize(560)
    await nextTick()
    expect(wrapper.get('[data-test="table-mode"]').text()).toBe('stacked')
  })
})
