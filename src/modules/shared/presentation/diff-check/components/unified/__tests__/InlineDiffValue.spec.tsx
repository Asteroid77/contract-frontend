import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import InlineDiffValue from '@/modules/shared/presentation/diff-check/components/unified/InlineDiffValue'

vi.mock('@/_utils/i18n', () => ({
  $t: (key: string, params?: Record<string, unknown>) => {
    if (params && 'count' in params) {
      return `t:${key}:${String(params.count)}`
    }
    return `t:${key}`
  },
}))

describe('InlineDiffValue', () => {
  it('renders empty placeholder when unchanged and newValue is empty', () => {
    const wrapper = mount(InlineDiffValue, {
      props: {
        oldValue: 'old',
        newValue: '',
        diffType: 'unchanged',
      },
    })

    expect(wrapper.find('.field-empty').exists()).toBe(true)
    expect(wrapper.text()).toContain('t:common.label.empty')
  })

  it('renders boolean text when unchanged with boolean value', () => {
    const wrapper = mount(InlineDiffValue, {
      props: {
        oldValue: false,
        newValue: true,
        diffType: 'unchanged',
      },
    })

    expect(wrapper.text()).toContain('t:common.label.yes')
  })

  it('renders added style and array summary when diffType is added', () => {
    const wrapper = mount(InlineDiffValue, {
      props: {
        oldValue: null,
        newValue: [{ id: 1 }, { id: 2 }, { id: 3 }] as never,
        diffType: 'added',
      },
    })

    expect(wrapper.find('.diff-inline--added').exists()).toBe(true)
    expect(wrapper.text()).toContain('t:common.label.totalItems:3')
  })

  it('renders removed style when diffType is removed', () => {
    const wrapper = mount(InlineDiffValue, {
      props: {
        oldValue: '旧值',
        newValue: null,
        diffType: 'removed',
      },
    })

    expect(wrapper.find('.diff-inline--removed').exists()).toBe(true)
    expect(wrapper.text()).toContain('旧值')
  })

  it('renders modified old/new and arrow when showOldValue is true', () => {
    const wrapper = mount(InlineDiffValue, {
      props: {
        oldValue: '旧值',
        newValue: '新值',
        diffType: 'modified',
        showOldValue: true,
      },
    })

    expect(wrapper.find('.diff-inline-group').exists()).toBe(true)
    expect(wrapper.find('.diff-inline--old').exists()).toBe(true)
    expect(wrapper.find('.diff-arrow').exists()).toBe(true)
    expect(wrapper.find('.diff-inline--new').exists()).toBe(true)
    expect(wrapper.text()).toContain('旧值')
    expect(wrapper.text()).toContain('新值')
  })

  it('renders only new value when modified and showOldValue is false', () => {
    const wrapper = mount(InlineDiffValue, {
      props: {
        oldValue: '旧值',
        newValue: '新值',
        diffType: 'modified',
        showOldValue: false,
      },
    })

    expect(wrapper.find('.diff-inline--old').exists()).toBe(false)
    expect(wrapper.find('.diff-arrow').exists()).toBe(false)
    expect(wrapper.find('.diff-inline--new').exists()).toBe(true)
    expect(wrapper.text()).toContain('新值')
  })

  it('renders nothing for unsupported diff type', () => {
    const wrapper = mount(InlineDiffValue, {
      props: {
        oldValue: '旧值',
        newValue: '新值',
        diffType: 'unknown' as never,
      },
    })

    expect(wrapper.text()).toBe('')
    expect(wrapper.find('.diff-inline-group').exists()).toBe(false)
  })
})
