import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import { mount } from '@vue/test-utils'

const { mutateSpy, assignedUsersRefHolder } = vi.hoisted(() => ({
  mutateSpy: vi.fn(),
  assignedUsersRefHolder: {
    value: null as any,
  },
}))

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}))

vi.mock('@/modules/user/application/hooks/useUserPage', () => ({
  useUserPage: () => ({
    data: {
      value: {
        records: [
          { id: 1, name: 'Alice', discriminator: 'A' },
          { id: 2, name: 'Bob', discriminator: 'B' },
        ],
      },
    },
  }),
}))

vi.mock('@/modules/access/application/hooks/useUserRoleService', () => ({
  useAssignedUsersByRole: () => ({
    data: assignedUsersRefHolder.value,
  }),
  useAssignRoleToUsers: () => ({
    mutate: mutateSpy,
  }),
}))

vi.mock('naive-ui', () => ({
  NCard: defineComponent({
    name: 'NCard',
    props: {
      title: {
        type: String,
        required: false,
      },
    },
    setup(props, { slots }) {
      return () =>
        h('div', { 'data-test': 'n-card', 'data-title': props.title ?? '' }, [
          slots.default?.(),
          slots.action?.(),
        ])
    },
  }),
  NSpace: defineComponent({
    name: 'NSpace',
    setup(_, { slots }) {
      return () => h('div', { 'data-test': 'n-space' }, slots.default?.())
    },
  }),
  NButton: defineComponent({
    name: 'NButton',
    emits: ['click'],
    setup(_, { emit, slots }) {
      return () =>
        h('button', { 'data-test': 'n-button', onClick: () => emit('click') }, slots.default?.())
    },
  }),
  NPopconfirm: defineComponent({
    name: 'NPopconfirm',
    emits: ['positive-click'],
    setup(_, { emit, slots }) {
      return () =>
        h('div', { 'data-test': 'n-popconfirm' }, [
          slots.trigger?.(),
          h(
            'button',
            { 'data-test': 'n-popconfirm-positive', onClick: () => emit('positive-click') },
            'positive',
          ),
        ])
    },
  }),
  NTransfer: defineComponent({
    name: 'NTransfer',
    props: {
      value: {
        type: Array,
        required: false,
      },
      options: {
        type: Array,
        required: false,
      },
    },
    emits: ['update:value'],
    setup(props, { emit }) {
      return () =>
        h('button', {
          'data-test': 'n-transfer',
          'data-value': JSON.stringify(props.value ?? []),
          'data-options-len': String((props.options || []).length),
          onClick: () => emit('update:value', [1]),
        })
    },
  }),
}))

import RoleAssign from '@/modules/access/presentation/role/RoleAssign.vue'

describe('RoleAssign', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    assignedUsersRefHolder.value = ref<Array<{ id: number }> | undefined>(undefined)
  })

  it('syncs assigned users and submits selected ids', async () => {
    const wrapper = mount(RoleAssign, {
      props: {
        roleId: 5,
      },
    })

    const transfer = wrapper.get('[data-test="n-transfer"]')
    expect(transfer.attributes('data-options-len')).toBe('2')
    expect(transfer.attributes('data-value')).toBe('[]')

    assignedUsersRefHolder.value.value = [{ id: 2 }]
    await nextTick()

    expect(wrapper.get('[data-test="n-transfer"]').attributes('data-value')).toBe('[2]')

    await wrapper.get('[data-test="n-popconfirm-positive"]').trigger('click')
    expect(mutateSpy).toHaveBeenCalledWith({ roleId: 5, userIds: [2] })

    await wrapper.get('[data-test="n-transfer"]').trigger('click')
    await wrapper.get('[data-test="n-popconfirm-positive"]').trigger('click')
    expect(mutateSpy).toHaveBeenLastCalledWith({ roleId: 5, userIds: [1] })
  })
})
