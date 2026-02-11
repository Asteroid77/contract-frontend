import { describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

vi.mock('@/_utils/i18n', () => ({
  $t: vi.fn((key: string) => key),
}))

import {
  createPriceGroupRules,
  createServiceAgreementRules,
  percentageRule,
  previewAttachmentsRule,
  serviceAccountRule,
} from '@/modules/service-agreement/application/validation'

describe('service-agreement validation', () => {
  it('serviceAccountRule validates digits-only and length range', () => {
    const validator = serviceAccountRule[0].validator as any

    const invalidChars = validator({}, 'abc123')
    expect(invalidChars).toBeInstanceOf(Error)

    const invalidLength = validator({}, '123456789')
    expect(invalidLength).toBeInstanceOf(Error)

    const valid = validator({}, '1234567890')
    expect(valid).toBe(true)
  })

  it('percentageRule checks range and sum when TOU enabled', () => {
    const formValue = ref({
      isTimeOfUsePricingEnabled: true,
      peakPercentage: 20,
      superPeakPercentage: 20,
      standardPercentage: 20,
      valleyPercentage: 20,
    })

    const restoreValidation = vi.fn()
    const formItemsRef = ref([{ restoreValidation }, null])

    const rule = percentageRule('peakPercentage', formValue as any, formItemsRef as any)
    const validator = rule.validator as any

    expect(validator({}, 101)).toBeInstanceOf(Error)

    const invalidTotal = validator({}, 20)
    expect(invalidTotal).toBeInstanceOf(Error)
    expect(restoreValidation).toHaveBeenCalledTimes(1)

    formValue.value = {
      ...formValue.value,
      valleyPercentage: 40,
    }
    expect(validator({}, 20)).toBe(true)
  })

  it('percentageRule skips total validation when TOU is disabled', () => {
    const formValue = ref({
      isTimeOfUsePricingEnabled: false,
      peakPercentage: 10,
      superPeakPercentage: 10,
      standardPercentage: 10,
      valleyPercentage: 10,
    })

    const formItemsRef = ref([{ restoreValidation: vi.fn() }])
    const rule = percentageRule('peakPercentage', formValue as any, formItemsRef as any)
    const validator = rule.validator as any

    expect(validator({}, 10)).toBe(true)
  })

  it('createServiceAgreementRules only includes sign/attachment rules when status is signing', () => {
    const baseModel = {
      customerInfo: {
        status: 1,
      },
      signInfo: {
        priceModel: 4,
        priceType: null,
        priceCategory: null,
        fixedPrice: null,
        fixedSpread: null,
        revenueShareRatio: null,
        comment: null,
      },
    }

    const recordRules = createServiceAgreementRules(ref(baseModel) as never)
    expect(recordRules.signInfo).toEqual({})
    expect(recordRules.attachmentInfo).toEqual({})

    const signRules = createServiceAgreementRules(
      ref({
        ...baseModel,
        customerInfo: {
          status: 2,
        },
      }) as never,
    )

    expect(signRules.signInfo).toEqual(
      expect.objectContaining({
        expirationTime: expect.any(Object),
        servicePointSpecifications: expect.any(Object),
      }),
    )
    expect(signRules.attachmentInfo).toEqual(
      expect.objectContaining({
        billIds: expect.any(Object),
        contractScanIds: expect.any(Object),
      }),
    )
  })

  it('createPriceGroupRules enforces conditional required fields', () => {
    const model = {
      priceModel: 4,
      priceCategory: 1,
      priceType: null,
      fixedPrice: null,
      fixedSpread: null,
      revenueShareRatio: null,
      comment: null,
    }

    const rules = createPriceGroupRules(model as never)

    expect((rules.priceType as any).validator({}, undefined)).toBe(true)
    expect((rules.priceCategory as any).validator({}, undefined)).toBe(true)

    expect((rules.fixedPrice as any).validator({}, '')).toBeInstanceOf(Error)
    expect((rules.comment as any).validator({}, '')).toBeInstanceOf(Error)

    model.priceCategory = 2
    expect((rules.fixedSpread as any).validator({}, '')).toBeInstanceOf(Error)

    model.priceCategory = 3
    expect((rules.revenueShareRatio as any).validator({}, null)).toBeInstanceOf(Error)
  })

  it('previewAttachmentsRule requires code field', () => {
    const validator = previewAttachmentsRule.code.validator as any

    expect(validator({}, '')).toBeInstanceOf(Error)
    expect(validator({}, '1234')).toBe(true)
  })
})
