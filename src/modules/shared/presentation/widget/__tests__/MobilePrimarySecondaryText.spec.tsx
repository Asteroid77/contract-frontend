import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import MobilePrimarySecondaryText from '@/modules/shared/presentation/widget/MobilePrimarySecondaryText'

describe('MobilePrimarySecondaryText', () => {
  it('renders primary text and at most two secondary lines by default', () => {
    const wrapper = mount(MobilePrimarySecondaryText, {
      props: {
        primary: 'Primary',
        secondary: ['Secondary 1', 'Secondary 2', 'Secondary 3'],
      },
    })

    expect(wrapper.get('[data-test="mobile-primary-secondary-primary"]').text()).toBe('Primary')

    const secondaryLines = wrapper.findAll('[data-test="mobile-primary-secondary-secondary"]')
    expect(secondaryLines).toHaveLength(2)
    expect(secondaryLines[0].text()).toBe('Secondary 1')
    expect(secondaryLines[1].text()).toBe('Secondary 2')
  })

  it('filters empty secondary values and respects maxSecondary', () => {
    const wrapper = mount(MobilePrimarySecondaryText, {
      props: {
        primary: 'Primary',
        secondary: ['Secondary 1', '', undefined, 'Secondary 2', 'Secondary 3'],
        maxSecondary: 1,
      },
    })

    const secondaryLines = wrapper.findAll('[data-test="mobile-primary-secondary-secondary"]')
    expect(secondaryLines).toHaveLength(1)
    expect(secondaryLines[0].text()).toBe('Secondary 1')
  })
})
