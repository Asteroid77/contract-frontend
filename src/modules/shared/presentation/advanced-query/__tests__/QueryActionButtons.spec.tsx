import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'

vi.mock('@/_utils/i18n', () => ({
  $t: (key: string) => key,
}))

vi.mock('@/modules/shared/presentation/advanced-query/modern/ButtonLike', () => ({
  default: defineComponent({
    name: 'ButtonLike',
    props: {
      size: {
        type: String,
        required: false,
      },
      type: {
        type: String,
        required: false,
      },
      loading: {
        type: Boolean,
        required: false,
      },
      secondary: {
        type: Boolean,
        required: false,
      },
      onClick: {
        type: Function,
        required: false,
      },
    },
    setup(props, { slots }) {
      return () =>
        h(
          'button',
          {
            onClick: props.onClick,
            'data-size': props.size ?? '',
            'data-type': props.type ?? '',
            'data-loading': String(Boolean(props.loading)),
            'data-secondary': String(Boolean(props.secondary)),
          },
          slots.default?.(),
        )
    },
  }),
}))

import QueryActionButtons from '@/modules/shared/presentation/advanced-query/QueryActionButtons'

describe('QueryActionButtons', () => {
  it('renders search and reset buttons with tiny size by default', () => {
    const wrapper = mount(QueryActionButtons)
    const buttons = wrapper.findAll('button')

    expect(buttons).toHaveLength(2)
    expect(buttons[0].text()).toBe('common.action.search')
    expect(buttons[1].text()).toBe('common.action.reset')
    expect(buttons[0].attributes('data-size')).toBe('tiny')
    expect(buttons[1].attributes('data-size')).toBe('tiny')
  })

  it('emits search and reset events from button clicks', async () => {
    const wrapper = mount(QueryActionButtons, {
      props: {
        searchLoading: true,
      },
    })
    const buttons = wrapper.findAll('button')

    await buttons[0].trigger('click')
    await buttons[1].trigger('click')

    expect(buttons[0].attributes('data-loading')).toBe('true')
    expect(buttons[1].attributes('data-secondary')).toBe('true')
    expect(wrapper.emitted('search')).toHaveLength(1)
    expect(wrapper.emitted('reset')).toHaveLength(1)
  })
})
