import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { DiffRenderer } from '@/modules/approval/presentation/print/DiffRenderer'

describe('DiffRenderer', () => {
  it('renders plain text when oldValue is missing', () => {
    const wrapper = mount(DiffRenderer, {
      props: {
        newValue: '最新值',
        // oldValue omitted to simulate missing value,
      },
    })

    expect(wrapper.find('.diff-container').exists()).toBe(false)
    expect(wrapper.text()).toBe('最新值')
  })

  it('renders fallback dash when newValue is null and oldValue is missing', () => {
    const wrapper = mount(DiffRenderer, {
      props: {
        // newValue omitted to simulate empty display,
        oldValue: undefined,
      },
    })

    expect(wrapper.find('.diff-container').exists()).toBe(false)
    expect(wrapper.text()).toBe('-')
  })

  it('treats string-equivalent values as unchanged', () => {
    const wrapper = mount(DiffRenderer, {
      props: {
        newValue: 123,
        oldValue: '123',
      },
    })

    expect(wrapper.find('.diff-container').exists()).toBe(false)
    expect(wrapper.text()).toBe('123')
  })

  it('renders diff structure when value changed and showOld is true', () => {
    const wrapper = mount(DiffRenderer, {
      props: {
        newValue: '新值',
        oldValue: '旧值',
        showOld: true,
      },
    })

    expect(wrapper.find('.diff-container').exists()).toBe(true)
    expect(wrapper.find('.diff-new').text()).toBe('新值')
    expect(wrapper.find('.diff-old').text()).toContain('旧值')
    expect(wrapper.find('.diff-old').text()).toContain('(')
  })

  it('hides old value block when showOld is false', () => {
    const wrapper = mount(DiffRenderer, {
      props: {
        newValue: '新值',
        oldValue: '旧值',
        showOld: false,
      },
    })

    expect(wrapper.find('.diff-container').exists()).toBe(true)
    expect(wrapper.find('.diff-new').text()).toBe('新值')
    expect(wrapper.find('.diff-old').exists()).toBe(false)
  })
})
