import { describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import type { FormItemInst, FormItemRule, FormRules } from 'naive-ui'
import type { TimeOfUsePricingValue } from '@/modules/service-agreement/application/models'

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

type ValidatorLike = (rule: FormItemRule, value: unknown) => true | Error

const getValidator = (rule: unknown): ValidatorLike => {
  const validator = (rule as FormItemRule).validator
  if (!validator) {
    throw new Error('validator should be defined')
  }

  const strictValidator = validator as (
    inputRule: FormItemRule,
    value: unknown,
    callback: (errors?: Error[]) => void,
    source: Record<string, unknown>,
    options: Record<string, unknown>,
  ) => true | Error

  return (inputRule, value) => strictValidator(inputRule, value, () => undefined, {}, {})
}

const getFieldRule = (rules: FormRules, key: string): FormItemRule => {
  const rule = rules[key]
  if (Array.isArray(rule)) {
    throw new Error(`field ${key} should not be array rule in this test`)
  }
  if (!rule) {
    throw new Error(`field ${key} rule should exist`)
  }
  return rule
}

describe('service-agreement validation', () => {
  it('serviceAccountRule validates digits-only and length range', () => {
    const validator = getValidator(serviceAccountRule[0])

    const invalidChars = validator({}, 'abc123')
    expect(invalidChars).toBeInstanceOf(Error)

    const invalidLength = validator({}, '123456789')
    expect(invalidLength).toBeInstanceOf(Error)

    const valid = validator({}, '1234567890')
    expect(valid).toBe(true)
  })

  it('percentageRule checks range and sum when TOU enabled', () => {
    const formValue = ref<FormInput<TimeOfUsePricingValue>>({
      isTimeOfUsePricingEnabled: true,
      peakPercentage: 20,
      superPeakPercentage: 20,
      standardPercentage: 20,
      valleyPercentage: 20,
    })

    const restoreValidation = vi.fn()
    const formItemsRef = ref<(FormItemInst | null)[]>([
      { restoreValidation } as unknown as FormItemInst,
      null,
    ])

    const rule = percentageRule('peakPercentage', formValue, formItemsRef)
    const validator = getValidator(rule)

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
    const formValue = ref<FormInput<TimeOfUsePricingValue>>({
      isTimeOfUsePricingEnabled: false,
      peakPercentage: 10,
      superPeakPercentage: 10,
      standardPercentage: 10,
      valleyPercentage: 10,
    })

    const formItemsRef = ref<(FormItemInst | null)[]>([
      { restoreValidation: vi.fn() } as unknown as FormItemInst,
    ])
    const rule = percentageRule('peakPercentage', formValue, formItemsRef)
    const validator = getValidator(rule)

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

    expect(getValidator(getFieldRule(rules, 'priceType'))({}, undefined)).toBe(true)
    expect(getValidator(getFieldRule(rules, 'priceCategory'))({}, undefined)).toBe(true)

    expect(getValidator(getFieldRule(rules, 'fixedPrice'))({}, '')).toBeInstanceOf(Error)
    expect(getValidator(getFieldRule(rules, 'comment'))({}, '')).toBeInstanceOf(Error)

    model.priceCategory = 2
    expect(getValidator(getFieldRule(rules, 'fixedSpread'))({}, '')).toBeInstanceOf(Error)

    model.priceCategory = 3
    expect(getValidator(getFieldRule(rules, 'revenueShareRatio'))({}, null)).toBeInstanceOf(Error)
  })

  it('previewAttachmentsRule requires code field', () => {
    const validator = getValidator(previewAttachmentsRule.code)

    expect(validator({}, '')).toBeInstanceOf(Error)
    expect(validator({}, '1234')).toBe(true)
  })
})
