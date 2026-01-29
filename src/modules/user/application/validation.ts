import { $t } from '@/_utils/i18n'
import type { UserAdditionalInfoRequest } from '@/modules/user/application/models'
import type { FormItemRule, FormRules } from 'naive-ui'
import type { Ref } from 'vue'
import { RegisterType } from '@/modules/user/application/constants'
import { requireRule } from '@/modules/shared/application/rules/RequireRule'

export const UserAdditionalInfoFormRules: (
  formValue: Ref<FormInput<UserAdditionalInfoRequest>>,
) => FormRules = (formValue) => {
  const isLegalRepresentative =
    formValue.value.registerType &&
    formValue.value.registerType === RegisterType.LEGAL_REPRESENTATIVE
  return {
    registerType: [
      {
        required: true,
        trigger: ['blur'],
        validator: (rule: FormItemRule, value: string) =>
          requireRule(rule, $t('account.register.type.text'), value),
      },
    ],
    name: [
      {
        required: true,
        validator: (rule: FormItemRule, value: string) =>
          requireRule(
            rule,
            isLegalRepresentative
              ? $t('account.additionalInfo.companyName')
              : $t('account.additionalInfo.name'),
            value,
          ),
        trigger: ['blur'],
      },
    ],
    pca: [
      {
        required: true,
        validator: (rule: FormItemRule, value: string) =>
          requireRule(rule, $t('account.additionalInfo.pca'), value),
        trigger: ['blur'],
      },
    ],
    identity: [
      {
        required: true,
        validator: (rule: FormItemRule, value: string) =>
          requireRule(
            rule,
            isLegalRepresentative
              ? $t('account.additionalInfo.usci')
              : $t('account.additionalInfo.identity'),
            value,
          ),
        trigger: ['blur'],
      },
      {
        pattern: isLegalRepresentative
          ? /^[0-9A-Z]{18}$/
          : /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/,
        message: isLegalRepresentative
          ? $t('account.additionalInfo.rules.usci')
          : $t('account.additionalInfo.rules.identity'),
        trigger: ['blur'],
      },
    ],
    bankName: [
      {
        required: true,
        validator: (rule: FormItemRule, value: string) =>
          requireRule(rule, $t('account.additionalInfo.bankName'), value),
        trigger: ['blur'],
      },
    ],
    bankAccount: [
      {
        required: true,
        pattern: /^\d{10,19}$/,
        validator: (rule: FormItemRule, value: string) =>
          requireRule(rule, $t('account.additionalInfo.rules.bankAccount'), value),
        trigger: ['blur'],
      },
    ],
    companyAddress: [
      {
        required: isLegalRepresentative,
        validator: (rule: FormItemRule, value: string) =>
          requireRule(rule, $t('account.additionalInfo.companyAddress'), value),
        trigger: ['blur'],
      },
    ],
    contactPerson: [
      {
        required: isLegalRepresentative,
        validator: (rule: FormItemRule, value: string) =>
          requireRule(rule, $t('account.additionalInfo.contactPerson'), value),
        trigger: ['blur'],
      },
    ],
    contactPersonPhone: [
      {
        required: isLegalRepresentative,
        validator: (rule: FormItemRule, value: string) =>
          requireRule(rule, $t('account.additionalInfo.contactPersonPhone'), value),
        trigger: ['blur'],
      },
    ],
  }
}
