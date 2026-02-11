import { describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

vi.mock('@/_utils/i18n', () => ({
  $t: vi.fn((key: string) => key),
}))

import {
  PriceCategoryEnum,
  PriceCategoryOption,
  PriceModelEnum,
  PriceModelOption,
  PriceTypeEnum,
  PriceTypeOption,
  ServiceAgreementStatusEnum,
  ServiceAgreementStatusOption,
  TransformerCapacityOption,
  VoltageLevelOptions,
} from '@/modules/service-agreement/application/constants'

describe('service-agreement constants', () => {
  it('defines core enums and static options', () => {
    expect(PriceTypeEnum.PowerPlantSide).toBe(1)
    expect(PriceModelEnum.Guaranteed).toBe(2)
    expect(PriceCategoryEnum.ShareRatio).toBe(3)
    expect(ServiceAgreementStatusEnum.Sign).toBe(2)
    expect(ServiceAgreementStatusOption[2]).toEqual(
      expect.objectContaining({
        value: 3,
        disabled: true,
      }),
    )
    expect(PriceModelOption).toHaveLength(4)
    expect(TransformerCapacityOption[0]).toEqual({ label: '30 kVA', value: 30 })
    expect(VoltageLevelOptions[0]).toEqual({ label: '0.4 kV', value: 0.4 })
  })

  it('PriceTypeOption disables sales side unless guaranteed model', () => {
    const guaranteed = ref<number | null>(PriceModelEnum.Guaranteed)
    const notGuaranteed = ref<number | null>(PriceModelEnum.RevenueShare)

    const guaranteedOptions = PriceTypeOption(guaranteed as never)
    const nonGuaranteedOptions = PriceTypeOption(notGuaranteed as never)

    expect(guaranteedOptions[2]?.disabled).toBe(false)
    expect(nonGuaranteedOptions[2]?.disabled).toBe(true)
  })

  it('PriceCategoryOption enables share ratio only for revenue-share model', () => {
    const revenueShare = ref<number | null>(PriceModelEnum.RevenueShare)
    const guaranteed = ref<number | null>(PriceModelEnum.Guaranteed)

    const revenueOptions = PriceCategoryOption(revenueShare as never)
    const guaranteedOptions = PriceCategoryOption(guaranteed as never)

    expect(revenueOptions[0]?.disabled).toBe(true)
    expect(revenueOptions[1]?.disabled).toBe(true)
    expect(revenueOptions[2]?.disabled).toBe(false)

    expect(guaranteedOptions[0]?.disabled).toBe(false)
    expect(guaranteedOptions[1]?.disabled).toBe(false)
    expect(guaranteedOptions[2]?.disabled).toBe(true)
  })
})
