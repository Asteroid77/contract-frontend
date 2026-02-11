import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
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
    const phoneFormatValidator = (rules.phone as any)[1].validator as (
      rule: unknown,
      value: string,
    ) => true | Error

    expect(phoneFormatValidator({}, '')).toBe(true)

    const invalid = phoneFormatValidator({}, '123')
    expect(invalid).toBeInstanceOf(Error)
    expect((invalid as Error).message).toBe('t:auth.validation.phoneFormat')

    vi.mocked(chinaMobilePhoneVerify).mockReturnValue(true)
    expect(phoneFormatValidator({}, '13800138000')).toBe(true)
  })

  it('login password length validator enforces min and max', () => {
    const rules = loginFormRules(ref({} as never))
    const validator = (rules.password as any)[1].validator as (
      rule: unknown,
      value: string,
    ) => true | Error

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
    expect(registerResult.requiredKeys).toEqual(['phone', 'password', 'dbCheckPassword', 'code', 'bizId'])

    const recoveryResult = passwordRecoveryFormValidation(ref({ password: 'password2' } as never))
    expect(recoveryResult.requiredKeys).toEqual(['phone', 'password', 'dbCheckPassword', 'code', 'bizId'])
  })

  it('register and password-recovery confirm-password validators enforce mismatch rules', () => {
    const registerRules = RegisterStep1FormRule(ref({ password: 'password-a' } as never))
    const registerConfirmValidator = (registerRules.dbCheckPassword as any)[2].validator as (
      rule: unknown,
      value: string,
    ) => void | Error

    const registerMismatch = registerConfirmValidator({}, 'password-b')
    expect(registerMismatch).toBeInstanceOf(Error)
    expect((registerMismatch as Error).message).toBe('t:auth.validation.passwordMismatch')

    expect(registerConfirmValidator({}, 'password-a')).toBeUndefined()

    const recoveryRules = passwordRecoveryFormRules(ref({ password: 'password-a' } as never))
    const recoveryConfirmValidator = (recoveryRules.dbCheckPassword as any)[2].validator as (
      rule: unknown,
      value: string,
    ) => true | Error

    const recoveryMismatch = recoveryConfirmValidator({}, 'password-b')
    expect(recoveryMismatch).toBeInstanceOf(Error)
    expect((recoveryMismatch as Error).message).toBe('t:auth.validation.passwordMismatch')

    expect(recoveryConfirmValidator({}, 'password-a')).toBe(true)
  })

  it('required-rule validators delegate to requireRule helper', () => {
    const rules = loginFormRules(ref({} as never))
    const phoneRequiredValidator = (rules.phone as any)[0].validator as (
      rule: unknown,
      value: string,
    ) => true | Error

    phoneRequiredValidator({}, '13800138000')

    expect(requireRule).toHaveBeenCalled()
  })
})
