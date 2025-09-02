import { $t } from '@/_utils/i18n'
import { chinaMobilePhoneVerify } from '@/_utils/rules/ChinaMobilePhoneNumRule'
import { requireRule } from '@/_utils/rules/RequireRule'
import type { RegisterRequest } from '@/types/account'
import type { FormRules, FormItemRule } from 'naive-ui'
import type { Ref } from 'vue'

export const RegisterStep1FormRule: (formValue: Ref<FormInput<RegisterRequest>>) => FormRules = (
  formValue,
) => {
  return {
    phone: [
      {
        required: true,
        validator(rule: FormItemRule, value: string) {
          requireRule(rule, $t('account.phone.text'), value)
          return true
        },
        trigger: ['blur'],
      },
      {
        validator: (rule: FormItemRule, value: string) => chinaMobilePhoneVerify(value),
        message: $t('account.phone.regular'),
      },
    ],
    password: [
      {
        required: true,
        validator(rule: FormItemRule, value: string) {
          requireRule(rule, $t('account.password.text'), value)
          return true
        },
      },
      {
        validator(rule: FormItemRule, value: string) {
          if (value.length < 8) {
            return new Error($t('account.password.minimum'))
          }
          if (value.length > 16) {
            return new Error($t('account.password.maximum'))
          }
        },
      },
    ],
    dbCheckPassword: [
      {
        required: true,
        validator(rule: FormItemRule, value: string) {
          requireRule(rule, $t('account.password.dbCheck.normal.text'), value)
          return true
        },
      },
      {
        validator(rule: FormItemRule, value: string) {
          if (value.length < 8) {
            return new Error($t('account.password.minimum'))
          }
          if (value.length > 16) {
            return new Error($t('account.password.maximum'))
          }
        },
      },
      {
        validator(rule: FormItemRule, value: string) {
          if (formValue.value.password && formValue.value.password !== value) {
            return new Error($t('account.password.dbCheck.error.text'))
          }
        },
      },
    ],
  }
}
