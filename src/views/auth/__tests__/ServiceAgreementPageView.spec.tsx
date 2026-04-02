import { defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { FilterOp } from '@/modules/shared/domain/query'

type ServiceAgreementRow = {
  id: number | null
  companyName: string
}

type ServiceAgreementPageResult = {
  records: ServiceAgreementRow[]
  total: number
}

const companyAreaQuery = {
  filters: [
    { field: 'companyName', op: FilterOp.LIKE_RIGHT, value: 'Acme' },
    { field: 'companyArea', op: FilterOp.EQ, value: '330100' },
  ],
}

const statusOnlyQuery = {
  filters: [{ field: 'status', op: FilterOp.EQ, value: 2 }],
}

const {
  pageResultRef,
  isPendingRef,
  refetchSpy,
  routerPushSpy,
  routerReplaceSpy,
  routeQueryRef,
  capturedPageRequestRef,
  capturedEnabledRef,
} = vi.hoisted(() => ({
  pageResultRef: {
    value: {
      records: [
        {
          id: 7,
          companyName: 'Acme',
        },
      ],
      total: 1,
    } as ServiceAgreementPageResult,
  },
  isPendingRef: {
    value: false,
  },
  refetchSpy: vi.fn(),
  routerPushSpy: vi.fn(),
  routerReplaceSpy: vi.fn(),
  routeQueryRef: {
    value: {} as Record<string, unknown>,
  },
  capturedPageRequestRef: {
    value: null as { value: { page?: number; size?: number; query?: unknown } } | null,
  },
  capturedEnabledRef: {
    value: null as { value: boolean } | null,
  },
}))

vi.mock('@/_utils/i18n', () => ({
  $t: (key: string) => key,
}))

vi.mock('@/router/useTypedRouter', () => ({
  useTypedRouter: () => ({
    push: routerPushSpy,
    replace: routerReplaceSpy,
  }),
  useTypedRoute: () => ({
    query: routeQueryRef.value,
  }),
}))

vi.mock('naive-ui', () => ({
  NSpace: defineComponent({
    name: 'NSpace',
    setup(_, { slots }) {
      return () => h('div', { 'data-test': 'n-space' }, slots.default?.())
    },
  }),
  NButton: defineComponent({
    name: 'NButton',
    props: {
      onClick: {
        type: Function,
        required: false,
      },
      size: {
        type: String,
        required: false,
      },
    },
    setup(props, { slots }) {
      return () =>
        h('button', { onClick: props.onClick, 'data-size': props.size }, slots.default?.())
    },
  }),
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
        h('section', {
          'data-test': 'n-result',
          'data-status': props.status,
          'data-title': props.title,
          'data-description': props.description,
        }, [slots.icon?.(), slots.footer?.()])
    },
  }),
  NIcon: defineComponent({
    name: 'NIcon',
    props: {
      size: {
        type: [String, Number],
        required: false,
      },
      style: {
        type: [String, Object],
        required: false,
      },
    },
    setup(props, { slots }) {
      return () => h('i', { 'data-test': 'n-icon', style: props.style }, slots.default?.())
    },
  }),
}))

vi.mock('@/modules/shared/presentation/advanced-query', () => ({
  ModernQueryBuilder: defineComponent({
    name: 'ModernQueryBuilder',
    setup(_, { attrs }) {
      return () =>
        h('div', { 'data-test': 'modern-query-builder' }, [
          h(
            'button',
            {
              'data-test': 'emit-company-area-query',
              onClick: () => {
                const handler = attrs['onUpdate:query'] as ((query: unknown) => void) | undefined
                handler?.(companyAreaQuery)
              },
            },
            'emit-company-area-query',
          ),
          h(
            'button',
            {
              'data-test': 'emit-status-query',
              onClick: () => {
                const handler = attrs['onUpdate:query'] as ((query: unknown) => void) | undefined
                handler?.(statusOnlyQuery)
              },
            },
            'emit-status-query',
          ),
        ])
    },
  }),
  QueryActionButtons: defineComponent({
    name: 'QueryActionButtons',
    props: {
      onSearch: {
        type: Function,
        required: false,
      },
      onReset: {
        type: Function,
        required: false,
      },
      searchLoading: {
        type: Boolean,
        required: false,
      },
    },
    setup(props) {
      return () => [
        h('button', { 'data-size': 'tiny', onClick: props.onSearch }, 'common.action.search'),
        h('button', { 'data-size': 'tiny', onClick: props.onReset }, 'common.action.reset'),
      ]
    },
  }),
}))

vi.mock('@/modules/service-agreement/application/hooks/useSignService', () => ({
  useServiceAgreementPage: vi.fn((pageRequest, enabled) => {
    capturedPageRequestRef.value = pageRequest
    capturedEnabledRef.value = enabled
    return {
      data: pageResultRef,
      isPending: isPendingRef,
      refetch: refetchSpy,
    }
  }),
}))

