import { $t } from '@/_utils/i18n'
import { chinaMobilePhoneVerify } from '@/modules/shared/application/rules/ChinaMobilePhoneNumRule'
import { requireRule } from '@/modules/shared/application/rules/RequireRule'
import type {
  PasswordRecoveryForm,
  RegisterForm,
  SignInForm,
} from '@/modules/user/application/models'
import type { FormRules, FormItemRule } from 'naive-ui'
import type { Ref } from 'vue'

type FormValidationResult<T> = {
  rules: FormRules
  requiredKeys: readonly (keyof T)[]
}

export const loginFormRules: (formValue: Ref<FormInput<SignInForm>>) => FormRules = () => {
  return {
    phone: [
      {
        required: true,
        validator: (rule: FormItemRule, value: string) =>
          requireRule(rule, $t('auth.field.phone'), value),
        trigger: ['blur'],
      },
      {
        validator: (_rule: FormItemRule, value: string) => {
          if (!value) return true
          if (chinaMobilePhoneVerify(value)) {
            return true
          }
          return new Error($t('auth.validation.phoneFormat'))
        },
        trigger: ['blur'],
      },
    ],
    password: [
      {
        required: true,
        validator: (rule: FormItemRule, value: string) =>
          requireRule(rule, $t('auth.field.password'), value),
        trigger: ['blur'],
      },
      {
        validator(rule: FormItemRule, value: string) {
          if (!value) {
            return true
          }
          if (value.length < 8) {
            return new Error($t('auth.validation.passwordMin'))
          }
          if (value.length > 16) {
            return new Error($t('auth.validation.passwordMax'))
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
          requireRule(rule, $t('auth.field.captcha'), value),
        trigger: ['blur'],
      },
    ],
  }
}

export const loginFormValidation = (
  formValue: Ref<FormInput<SignInForm>>,
): FormValidationResult<SignInForm> => {
  return {
    rules: loginFormRules(formValue),
    requiredKeys: ['phone', 'password', 'captcha', 'captchaKey'],
  }
}

export const RegisterStep1FormRule: (formValue: Ref<FormInput<RegisterForm>>) => FormRules = (
  formValue,
) => {
  return {
    phone: [
      {
        required: true,
        validator(rule: FormItemRule, value: string) {
          requireRule(rule, $t('auth.field.phone'), value)
          return true
        },
        trigger: ['blur'],
      },
      {
        validator: (_rule: FormItemRule, value: string) => {
          if (!value) return true
          if (chinaMobilePhoneVerify(value)) {
            return true
          }
          return new Error($t('auth.validation.phoneFormat'))
        },
      },
    ],
    password: [
      {
        required: true,
        validator(rule: FormItemRule, value: string) {
          requireRule(rule, $t('auth.field.password'), value)
          return true
        },
      },
      {
        validator(rule: FormItemRule, value: string) {
          if (value.length < 8) {
            return new Error($t('auth.validation.passwordMin'))
          }
          if (value.length > 16) {
            return new Error($t('auth.validation.passwordMax'))
          }
        },
      },
    ],
    dbCheckPassword: [
      {
        required: true,
        validator(rule: FormItemRule, value: string) {
          requireRule(rule, $t('auth.field.confirmPassword'), value)
          return true
        },
      },
      {
        validator(rule: FormItemRule, value: string) {
          if (value.length < 8) {
            return new Error($t('auth.validation.passwordMin'))
          }
          if (value.length > 16) {
            return new Error($t('auth.validation.passwordMax'))
          }
        },
      },
      {
        validator(rule: FormItemRule, value: string) {
          if (formValue.value.password && formValue.value.password !== value) {
            return new Error($t('auth.validation.passwordMismatch'))
          }
        },
      },
    ],
    code: [
      {
        required: true,
        validator: (rule: FormItemRule, value: string) =>
          requireRule(rule, $t('auth.field.captcha'), value),
        trigger: ['blur'],
      },
    ],
  }
}

export const registerFormValidation = (
  formValue: Ref<FormInput<RegisterForm>>,
): FormValidationResult<RegisterForm> => {
  return {
    rules: RegisterStep1FormRule(formValue),
    requiredKeys: ['phone', 'password', 'dbCheckPassword', 'code', 'bizId'],
  }
}

export const passwordRecoveryFormRules: (
  formValue: Ref<FormInput<PasswordRecoveryForm>>,
) => FormRules = (formValue) => {
  return {
    phone: [
      {
        required: true,
        validator: (rule: FormItemRule, value: string) =>
          requireRule(rule, $t('auth.field.phone'), value),
        trigger: ['blur'],
      },
      {
        validator: (_rule: FormItemRule, value: string) => {
          if (!value) return true
          if (chinaMobilePhoneVerify(value)) {
            return true
          }
          return new Error($t('auth.validation.phoneFormat'))
        },
        trigger: ['blur'],
      },
    ],
    password: [
      {
        required: true,
        validator: (rule: FormItemRule, value: string) =>
          requireRule(rule, $t('auth.field.newPassword'), value),
        trigger: ['blur'],
      },
      {
        validator(rule: FormItemRule, value: string) {
          if (!value) {
            return true
          }
          if (value.length < 8) {
            return new Error($t('auth.validation.passwordMin'))
          }
          if (value.length > 16) {
            return new Error($t('auth.validation.passwordMax'))
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
          requireRule(rule, $t('auth.field.confirmNewPassword'), value),
        trigger: ['blur'],
      },
      {
        validator(rule: FormItemRule, value: string) {
          if (!value) {
            return true
          }
          if (value.length < 8) {
            return new Error($t('auth.validation.passwordMin'))
          }
          if (value.length > 16) {
            return new Error($t('auth.validation.passwordMax'))
          }
          return true
        },
        trigger: ['blur'],
      },
      {
        validator(rule: FormItemRule, value: string) {
          if (!value) return true
          if (value !== formValue.value.password) {
            return new Error($t('auth.validation.passwordMismatch'))
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
          requireRule(rule, $t('auth.field.captcha'), value),
        trigger: ['blur'],
      },
    ],
  }
}

export const passwordRecoveryFormValidation = (
  formValue: Ref<FormInput<PasswordRecoveryForm>>,
): FormValidationResult<PasswordRecoveryForm> => {
  return {
    rules: passwordRecoveryFormRules(formValue),
    requiredKeys: ['phone', 'password', 'dbCheckPassword', 'code', 'bizId'],
  }
}
