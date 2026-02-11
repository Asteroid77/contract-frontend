import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'

const { routerPushSpy } = vi.hoisted(() => ({
  routerPushSpy: vi.fn(),
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: routerPushSpy,
  }),
}))

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}))

vi.mock('@/modules/access/application/hooks/useRoleService', () => ({
  useRolePage: () => ({
    data: {
      value: {
        records: [
          {
            id: 9,
            name: 'admin',
            description: '管理员',
          },
        ],
      },
    },
    isLoading: false,
  }),
}))

vi.mock('@/modules/access/presentation/role/RoleAssign.vue', () => ({
  default: defineComponent({
    name: 'RoleAssign',
    props: {
      roleId: {
        type: Number,
        required: true,
      },
    },
    setup(props) {
      return () => h('div', { 'data-test': 'role-assign', 'data-role-id': String(props.roleId) })
    },
  }),
}))

vi.mock('naive-ui', () => ({
  NButton: defineComponent({
    name: 'NButton',
    emits: ['click'],
    setup(_, { emit, slots }) {
      return () => h('button', { 'data-test': 'n-button', onClick: () => emit('click') }, slots.default?.())
    },
  }),
  NSpace: defineComponent({
    name: 'NSpace',
    setup(_, { slots }) {
      return () => h('div', { 'data-test': 'n-space' }, slots.default?.())
    },
  }),
  NDataTable: defineComponent({
    name: 'NDataTable',
    props: {
      columns: {
        type: Array,
        required: false,
      },
      data: {
        type: Array,
        required: false,
      },
      loading: {
        type: Boolean,
        required: false,
      },
    },
    setup(props) {
      return () => {
        const rows = (props.data || []) as Array<Record<string, unknown>>
        const columns = (props.columns || []) as Array<Record<string, any>>
        const operate = columns.find((item) => item.key === 'operate')

        return h(
          'div',
          {
            'data-test': 'n-data-table',
            'data-loading': String(Boolean(props.loading)),
          },
          rows.map((row) =>
            h('div', { 'data-test': 'n-data-row' }, [
              h('span', { 'data-test': 'role-name' }, String(row.name ?? '')),
              operate?.render ? h('div', { 'data-test': 'operate-cell' }, [operate.render(row) as never]) : null,
            ]),
          ),
        )
      }
    },
  }),
  NDrawer: defineComponent({
    name: 'NDrawer',
    props: {
      show: {
        type: Boolean,
        required: false,
      },
    },
    setup(props, { slots }) {
      return () => h('div', { 'data-test': 'n-drawer', 'data-show': String(Boolean(props.show)) }, slots.default?.())
    },
  }),
}))

import RolePage from '@/modules/access/presentation/role/RolePage.vue'

describe('RolePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('handles edit navigation and opens assign drawer with role id', async () => {
    const wrapper = mount(RolePage)

    expect(wrapper.get('[data-test="role-name"]').text()).toBe('admin')
    expect(wrapper.get('[data-test="n-drawer"]').attributes('data-show')).toBe('false')

    const editBtn = wrapper
      .findAll('[data-test="n-button"]')
      .find((node) => node.text().includes('common.action.edit'))
    const assignBtn = wrapper
      .findAll('[data-test="n-button"]')
      .find((node) => node.text().includes('common.action.assign'))

    expect(editBtn).toBeTruthy()
    expect(assignBtn).toBeTruthy()

    await editBtn!.trigger('click')
    expect(routerPushSpy).toHaveBeenCalledWith({
      name: 'role-detail',
      params: {
        id: 9,
      },
    })

    await assignBtn!.trigger('click')
    expect(wrapper.get('[data-test="n-drawer"]').attributes('data-show')).toBe('true')
    expect(wrapper.get('[data-test="role-assign"]').attributes('data-role-id')).toBe('9')
  })
})
