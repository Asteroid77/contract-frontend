import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import ErrorBoundary from '@/app/observability/components/ErrorBoundary'
import { captureVueError } from '@/app/observability/collectors/error-collector'
import type { FallbackSlotScope } from '@/app/observability/components/types'

vi.mock('@/_utils/i18n', () => ({
  $t: (key: string) => `t:${key}`,
}))

vi.mock('@/app/observability/collectors/error-collector', () => ({
  captureVueError: vi.fn(),
}))

describe('ErrorBoundary', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders default slot content when no error occurs', () => {
    const wrapper = mount(ErrorBoundary, {
      slots: {
        default: () => h('div', { 'data-test': 'normal-content' }, 'normal-ok'),
      },
    })

    expect(wrapper.find('[data-test="normal-content"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('normal-ok')
    expect(wrapper.find('.error-boundary').exists()).toBe(false)
  })

  it('captures child error, emits error, and renders default error UI', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const ThrowAlways = defineComponent({
      name: 'ThrowAlways',
      setup() {
        return () => {
          throw new Error('boundary-crash')
        }
      },
    })

    const wrapper = mount(ErrorBoundary, {
      slots: {
        default: () => h(ThrowAlways),
      },
    })

    await nextTick()

    expect(captureVueError).toHaveBeenCalledTimes(1)
    expect(captureVueError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.anything(),
      expect.any(String),
    )

    const emitted = wrapper.emitted('error')
    expect(emitted).toBeTruthy()
    expect(emitted?.length).toBe(1)
    expect((emitted?.[0]?.[0] as Error).message).toBe('boundary-crash')

    expect(wrapper.find('.error-boundary').exists()).toBe(true)
    expect(wrapper.text()).toContain('boundary-crash')
    expect(wrapper.text()).toContain('t:observability.errorBoundary.sections.actions')

    consoleErrorSpy.mockRestore()
  })

  it('uses fallback slot when provided and supports reset callback', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    let hasThrown = false
    const ThrowOnce = defineComponent({
      name: 'ThrowOnce',
      setup() {
        return () => {
          if (!hasThrown) {
            hasThrown = true
            throw new Error('throw-once')
          }
          return h('div', { 'data-test': 'recovered-content' }, 'recovered-ok')
        }
      },
    })

    const wrapper = mount(ErrorBoundary, {
      slots: {
        default: () => h(ThrowOnce),
        fallback: ({ error, reset }: FallbackSlotScope) =>
          h('button', { 'data-test': 'fallback-reset', onClick: reset }, `fallback-${error.message}`),
      },
    })

    await nextTick()

    const fallbackBtn = wrapper.find('[data-test="fallback-reset"]')
    expect(fallbackBtn.exists()).toBe(true)
    expect(fallbackBtn.text()).toContain('fallback-throw-once')

    await fallbackBtn.trigger('click')
    await nextTick()

    expect(wrapper.emitted('reset')).toBeTruthy()
    expect(wrapper.find('[data-test="recovered-content"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('recovered-ok')

    consoleErrorSpy.mockRestore()
  })
})