vi.mock('@/modules/service-agreement/presentation/sign/ServiceAgreementPage', () => ({
  default: defineComponent({
    name: 'ServiceAgreementPage',
    props: {
      data: {
        type: Array,
        required: false,
      },
      loading: {
        type: Boolean,
        required: false,
      },
      pagination: {
        type: Object,
        required: false,
      },
    },
    setup(props, { slots }) {
      return () =>
        h(
          'section',
          {
            'data-test': 'service-agreement-page',
            'data-rows': String((props.data || []).length),
            'data-loading': String(Boolean(props.loading)),
          },
          [
            (props.data as ServiceAgreementRow[] | undefined)?.length
              ? slots.actions?.(
                  ((props.data as ServiceAgreementRow[] | undefined)?.[0] ?? {}) as never,
                )
              : slots.empty?.(),
          ],
        )
    },
  }),
}))

import ServiceAgreementPageView from '@/views/auth/ServiceAgreementPageView'

describe('ServiceAgreementPageView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    pageResultRef.value = {
      records: [
        {
          id: 7,
          companyName: 'Acme',
        },
      ],
      total: 1,
    }
    isPendingRef.value = false
    routeQueryRef.value = {}
    capturedPageRequestRef.value = null
    capturedEnabledRef.value = null
  })

  it('shows prompt and keeps page query disabled before first search', () => {
    const wrapper = mount(ServiceAgreementPageView)

    expect(capturedEnabledRef.value?.value).toBe(false)
    const result = wrapper.get('[data-test="n-result"]')
    expect(result.attributes('data-status')).toBe('info')
    expect(result.attributes('data-title')).toBe('请先查询')
    expect(wrapper.find('[data-test="service-agreement-page"]').exists()).toBe(true)
    expect(wrapper.get('[data-test="n-icon"]').attributes('style')).toContain('var(--color-primary)')
  })

  it('searches through advanced query and persists route query', async () => {
    const wrapper = mount(ServiceAgreementPageView)
    await wrapper.get('[data-test="emit-company-area-query"]').trigger('click')

    const searchBtn = wrapper
      .findAll('button')
      .find((button) => button.text() === 'common.action.search')

    if (!searchBtn) {
      throw new Error('search button missing')
    }

    await searchBtn.trigger('click')

    expect(capturedEnabledRef.value?.value).toBe(true)
    expect(routerReplaceSpy).toHaveBeenCalledWith({
      name: 'sign-page',
      query: {
        q: JSON.stringify(companyAreaQuery),
      },
    })
    expect(capturedPageRequestRef.value?.value.query).toEqual(companyAreaQuery)
    expect(wrapper.find('[data-test="service-agreement-page"]').exists()).toBe(true)
  })

  it('shows add button only when no result and duplicate-check fields are present', async () => {
    routeQueryRef.value = {
      q: JSON.stringify(companyAreaQuery),
    }
    pageResultRef.value = {
      records: [],
      total: 0,
    }

    const wrapper = mount(ServiceAgreementPageView)
    const addBtn = wrapper
      .findAll('button')
      .find((button) => button.text() === 'common.action.add')

    if (!addBtn) {
      throw new Error('add button missing')
    }

    await addBtn.trigger('click')

    expect(routerPushSpy).toHaveBeenCalledWith({
      name: 'sign',
      query: {
        prefill_companyName: 'Acme',
        prefill_companyArea: '330100',
      },
    })
  })

  it('does not show add button for non-duplicate-check empty query result', () => {
    routeQueryRef.value = {
      q: JSON.stringify(statusOnlyQuery),
    }
    pageResultRef.value = {
      records: [],
      total: 0,
    }

    const wrapper = mount(ServiceAgreementPageView)
    const addBtn = wrapper.findAll('button').find((button) => button.text() === 'common.action.add')

    expect(addBtn).toBeUndefined()
    expect(wrapper.find('[data-test="service-agreement-page"]').exists()).toBe(true)
    const result = wrapper.get('[data-test="n-result"]')
    expect(result.attributes('data-status')).toBe('info')
    expect(result.attributes('data-title')).toBe('未查询到符合条件的数据')
  })

  it('restores searched state from route query and allows row navigation', async () => {
    routeQueryRef.value = {
      q: JSON.stringify(companyAreaQuery),
    }

    const wrapper = mount(ServiceAgreementPageView)

    expect(capturedEnabledRef.value?.value).toBe(true)
    expect(wrapper.get('[data-test="service-agreement-page"]').attributes('data-rows')).toBe('1')

    const editBtn = wrapper
      .findAll('button')
      .find((button) => button.text() === 'common.action.edit')

    if (!editBtn) {
      throw new Error('edit button missing')
    }

    await editBtn.trigger('click')

    expect(routerPushSpy).toHaveBeenCalledWith({
      name: 'sign',
      query: {
        mode: 'edit',
        id: '7',
      },
    })
  })

  it('reset clears route query and returns to the prompt state', async () => {
    routeQueryRef.value = {
      q: JSON.stringify(companyAreaQuery),
    }

    const wrapper = mount(ServiceAgreementPageView)
    const resetBtn = wrapper
      .findAll('button')
      .find((button) => button.text() === 'common.action.reset')

    if (!resetBtn) {
      throw new Error('reset button missing')
    }

    await resetBtn.trigger('click')

    expect(routerReplaceSpy).toHaveBeenCalledWith({
      name: 'sign-page',
      query: {},
    })
    expect(capturedEnabledRef.value?.value).toBe(false)
    const result = wrapper.get('[data-test="n-result"]')
    expect(result.attributes('data-status')).toBe('info')
    expect(result.attributes('data-title')).toBe('请先查询')
  })
})
