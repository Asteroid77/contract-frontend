import { $t } from '@/_utils/i18n'
import { chinaMobilePhoneVerify } from '@/modules/shared/application/rules/ChinaMobilePhoneNumRule'
import { requireRule } from '@/modules/shared/application/rules/RequireRule'
import type { PasswordRecoveryRequest, RegisterRequest, SignInRequest } from '@/modules/user/application/models'
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

export const passwordRecoveryFormRules: (
  formValue: Ref<FormInput<PasswordRecoveryRequest>>,
) => FormRules = (formValue) => {
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
          requireRule(rule, $t('account.password.new'), value),
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
    dbCheckPassword: [
      {
        required: true,
        validator: (rule: FormItemRule, value: string) =>
          requireRule(rule, $t('account.password.dbCheck.new.text'), value),
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
      {
        validator(rule: FormItemRule, value: string) {
          if (!value) return true
          if (value !== formValue.value.password) {
            return new Error($t('account.password.dbCheck.error.text'))
          }
          return true
        },
        trigger: ['blur'],
      },
    ],
    code: [
      {
        required: true,
        validator: (rule: FormItemRule, value: string) =>
          requireRule(rule, $t('captcha.text'), value),
        trigger: ['blur'],
      },
    ],
  }
}
