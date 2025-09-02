import { $t } from '@/_utils/i18n'
import { chinaMobilePhoneVerify } from '@/_utils/rules/ChinaMobilePhoneNumRule'
import { requireRule } from '@/_utils/rules/RequireRule'
import type { SignInRequest } from '@/types/account'
import type { FormRules, FormItemRule } from 'naive-ui'
import type { Ref } from 'vue'

export const loginFormRules: (formValue: Ref<FormInput<SignInRequest>>) => FormRules = () => {
  return {
    phone: [
      {
        required: true,
        validator: (rule: FormItemRule, value: string) =>
          requireRule(rule, $t('account.phone.text'), value),
        trigger: ['blur'],
      },
      {
        validator: (rule: FormItemRule, value: string) => {
          if (!value) return true
          return chinaMobilePhoneVerify(value)
        },
        message: $t('account.phone.regular'),
        trigger: ['blur'],
      },
    ],
    password: [
      {
        required: true,
        validator: (rule: FormItemRule, value: string) =>
          requireRule(rule, $t('account.password.text'), value),
        trigger: ['blur'],
      },
      {
        validator(rule: FormItemRule, value: string) {
          if (!value) {
            return true
          }
          if (value.length < 8) {
            return new Error($t('account.password.minimum'))
          }
          if (value.length > 16) {
            return new Error($t('account.password.maximum'))
          }
          return true
        },
        trigger: ['blur'],
      },
    ],
    captcha: [
      {
        required: true,
        validator: (rule: FormItemRule, value: string) =>
          requireRule(rule, $t('captcha.text'), value),
        trigger: ['blur'],
      },
    ],
  }
}
