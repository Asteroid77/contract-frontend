import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import type { FormItemRule, FormRules } from 'naive-ui'
import {
  RegisterStep1FormRule,
  loginFormRules,
  loginFormValidation,
  passwordRecoveryFormRules,
  passwordRecoveryFormValidation,
  registerFormValidation,
} from '@/modules/access/application/validation'
import { chinaMobilePhoneVerify } from '@/modules/shared/application/rules/ChinaMobilePhoneNumRule'
import { requireRule } from '@/modules/shared/application/rules/RequireRule'

vi.mock('@/_utils/i18n', () => ({
  $t: (key: string) => `t:${key}`,
}))

vi.mock('@/modules/shared/application/rules/ChinaMobilePhoneNumRule', () => ({
  chinaMobilePhoneVerify: vi.fn(),
}))

vi.mock('@/modules/shared/application/rules/RequireRule', () => ({
  requireRule: vi.fn(() => true),
}))

const getRuleArray = (rules: FormRules, key: string): FormItemRule[] => {
  const rule = rules[key]
  if (!Array.isArray(rule)) {
    throw new Error(`field ${key} should be an array rule`)
  }
  return rule
}

const getValidator = (
  rule: FormItemRule,
): ((rule: FormItemRule, value: string) => true | Error | undefined) => {
  if (!rule.validator) {
    throw new Error('validator should be defined')
  }

  const validator = rule.validator as (
    inputRule: FormItemRule,
    value: string,
    callback: (errors?: Error[]) => void,
    source: Record<string, unknown>,
    options: Record<string, unknown>,
  ) => true | Error | undefined

  return (inputRule, value) => validator(inputRule, value, () => undefined, {}, {})
}

describe('access validation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('loginFormValidation exposes expected required keys', () => {
    const formRef = ref({} as never)

    const result = loginFormValidation(formRef)

    expect(result.requiredKeys).toEqual(['phone', 'password', 'captcha', 'captchaKey'])
    expect(result.rules).toBeTruthy()
  })

  it('login phone validator uses chinaMobilePhoneVerify and returns format error when invalid', () => {
    vi.mocked(chinaMobilePhoneVerify).mockReturnValue(false)

    const rules = loginFormRules(ref({} as never))
    const phoneFormatValidator = getValidator(getRuleArray(rules, 'phone')[1])

    expect(phoneFormatValidator({}, '')).toBe(true)

    const invalid = phoneFormatValidator({}, '123')
    expect(invalid).toBeInstanceOf(Error)
    expect((invalid as Error).message).toBe('t:auth.validation.phoneFormat')

    vi.mocked(chinaMobilePhoneVerify).mockReturnValue(true)
    expect(phoneFormatValidator({}, '13800138000')).toBe(true)
  })

  it('login password length validator enforces min and max', () => {
    const rules = loginFormRules(ref({} as never))
    const validator = getValidator(getRuleArray(rules, 'password')[1])

    const tooShort = validator({}, '1234567')
    expect(tooShort).toBeInstanceOf(Error)
    expect((tooShort as Error).message).toBe('t:auth.validation.passwordMin')

    const tooLong = validator({}, '12345678901234567')
    expect(tooLong).toBeInstanceOf(Error)
    expect((tooLong as Error).message).toBe('t:auth.validation.passwordMax')

    expect(validator({}, '12345678')).toBe(true)
  })

  it('register and password-recovery validation expose required keys', () => {
    const registerResult = registerFormValidation(ref({ password: 'password1' } as never))
    expect(registerResult.requiredKeys).toEqual([
      'phone',
      'password',
      'dbCheckPassword',
      'code',
      'bizId',
    ])

    const recoveryResult = passwordRecoveryFormValidation(ref({ password: 'password2' } as never))
    expect(recoveryResult.requiredKeys).toEqual([
      'phone',
      'password',
      'dbCheckPassword',
      'code',
      'bizId',
    ])
  })

  it('register and password-recovery confirm-password validators enforce mismatch rules', () => {
    const registerRules = RegisterStep1FormRule(ref({ password: 'password-a' } as never))
    const registerConfirmValidator = getValidator(getRuleArray(registerRules, 'dbCheckPassword')[2])

    const registerMismatch = registerConfirmValidator({}, 'password-b')
    expect(registerMismatch).toBeInstanceOf(Error)
    expect((registerMismatch as Error).message).toBe('t:auth.validation.passwordMismatch')

    expect(registerConfirmValidator({}, 'password-a')).toBeUndefined()

    const recoveryRules = passwordRecoveryFormRules(ref({ password: 'password-a' } as never))
    const recoveryConfirmValidator = getValidator(getRuleArray(recoveryRules, 'dbCheckPassword')[2])

    const recoveryMismatch = recoveryConfirmValidator({}, 'password-b')
    expect(recoveryMismatch).toBeInstanceOf(Error)
    expect((recoveryMismatch as Error).message).toBe('t:auth.validation.passwordMismatch')

    expect(recoveryConfirmValidator({}, 'password-a')).toBe(true)
  })

  it('required-rule validators delegate to requireRule helper', () => {
    const rules = loginFormRules(ref({} as never))
    const phoneRequiredValidator = getValidator(getRuleArray(rules, 'phone')[0])

    phoneRequiredValidator({}, '13800138000')

    expect(requireRule).toHaveBeenCalled()
  })
})
