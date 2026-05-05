import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'
import WorkOrderDetailActions from '@/modules/work-order/presentation/WorkOrderDetailActions'

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}))

vi.mock('naive-ui', () => ({
  NSpace: defineComponent({
    name: 'NSpace',
    setup(_, { slots }) {
      return () => h('div', { 'data-test': 'n-space' }, slots.default?.())
    },
  }),
  NInput: defineComponent({
    name: 'NInput',
    inheritAttrs: false,
    props: {
      value: {
        type: String,
        default: '',
      },
      placeholder: {
        type: String,
        default: '',
      },
    },
    emits: ['update:value'],
    setup(props, { emit }) {
      return () =>
        h('input', {
          'data-test': 'reject-remark',
          value: props.value,
          placeholder: props.placeholder,
          onInput: (event: Event) => {
            emit('update:value', (event.target as HTMLInputElement).value)
          },
        })
    },
  }),
  NButton: defineComponent({
    name: 'NButton',
    props: {
      loading: {
        type: Boolean,
        default: false,
      },
    },
    emits: ['click'],
    setup(props, { emit, slots }) {
      return () =>
        h(
          'button',
          {
            'data-test': `action-${String(slots.default?.()[0]?.children)}`,
            'data-loading': String(props.loading),
            onClick: () => emit('click'),
          },
          slots.default?.(),
        )
    },
  }),
  NPopconfirm: defineComponent({
    name: 'NPopconfirm',
    emits: ['positive-click'],
    setup(_, { emit, slots }) {
      const resolveConfirmTestId = () => {
        const defaultSlot = slots.default?.()
        const firstChild = defaultSlot?.[0]?.children
        return typeof firstChild === 'string' ? firstChild : 'custom'
      }

      return () =>
        h('div', { 'data-test': 'popconfirm' }, [
          slots.trigger?.(),
          h(
            'button',
            {
              'data-test': `confirm-${resolveConfirmTestId()}`,
              onClick: () => emit('positive-click'),
            },
            slots.default?.(),
          ),
        ])
    },
  }),
}))

describe('WorkOrderDetailActions', () => {
  it('renders enabled actions and emits command events', async () => {
    const wrapper = mount(WorkOrderDetailActions, {
      props: {
        canClaim: true,
        canRelease: true,
        canComplete: true,
        canReopen: true,
        canReject: true,
        claimLoading: true,
        releaseLoading: false,
        rejectRemark: '',
      },
    })

    expect(
      wrapper.get('[data-test="action-domain.workOrder.action.claim"]').attributes(),
    ).toMatchObject({
      'data-loading': 'true',
    })
    expect(wrapper.find('[data-test="action-domain.workOrder.action.release"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="action-domain.workOrder.action.complete"]').exists()).toBe(
      true,
    )
    expect(wrapper.find('[data-test="action-domain.workOrder.action.reopen"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="action-domain.workOrder.action.reject"]').exists()).toBe(true)

    await wrapper
      .get('[data-test="confirm-domain.workOrder.message.claimConfirm"]')
      .trigger('click')
    await wrapper
      .get('[data-test="confirm-domain.workOrder.message.releaseConfirm"]')
      .trigger('click')
    await wrapper
      .get('[data-test="confirm-domain.workOrder.message.completeConfirm"]')
      .trigger('click')
    await wrapper
      .get('[data-test="confirm-domain.workOrder.message.reopenConfirm"]')
      .trigger('click')
    await wrapper.get('[data-test="confirm-custom"]').trigger('click')

    expect(wrapper.emitted('claim')).toHaveLength(1)
    expect(wrapper.emitted('release')).toHaveLength(1)
    expect(wrapper.emitted('complete')).toHaveLength(1)
    expect(wrapper.emitted('reopen')).toHaveLength(1)
    expect(wrapper.emitted('reject')).toHaveLength(1)
  })

  it('emits reject remark updates and hides disabled actions', async () => {
    const wrapper = mount(WorkOrderDetailActions, {
      props: {
        canClaim: false,
        canRelease: false,
        canComplete: false,
        canReopen: false,
        canReject: true,
        rejectRemark: '旧备注',
      },
    })

    expect(wrapper.find('[data-test="action-domain.workOrder.action.claim"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="action-domain.workOrder.action.release"]').exists()).toBe(
      false,
    )
    expect(wrapper.find('[data-test="action-domain.workOrder.action.complete"]').exists()).toBe(
      false,
    )
    expect(wrapper.find('[data-test="action-domain.workOrder.action.reopen"]').exists()).toBe(false)

    await wrapper.get('[data-test="reject-remark"]').setValue('新备注')

    expect(wrapper.emitted('update:rejectRemark')).toEqual([['新备注']])
  })
})
