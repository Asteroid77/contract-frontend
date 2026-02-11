import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'

const { routerGoSpy } = vi.hoisted(() => ({
  routerGoSpy: vi.fn(),
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({
    go: routerGoSpy,
  }),
}))

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}))

vi.mock('naive-ui', () => ({
  NResult: defineComponent({
    name: 'NResult',
    props: {
      status: {
        type: String,
        required: false,
      },
      title: {
        type: String,
        required: false,
      },
      description: {
        type: String,
        required: false,
      },
    },
    setup(props, { slots }) {
      return () =>
        h('div', {
          'data-test': 'n-result',
          'data-status': props.status ?? '',
          'data-title': props.title ?? '',
          'data-description': props.description ?? '',
        }, slots.footer?.())
    },
  }),
  NButton: defineComponent({
    name: 'NButton',
    emits: ['click'],
    setup(_, { emit, slots }) {
      return () =>
        h(
          'button',
          {
            'data-test': 'n-button',
            onClick: () => emit('click'),
          },
          slots.default?.(),
        )
    },
  }),
}))

import SuccessResult from '@/modules/approval/presentation/approval/SuccessResult.vue'

describe('SuccessResult', () => {
  it('renders success result and goes back on footer button click', async () => {
    const wrapper = mount(SuccessResult)

    const result = wrapper.get('[data-test="n-result"]')
    expect(result.attributes('data-status')).toBe('success')
    expect(result.attributes('data-title')).toBe('common.status.success')
    expect(result.attributes('data-description')).toBe('domain.approval.message.approveSuccess')

    const button = wrapper.get('[data-test="n-button"]')
    expect(button.text()).toBe('common.action.back')

    await button.trigger('click')
    expect(routerGoSpy).toHaveBeenCalledWith(-1)
  })
})
