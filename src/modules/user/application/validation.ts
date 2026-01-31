import { $t } from '@/_utils/i18n'
import type { UserAdditionalInfoForm } from '@/modules/user/application/models'
import type { FormItemRule, FormRules } from 'naive-ui'
import type { Ref } from 'vue'
import { RegisterType } from '@/modules/user/application/constants'
import { requireRule } from '@/modules/shared/application/rules/RequireRule'

type FormValidationResult<T> = {
  rules: FormRules
  requiredKeys: readonly (keyof T)[]
}

export const UserAdditionalInfoFormRules: (
  formValue: Ref<FormInput<UserAdditionalInfoForm>>,
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
          requireRule(rule, $t('auth.register.type'), value),
      },
    ],
    name: [
      {
        required: true,
        validator: (rule: FormItemRule, value: string) =>
          requireRule(
            rule,
            isLegalRepresentative
              ? $t('domain.user.field.companyName')
              : $t('domain.user.field.name'),
            value,
          ),
        trigger: ['blur'],
      },
    ],
    pca: [
      {
        required: true,
        validator: (rule: FormItemRule, value: string) =>
          requireRule(rule, $t('domain.user.field.region'), value),
        trigger: ['blur'],
      },
    ],
    identity: [
      {
        required: true,
        validator: (rule: FormItemRule, value: string) =>
          requireRule(
            rule,
            isLegalRepresentative ? $t('domain.user.field.usci') : $t('domain.user.field.identity'),
            value,
          ),
        trigger: ['blur'],
      },
      {
        pattern: isLegalRepresentative
          ? /^[0-9A-Z]{18}$/
          : /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/,
        message: isLegalRepresentative
          ? $t('domain.user.validation.usci')
          : $t('domain.user.validation.identity'),
        trigger: ['blur'],
      },
    ],
    bankName: [
      {
        required: true,
        validator: (rule: FormItemRule, value: string) =>
          requireRule(rule, $t('domain.user.field.bankName'), value),
        trigger: ['blur'],
      },
    ],
    bankAccount: [
      {
        required: true,
        pattern: /^\d{10,19}$/,
        validator: (rule: FormItemRule, value: string) =>
          requireRule(rule, $t('domain.user.validation.bankAccount'), value),
        trigger: ['blur'],
      },
    ],
    companyAddress: [
      {
        required: isLegalRepresentative,
        validator: (rule: FormItemRule, value: string) =>
          requireRule(rule, $t('domain.user.field.companyAddress'), value),
        trigger: ['blur'],
      },
    ],
    contactPerson: [
      {
        required: isLegalRepresentative,
        validator: (rule: FormItemRule, value: string) =>
          requireRule(rule, $t('domain.user.field.contactPerson'), value),
        trigger: ['blur'],
      },
    ],
    contactPersonPhone: [
      {
        required: isLegalRepresentative,
        validator: (rule: FormItemRule, value: string) =>
          requireRule(rule, $t('domain.user.field.contactPhone'), value),
        trigger: ['blur'],
      },
    ],
  }
}

export const getUserAdditionalInfoRequiredKeys = (
  formValue: FormInput<UserAdditionalInfoForm>,
): (keyof UserAdditionalInfoForm)[] => {
  const isLegalRepresentative =
    formValue.registerType && formValue.registerType === RegisterType.LEGAL_REPRESENTATIVE
  const requiredKeys: (keyof UserAdditionalInfoForm)[] = [
    'registerType',
    'name',
    'pca',
    'identity',
    'bankName',
    'bankAccount',
  ]
  if (isLegalRepresentative) {
    requiredKeys.push('companyAddress', 'contactPerson', 'contactPersonPhone')
  }
  return requiredKeys
}

export const UserAdditionalInfoFormValidation = (
  formValue: Ref<FormInput<UserAdditionalInfoForm>>,
): FormValidationResult<UserAdditionalInfoForm> => {
  return {
    rules: UserAdditionalInfoFormRules(formValue),
    requiredKeys: getUserAdditionalInfoRequiredKeys(formValue.value),
  }
}
