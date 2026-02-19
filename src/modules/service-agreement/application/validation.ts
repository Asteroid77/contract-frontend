import { $t } from '@/_utils/i18n'
import { chinaMobilePhoneVerify } from '@/modules/shared/application/rules/ChinaMobilePhoneNumRule'
import { requireRule } from '@/modules/shared/application/rules/RequireRule'
import type {
  ServiceAgreementUIMap,
  ServicePointSpecification,
  SignInfoDataForUI,
  TimeOfUsePricingValue,
} from '@/modules/service-agreement/application/models'
import type { FormItemInst, FormItemRule, FormRules } from 'naive-ui'
import type { Ref } from 'vue'
import {
  PriceCategoryEnum,
  PriceModelEnum,
  ServiceAgreementStatusEnum,
} from '@/modules/service-agreement/application/constants'

export const serviceAccountRule: FormItemRule[] = [
  {
    required: true,
    trigger: ['blur'],
    validator: (rule: FormItemRule, value: string) => {
      const result = requireRule(rule, $t('domain.servicePoint.field.accountNo'), value)
      if (result !== true) return result
      // 正则表达式：检查是否为纯数字
      if (!/^\d+$/.test(value)) {
        return new Error($t('domain.servicePoint.validation.digits'))
      }
      // 长度检查
      if (value.length < 10 || value.length > 20) {
        return new Error($t('domain.servicePoint.validation.length'))
      }
      return true
    },
  },
]
export const voltageLevelRule: FormItemRule[] = [
  {
    required: true,
    trigger: ['blur'],
    validator: (rule: FormItemRule, value: number) => {
      return requireRule(rule, $t('domain.servicePoint.field.voltage'), value)
    },
  },
]
export const usageCategoryRule: FormItemRule[] = [
  {
    required: true,
    trigger: ['blur'],
    validator: (rule: FormItemRule, value: number) => {
      return requireRule(rule, $t('domain.servicePoint.field.category'), value)
    },
  },
]
export const transformerCapacityRule: FormItemRule[] = [
  {
    required: true,
    trigger: ['blur'],
    validator: (rule: FormItemRule, value: number) => {
      return requireRule(rule, $t('domain.servicePoint.field.capacity'), value)
    },
  },
]

// 单个比例的校验规则（0-100之间的数字）
// 映射 dynamic keys
const pricingFieldMap = {
  isTimeOfUsePricingEnabled: 'domain.agreement.field.touEnabled',
  peakPercentage: 'domain.agreement.field.peak',
  superPeakPercentage: 'domain.agreement.field.superPeak',
  standardPercentage: 'domain.agreement.field.standard',
  valleyPercentage: 'domain.agreement.field.valley',
} as const satisfies Record<keyof TimeOfUsePricingValue, Parameters<typeof $t>[0]>

