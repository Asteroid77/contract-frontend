import { describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import type { FormItemRule, FormRules } from 'naive-ui'
import {
  UserAdditionalInfoFormRules,
  UserAdditionalInfoFormValidation,
  getUserAdditionalInfoRequiredKeys,
} from '@/modules/user/application/validation'
import { RegisterType } from '@/modules/user/application/constants'

vi.mock('@/_utils/i18n', () => ({
  $t: (key: string) => `t:${key}`,
}))

const getRuleArray = (rules: FormRules, key: string): FormItemRule[] => {
  const rule = rules[key]
  if (!Array.isArray(rule)) {
    throw new Error(`field ${key} should be an array rule`)
  }
  return rule
}

const getValidator = (rule: FormItemRule): ((inputRule: FormItemRule, value: string) => true | Error) => {
  if (!rule.validator) {
    throw new Error('validator should be defined')
  }
  return (inputRule, value) => rule.validator!(inputRule, value) as true | Error
}

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
    expect(getRuleArray(legalRules, 'companyAddress')[0].required).toBe(true)
    expect(getRuleArray(legalRules, 'contactPerson')[0].required).toBe(true)
    expect(getRuleArray(legalRules, 'contactPersonPhone')[0].required).toBe(true)

    const individualRules = UserAdditionalInfoFormRules(ref({ registerType: RegisterType.INDIVIDUAL } as never))
    expect(getRuleArray(individualRules, 'companyAddress')[0].required).toBe(false)
    expect(getRuleArray(individualRules, 'contactPerson')[0].required).toBe(false)
    expect(getRuleArray(individualRules, 'contactPersonPhone')[0].required).toBe(false)
  })

  it('validates legal representative identity as 18 uppercase alnum code', () => {
    const rules = UserAdditionalInfoFormRules(ref({ registerType: RegisterType.LEGAL_REPRESENTATIVE } as never))
    const validator = getValidator(getRuleArray(rules, 'identity')[1])

    expect(validator({}, '91310000ABCDEFGH12')).toBe(true)

    const invalid = validator({}, 'invalid-usci')
    expect(invalid).toBeInstanceOf(Error)
    expect((invalid as Error).message).toBe('t:domain.user.validation.usci')
  })

  it('validates individual identity as citizen id-card format', () => {
    const rules = UserAdditionalInfoFormRules(ref({ registerType: RegisterType.INDIVIDUAL } as never))
    const validator = getValidator(getRuleArray(rules, 'identity')[1])

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
