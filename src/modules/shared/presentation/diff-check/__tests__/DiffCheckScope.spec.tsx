import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import DiffCheckScope from '@/modules/shared/presentation/diff-check/DiffCheckScope'

describe('DiffCheckScope', () => {
  it('renders wrapper class and default slot content', () => {
    const wrapper = mount(DiffCheckScope, {
      slots: {
        default: '<div data-test="inner-content">内容区</div>',
      },
    })

    expect(wrapper.find('.diff-check-scope').exists()).toBe(true)
    expect(wrapper.find('[data-test="inner-content"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('内容区')
  })

  it('renders empty wrapper when default slot is absent', () => {
    const wrapper = mount(DiffCheckScope)

    expect(wrapper.find('.diff-check-scope').exists()).toBe(true)
    expect(wrapper.text()).toBe('')
  })
})
