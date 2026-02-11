import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'

vi.mock('@/_utils/i18n', () => ({
  $t: vi.fn((key: string) => key),
}))

vi.mock('@/modules/approval/presentation/print/DiffRenderer', () => ({
  DiffRenderer: defineComponent({
    name: 'DiffRenderer',
    props: {
      newValue: {
        required: false,
      },
      oldValue: {
        required: false,
      },
    },
    setup(props) {
      return () =>
        h('span', {
          'data-test': 'diff-renderer',
          'data-new': props.newValue == null ? '' : String(props.newValue),
          'data-old': props.oldValue == null ? '' : String(props.oldValue),
        })
    },
  }),
}))

import ServiceAgreementPrint from '@/modules/service-agreement/presentation/print/ServiceAgreementPrint'
import {
  PriceCategoryEnum,
  PriceModelEnum,
  PriceTypeEnum,
  ServiceAgreementStatusEnum,
  UsageCategoryEnum,
} from '@/modules/service-agreement/application/constants'
import type { ServiceAgreementData } from '@/modules/service-agreement/application/models'

const createData = (status: number) =>
  ({
    id: 1,
    companyName: 'Acme',
    companyArea: '110000',
    companyAddress: 'Addr-1',
    industry: 'IT',
    status,
    liaisonName: 'Alice',
    liaisonPosition: 'Manager',
    liaisonPhone: '13800138000',
    yearUsableCharge: 88,
    isTimeOfUsePricingEnabled: false,
    peakPercentage: null,
    superPeakPercentage: null,
    standardPercentage: null,
    valleyPercentage: null,
    comment: 'remark',
    priceModel: PriceModelEnum.Guaranteed,
    priceType: PriceTypeEnum.PowerPlantSide,
    priceCategory: PriceCategoryEnum.FixedPrice,
    fixedPrice: '0.1234',
    fixedSpread: null,
    revenueShareRatio: null,
    expirationTime: 1735000000000,
    servicePointSpecifications: [
      {
        id: 11,
        agreementId: 1,
        serviceAccount: 'S001',
        transformerCapacity: 100,
        electricityConsumptionType: UsageCategoryEnum.LargeIndustrial,
        voltageClass: '10',
      },
    ],
  }) as Omit<ServiceAgreementData, 'creator' | 'createdTime' | 'updatedTime'>

describe('ServiceAgreementPrint', () => {
  it('shows print header and hides signing detail section when status is Record', () => {
    const wrapper = mount(ServiceAgreementPrint, {
      props: {
        data: createData(ServiceAgreementStatusEnum.Record),
      },
    })

    expect(wrapper.text()).toContain('domain.agreement.print.title')
    expect(wrapper.text()).toContain('common.field.id')
    expect(wrapper.text()).not.toContain('domain.agreement.tab.details')
  })

  it('shows signing detail section and renders attachment slot when status is Sign', () => {
    const wrapper = mount(ServiceAgreementPrint, {
      props: {
        data: {
          ...createData(ServiceAgreementStatusEnum.Sign),
          servicePointSpecifications: [],
        },
      },
      slots: {
        attachments: () => h('div', { 'data-test': 'attachments-slot' }, 'attachments'),
      },
    })

    expect(wrapper.text()).toContain('domain.agreement.tab.details')
    expect(wrapper.text()).toContain('domain.servicePoint.title')
    expect(wrapper.text()).toContain('common.label.noData')
    expect(wrapper.find('[data-test="attachments-slot"]').exists()).toBe(true)
  })
})
