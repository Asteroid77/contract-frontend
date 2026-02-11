import { defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { routerPushSpy, routerGoSpy, routeState, messageErrorSpy } = vi.hoisted(() => ({
  routerPushSpy: vi.fn(),
  routerGoSpy: vi.fn(),
  routeState: {
    query: {} as Record<string, unknown>,
  },
  messageErrorSpy: vi.fn(),
}))

vi.mock('@/_utils/i18n', () => ({
  $t: (key: string) => key,
}))

vi.mock('@/_utils/discrete_naive_api', () => ({
  message: {
    error: messageErrorSpy,
  },
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: routerPushSpy,
    go: routerGoSpy,
  }),
  useRoute: () => routeState,
}))

vi.mock('naive-ui', () => ({
  NResult: defineComponent({
    name: 'NResult',
    props: {
      title: {
        type: String,
        required: false,
      },
      status: {
        type: String,
        required: false,
      },
    },
    setup(props, { slots }) {
      return () =>
        h(
          'section',
          {
            'data-test': 'n-result',
            'data-title': props.title,
            'data-status': props.status,
          },
          [h('h1', { 'data-test': 'n-result-title' }, props.title ?? ''), slots.default?.()],
        )
    },
  }),
  NButton: defineComponent({
    name: 'NButton',
    props: {
      onClick: {
        type: Function,
        required: false,
      },
    },
    setup(props, { slots }) {
      return () => h('button', { onClick: props.onClick }, slots.default?.())
    },
  }),
  NFlex: defineComponent({
    name: 'NFlex',
    setup(_, { slots }) {
      return () => h('div', { 'data-test': 'n-flex' }, slots.default?.())
    },
  }),
}))

import SignResultView from '@/views/auth/SignResultView'
import { ApprovalProcessNameEnum } from '@/modules/approval/application/constants'
import { ServiceAgreementStatusEnum } from '@/modules/service-agreement/application/constants'

describe('SignResultView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    routeState.query = {}
  })

  it('renders invalid params state when route query is missing', async () => {
    const wrapper = mount(SignResultView, {
      props: {
        id: 1,
        status: ServiceAgreementStatusEnum.Record,
      },
    })

    expect(wrapper.text()).toContain('common.error.invalidParams')

    await wrapper.find('button').trigger('click')

    expect(routerGoSpy).toHaveBeenCalledWith(-2)
  })

  it('navigates to sign detail when status is Record and view is clicked', async () => {
    routeState.query = {
      id: '88',
      status: '1',
    }

    const wrapper = mount(SignResultView, {
      props: {
        id: 88,
        status: ServiceAgreementStatusEnum.Record,
      },
    })

    expect(wrapper.text()).toContain('domain.agreement.message.filingSuccess')

    const buttons = wrapper.findAll('button')
    await buttons[1].trigger('click')

    expect(routerPushSpy).toHaveBeenCalledWith({
      name: 'sign',
      query: {
        id: '88',
      },
    })
  })

  it('navigates to approval detail when status is Sign and view is clicked', async () => {
    routeState.query = {
      id: '99',
      status: '2',
    }

    const wrapper = mount(SignResultView, {
      props: {
        id: 99,
        status: ServiceAgreementStatusEnum.Sign,
      },
    })

    expect(wrapper.text()).toContain('domain.agreement.message.signSuccess')

    const buttons = wrapper.findAll('button')
    await buttons[1].trigger('click')

    expect(routerPushSpy).toHaveBeenCalledWith({
      name: 'approval-instance-detail',
      query: {
        template: ApprovalProcessNameEnum.SIGN,
        instanceId: '99',
      },
    })
  })

  it('shows message error when status does not match supported branches', async () => {
    routeState.query = {
      id: '77',
      status: '0',
    }

    const wrapper = mount(SignResultView, {
      props: {
        id: 77,
        status: 999 as never,
      },
    })

    const buttons = wrapper.findAll('button')
    await buttons[1].trigger('click')

    expect(messageErrorSpy).toHaveBeenCalledWith('common.error.invalidParams')
    expect(routerPushSpy).not.toHaveBeenCalled()
  })
})
