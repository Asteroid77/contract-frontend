import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import { mount } from '@vue/test-utils'

type MockDataTableColumn = {
  key?: string
}

const { routerPushSpy } = vi.hoisted(() => ({
  routerPushSpy: vi.fn(),
}))

const rows = [
  {
    id: 1,
    name: 'alice',
    discriminator: 7,
    registerType: 1,
    phone: '13800000000',
    platform: 'pc',
    totpEnabled: true,
    deleted: false,
  },
]

vi.mock('vue-i18n', () => ({
  createI18n: () => ({
    global: {
      t: (key: string) => key,
    },
  }),
  useI18n: () => ({
    t: (key: string) => key,
  }),
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: routerPushSpy,
  }),
}))

vi.mock('@/modules/access/application/hooks/useCan', () => ({
  usePermission: () => ({ value: true }),
}))

vi.mock('@/modules/user/application/hooks/useUserPage', () => ({
  useUserPage: () => ({
    data: { value: { records: rows } },
    isLoading: { value: false },
    refetch: vi.fn(),
  }),
  useDeleteUser: () => ({
    mutate: vi.fn(),
    isPending: { value: false },
  }),
}))

vi.mock('@/modules/shared/presentation/advanced-query', () => ({
  ModernQueryBuilder: defineComponent({
    name: 'ModernQueryBuilder',
    setup() {
      return () => h('div', { 'data-test': 'modern-query-builder' })
    },
  }),
  QueryActionButtons: defineComponent({
    name: 'QueryActionButtons',
    emits: ['search', 'reset'],
    setup(_, { emit }) {
      return () =>
        h('div', { 'data-test': 'query-action-buttons' }, [
          h(
            'button',
            {
              'data-test': 'n-button',
              onClick: () => emit('search'),
            },
            'common.action.search',
          ),
          h(
            'button',
            {
              'data-test': 'n-button',
              onClick: () => emit('reset'),
            },
            'common.action.reset',
          ),
        ])
    },
  }),
}))

vi.mock('@/modules/user/application/constants', () => ({
  RegisterTypeOption: [
    {
      value: 1,
      label: 'register.phone',
    },
  ],
}))

vi.mock('@/modules/user/application/utils/platform', () => ({
  resolvePlatformLabelKey: () => 'platform.pc',
}))

vi.mock('naive-ui', () => ({
  NButton: defineComponent({
    name: 'NButton',
    emits: ['click'],
    setup(_, { emit, slots }) {
      return () =>
        h('button', { 'data-test': 'n-button', onClick: () => emit('click') }, slots.default?.())
    },
  }),
  NSpace: defineComponent({
    name: 'NSpace',
    setup(_, { slots }) {
      return () => h('div', { 'data-test': 'n-space' }, slots.default?.())
    },
  }),
  NPopconfirm: defineComponent({
    name: 'NPopconfirm',
    setup(_, { slots }) {
      return () => h('div', { 'data-test': 'n-popconfirm' }, slots.default?.())
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
    },
    setup(props) {
      return () => {
        const columns = (props.columns || []) as MockDataTableColumn[]
        const keys = columns.map((column) => String(column.key ?? ''))
        return h('div', {
          'data-test': 'n-data-table',
          'data-columns-len': String(columns.length),
          'data-column-keys': keys.join(','),
        })
      }
    },
  }),
}))

import UserListPage from '@/modules/user/presentation/manage/UserListPage'

const setViewportWidth = (width: number) => {
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    writable: true,
    value: width,
  })
  window.dispatchEvent(new Event('resize'))
}

describe('UserListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setViewportWidth(1280)
  })

  it('keeps full columns on desktop viewport', async () => {
    const wrapper = mount(UserListPage)
    await nextTick()

    const table = wrapper.get('[data-test="n-data-table"]')
    expect(table.attributes('data-columns-len')).toBe('7')
    expect(table.attributes('data-column-keys')).toBe(
      'name,registerType,phone,platform,totpEnabled,deleted,operate',
    )
  })

  it('uses compact mobile columns on narrow viewport', async () => {
    setViewportWidth(375)
    const wrapper = mount(UserListPage)
    await nextTick()

    const table = wrapper.get('[data-test="n-data-table"]')
    expect(table.attributes('data-columns-len')).toBe('3')
    expect(table.attributes('data-column-keys')).toBe('name,deleted,operate')
  })
})
