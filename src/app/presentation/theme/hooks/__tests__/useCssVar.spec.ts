import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import { useCssVar } from '@/app/presentation/theme/hooks/useCssVar'

const mountHook = (varName: string, parser?: 'int' | 'float' | 'string') => {
  return mount(
    defineComponent({
      setup() {
        const value =
          parser === undefined
            ? useCssVar(varName)
            : parser === 'string'
              ? useCssVar(varName, 'string')
              : useCssVar(varName, parser)
        return () => h('div', { 'data-test': 'value' }, String(value.value))
      },
    }),
  )
}

describe('useCssVar', () => {
  const getComputedStyleSpy = vi.spyOn(window, 'getComputedStyle')

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    getComputedStyleSpy.mockReset()
  })

  it('parses int css var', async () => {
    getComputedStyleSpy.mockReturnValue({
      getPropertyValue: (name: string) => (name === '--int-var' ? ' 42 ' : ''),
    } as unknown as CSSStyleDeclaration)

    const wrapper = mountHook('--int-var', 'int')
    await nextTick()

    expect(wrapper.text()).toBe('42')
  })

  it('parses float css var', async () => {
    getComputedStyleSpy.mockReturnValue({
      getPropertyValue: (name: string) => (name === '--float-var' ? ' 3.14 ' : ''),
    } as unknown as CSSStyleDeclaration)

    const wrapper = mountHook('--float-var', 'float')
    await nextTick()

    expect(wrapper.text()).toBe('3.14')
  })

  it('returns trimmed string value by default', async () => {
    getComputedStyleSpy.mockReturnValue({
      getPropertyValue: (name: string) => (name === '--string-var' ? '  #334155  ' : ''),
    } as unknown as CSSStyleDeclaration)

    const wrapper = mountHook('--string-var')
    await nextTick()

    expect(wrapper.text()).toBe('#334155')
  })

  it('keeps null when css var is absent', async () => {
    getComputedStyleSpy.mockReturnValue({
      getPropertyValue: () => '',
    } as unknown as CSSStyleDeclaration)

    const wrapper = mountHook('--missing-var', 'string')
    await nextTick()

    expect(wrapper.text()).toBe('null')
  })
})
