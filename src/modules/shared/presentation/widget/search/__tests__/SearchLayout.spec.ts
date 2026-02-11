import { describe, expect, it } from 'vitest'
import { defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'

import SearchLayout from '@/modules/shared/presentation/widget/search/SearchLayout.vue'

describe('SearchLayout', () => {
  it('renders search form container', () => {
    const wrapper = mount(SearchLayout, {
      global: {
        components: {
          'n-form': defineComponent({
            name: 'NForm',
            setup(_, { slots }) {
              return () => h('form', { 'data-test': 'n-form' }, slots.default?.())
            },
          }),
        },
      },
    })

    expect(wrapper.find('[data-test="n-form"]').exists()).toBe(true)
  })
})
