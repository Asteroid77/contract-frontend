import { defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

type ServiceAgreementRow = {
  id: number | null
  companyName: string
}

type ServiceAgreementPageResult = {
  records: ServiceAgreementRow[]
  total: number
}

const { pageResultRef, isPendingRef, refetchSpy, routerPushSpy } = vi.hoisted(() => ({
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
}))

vi.mock('@/_utils/i18n', () => ({
  $t: (key: string) => key,
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: routerPushSpy,
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
    setup() {
      return () => h('input', { 'data-test': 'n-input' })
    },
  }),
  NSelect: defineComponent({
    name: 'NSelect',
    setup() {
      return () => h('div', { 'data-test': 'n-select' })
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
}))

vi.mock('@/modules/service-agreement/application/hooks/useSignService', () => ({
  useServiceAgreementPage: vi.fn(() => ({
    data: pageResultRef,
    isPending: isPendingRef,
    refetch: refetchSpy,
  })),
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
            slots.actions?.(
              ((props.data as ServiceAgreementRow[] | undefined)?.[0] ?? {}) as never,
            ),
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
  })

  it('passes table data and loading state to ServiceAgreementPage', () => {
    const wrapper = mount(ServiceAgreementPageView)

    const page = wrapper.get('[data-test="service-agreement-page"]')
    expect(page.attributes('data-rows')).toBe('1')
    expect(page.attributes('data-loading')).toBe('false')
  })

  it('clicking search button calls refetch', async () => {
    const wrapper = mount(ServiceAgreementPageView)
    const searchBtn = wrapper
      .findAll('button')
      .find((button) => button.text() === 'common.action.search')

    if (!searchBtn) {
      throw new Error('search button missing')
    }

    await searchBtn.trigger('click')

    expect(refetchSpy).toHaveBeenCalledTimes(1)
  })

  it('uses tiny size for search and reset actions from shared query actions', () => {
    const wrapper = mount(ServiceAgreementPageView)
    const searchBtn = wrapper
      .findAll('button')
      .find((button) => button.text() === 'common.action.search')
    const resetBtn = wrapper
      .findAll('button')
      .find((button) => button.text() === 'common.action.reset')

    if (!searchBtn) {
      throw new Error('search button missing')
    }
    if (!resetBtn) {
      throw new Error('reset button missing')
    }

    expect(searchBtn.attributes('data-size')).toBe('tiny')
    expect(resetBtn.attributes('data-size')).toBe('tiny')
  })

  it('edit action navigates to sign route with mode and id', async () => {
    const wrapper = mount(ServiceAgreementPageView)
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
        id: 7,
      },
    })
  })

  it('detail action navigates to sign route with detail mode', async () => {
    const wrapper = mount(ServiceAgreementPageView)
    const detailBtn = wrapper
      .findAll('button')
      .find((button) => button.text() === 'common.action.view')

    if (!detailBtn) {
      throw new Error('detail button missing')
    }

    await detailBtn.trigger('click')

    expect(routerPushSpy).toHaveBeenCalledWith({
      name: 'sign',
      query: {
        mode: 'detail',
        id: 7,
      },
    })
  })

  it('skips id in query when current row id is missing', async () => {
    pageResultRef.value = {
      records: [
        {
          id: null,
          companyName: 'NoId',
        },
      ],
      total: 1,
    }

    const wrapper = mount(ServiceAgreementPageView)
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
      },
    })
  })
})