export const percentageRule: (
  path: keyof TimeOfUsePricingValue,
  formValue: Ref<FormInput<TimeOfUsePricingValue>>,
  formItemsRef: Ref<(FormItemInst | null)[]>,
) => FormItemRule = (
  path: keyof TimeOfUsePricingValue,
  formValue: Ref<FormInput<TimeOfUsePricingValue>>,
  formItemsRef: Ref<(FormItemInst | null)[]>,
) => {
  const fieldKey = pricingFieldMap[path]
  return {
    type: 'number',
    required: true,
    validator(rule: FormItemRule, value: number) {
      if (value === null || value === undefined) {
        return requireRule(rule, $t(fieldKey), value)
      }
      if (value < 0 || value > 100) {
        return new Error(
          $t('domain.agreement.validation.touRange', {
            field: $t(fieldKey),
            min: 0,
            max: 100,
          }),
        )
      }

      if (!formValue.value.isTimeOfUsePricingEnabled) {
        return true
      }
      let isAllCompleted: boolean = true
      const validationKeys = [
        'peakPercentage',
        'superPeakPercentage',
        'standardPercentage',
        'valleyPercentage',
      ]
      validationKeys.forEach((item) => {
        if (formValue.value[item as keyof FormInput<TimeOfUsePricingValue>] === undefined) {
          isAllCompleted = false
        }
      })
      if (isAllCompleted) {
        const total =
          (formValue.value.peakPercentage ?? 0) +
          (formValue.value.superPeakPercentage ?? 0) +
          (formValue.value.standardPercentage ?? 0) +
          (formValue.value.valleyPercentage ?? 0)
        if (total !== 100) {
          formItemsRef.value.forEach((e) => e?.restoreValidation())
          return new Error($t('domain.agreement.validation.touTotal', { total }))
        }
      }
      return true
    },
    trigger: ['blur'],
  }
}
export const createServiceAgreementRules = (model: Ref<ServiceAgreementUIMap>): FormRules => {
  const isSigned = model.value.customerInfo.status === ServiceAgreementStatusEnum.Sign

  return {
    customerInfo: {
      companyName: {
        required: true,
        trigger: ['blur'],
        validator: (rule: FormItemRule, value: string) =>
          requireRule(rule, $t('domain.agreement.field.companyName'), value),
      },
      companyArea: {
        required: true,
        trigger: ['blur', 'change'],
        validator: (rule: FormItemRule, value: string) =>
          requireRule(rule, $t('domain.agreement.field.area'), value),
      },
      companyAddress: {
        required: true,
        trigger: ['blur'],
        validator: (rule: FormItemRule, value: string) =>
          requireRule(rule, $t('domain.agreement.field.address'), value),
      },
      industry: {
        required: true,
        trigger: ['blur'],
        validator: (rule: FormItemRule, value: string) =>
          requireRule(rule, $t('domain.agreement.field.industry'), value),
      },
      liaisonName: {
        required: true,
        trigger: ['blur'],
        validator: (rule: FormItemRule, value: string) =>
          requireRule(rule, $t('domain.agreement.field.contact'), value),
      },
      liaisonPhone: [
        {
          required: true,
          trigger: ['blur'],
          validator: (rule: FormItemRule, value: string) =>
            requireRule(rule, $t('domain.agreement.field.phone'), value),
        },
        {
          trigger: ['blur'],
          validator: (_rule: FormItemRule, value: string) => {
            if (!value) return true
            // 假设 chinaMobilePhoneVerify 返回 boolean，需要转为 Error
            return chinaMobilePhoneVerify(value)
              ? true
              : new Error($t('auth.validation.phoneFormat'))
          },
        },
      ],
      liaisonPosition: {
        required: true,
        trigger: ['blur'],
        validator: (rule: FormItemRule, value: string) =>
          requireRule(rule, $t('domain.agreement.field.position'), value),
      },
      yearUsableCharge: {
        required: true,
        trigger: ['blur'],
        validator: (rule: FormItemRule, value: number) =>
          requireRule(rule, $t('domain.agreement.field.annualUsage'), value),
      },
      status: {
        required: true,
        trigger: ['change'],
        validator: (rule: FormItemRule, value: number) =>
          requireRule(rule, $t('common.label.status'), value),
      },
    } as FormRules,

    // 只有在签约状态下才生成校验规则
    signInfo: (isSigned
      ? {
          ...createPriceGroupRules(model.value.signInfo), // 展开价格组规则
          servicePointSpecifications: {
            type: 'array',
            required: true,
            trigger: ['change', 'update:value'], // 数组变动通常是 change 或 update:value
            validator: (rule: FormItemRule, value: ServicePointSpecification[]) =>
              requireRule(rule, $t('domain.servicePoint.title'), value),
          },
          expirationTime: {
            required: true,
            trigger: ['change'],
            validator: (rule: FormItemRule, value: string) =>
              requireRule(rule, $t('domain.agreement.field.expiryDate'), value),
          },
        }
      : {}) as FormRules,

    attachmentInfo: (isSigned
      ? {
          billIds: {
            type: 'array',
            required: true,
            trigger: ['change', 'update:value'],
            validator: (rule: FormItemRule, value: number[]) =>
              requireRule(rule, $t('domain.agreement.file.bill'), value),
          },
          // 注意：补充附件通常是选填，如果你确定要必填则保留 required: true
          supplementaryAttachmentIds: {
            type: 'array',
            required: true,
            trigger: ['change', 'update:value'],
            validator: (rule: FormItemRule, value: number[]) =>
              requireRule(rule, $t('domain.agreement.file.other'), value),
          },
          contractScanIds: {
            type: 'array',
            required: true,
            trigger: ['change', 'update:value'],
            validator: (rule: FormItemRule, value: number[]) =>
              requireRule(rule, $t('domain.agreement.file.contract'), value),
          },
        }
      : {}) as FormRules, // 关键：强制断言
  }
}

/**
 * 价格模式组件对应的校验规则
 * @param model 对应的表单数据片段
 */
export const createPriceGroupRules = (model: SignInfoDataForUI): FormRules => {
  return {
    priceModel: {
      type: 'number',
      required: true,
      trigger: ['change'], // Select 用 change
      validator: (rule: FormItemRule, value: number) => {
        return requireRule(rule, $t('domain.agreement.field.priceModel'), value)
      },
    },

    priceType: {
      type: 'number',
      trigger: ['change'],
      validator: (rule: FormItemRule, value: number) => {
        if (model.priceModel === PriceModelEnum.Other) return true
        return requireRule(rule, $t('domain.agreement.field.priceType'), value)
      },
    },

    priceCategory: {
      type: 'number',
      trigger: ['change'],
      validator: (rule: FormItemRule, value: number) => {
        if (model.priceModel === PriceModelEnum.Other) return true
        return requireRule(rule, $t('domain.agreement.field.priceCategory'), value)
      },
    },

    fixedPrice: {
      trigger: ['blur'],
      validator: (rule: FormItemRule, value: string) => {
        if (model.priceCategory !== PriceCategoryEnum.FixedPrice) return true
        return requireRule(rule, $t('domain.agreement.field.fixedPrice'), value)
      },
    },

    fixedSpread: {
      trigger: ['blur'],
      validator: (rule: FormItemRule, value: string) => {
        if (model.priceCategory !== PriceCategoryEnum.FixedSpread) return true
        return requireRule(rule, $t('domain.agreement.field.fixedSpread'), value)
      },
    },

    revenueShareRatio: {
      type: 'number',
      trigger: ['blur'],
      validator: (rule: FormItemRule, value: number) => {
        if (model.priceCategory !== PriceCategoryEnum.ShareRatio) return true
        return requireRule(rule, $t('domain.agreement.field.shareRatio'), value)
      },
    },

    comment: {
      trigger: ['blur'],
      validator: (rule: FormItemRule, value: string) => {
        if (model.priceModel !== PriceModelEnum.Other) return true
        return requireRule(rule, $t('common.field.remark'), value)
      },
    },
  } as FormRules
}
export const previewAttachmentsRule = {
  code: {
    trigger: ['blur'],
    required: true,
    validator: (rule: FormItemRule, value: string) =>
      requireRule(rule, $t('domain.agreement.print.code'), value),
  },
}
