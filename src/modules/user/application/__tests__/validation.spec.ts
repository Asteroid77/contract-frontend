import { describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import {
  UserAdditionalInfoFormRules,
  UserAdditionalInfoFormValidation,
  getUserAdditionalInfoRequiredKeys,
} from '@/modules/user/application/validation'
import { RegisterType } from '@/modules/user/application/constants'

vi.mock('@/_utils/i18n', () => ({
  $t: (key: string) => `t:${key}`,
}))

describe('user additional info validation', () => {
  it('returns required keys based on registerType', () => {
    const individualRequired = getUserAdditionalInfoRequiredKeys({
      registerType: RegisterType.INDIVIDUAL,
    } as never)

    expect(individualRequired).toEqual([
      'registerType',
      'name',
      'pca',
      'identity',
      'bankName',
      'bankAccount',
    ])

    const legalRequired = getUserAdditionalInfoRequiredKeys({
      registerType: RegisterType.LEGAL_REPRESENTATIVE,
    } as never)

    expect(legalRequired).toEqual([
      'registerType',
      'name',
      'pca',
      'identity',
      'bankName',
      'bankAccount',
      'companyAddress',
      'contactPerson',
      'contactPersonPhone',
    ])
  })

  it('marks company/contact fields required only for legal representative', () => {
    const legalRules = UserAdditionalInfoFormRules(
      ref({ registerType: RegisterType.LEGAL_REPRESENTATIVE } as never),
    )
    expect((legalRules.companyAddress as any)[0].required).toBe(true)
    expect((legalRules.contactPerson as any)[0].required).toBe(true)
    expect((legalRules.contactPersonPhone as any)[0].required).toBe(true)

    const individualRules = UserAdditionalInfoFormRules(ref({ registerType: RegisterType.INDIVIDUAL } as never))
    expect((individualRules.companyAddress as any)[0].required).toBe(false)
    expect((individualRules.contactPerson as any)[0].required).toBe(false)
    expect((individualRules.contactPersonPhone as any)[0].required).toBe(false)
  })

  it('validates legal representative identity as 18 uppercase alnum code', () => {
    const rules = UserAdditionalInfoFormRules(ref({ registerType: RegisterType.LEGAL_REPRESENTATIVE } as never))
    const validator = (rules.identity as any)[1].validator as (rule: unknown, value: string) => true | Error

    expect(validator({}, '91310000ABCDEFGH12')).toBe(true)

    const invalid = validator({}, 'invalid-usci')
    expect(invalid).toBeInstanceOf(Error)
    expect((invalid as Error).message).toBe('t:domain.user.validation.usci')
  })

  it('validates individual identity as citizen id-card format', () => {
    const rules = UserAdditionalInfoFormRules(ref({ registerType: RegisterType.INDIVIDUAL } as never))
    const validator = (rules.identity as any)[1].validator as (rule: unknown, value: string) => true | Error

    expect(validator({}, '11010519491231002X')).toBe(true)

    const invalid = validator({}, 'invalid-id')
    expect(invalid).toBeInstanceOf(Error)
    expect((invalid as Error).message).toBe('t:domain.user.validation.identity')
  })

  it('UserAdditionalInfoFormValidation returns both rules and requiredKeys', () => {
    const formRef = ref({
      registerType: RegisterType.LEGAL_REPRESENTATIVE,
    } as never)

    const result = UserAdditionalInfoFormValidation(formRef)

    expect(result.rules).toBeTruthy()
    expect(result.requiredKeys).toContain('companyAddress')
    expect(result.requiredKeys).toContain('contactPerson')
    expect(result.requiredKeys).toContain('contactPersonPhone')
  })
})
