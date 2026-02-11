import { describe, expect, it } from 'vitest'
import {
  convertUIToPasswordRecoveryForm,
  convertUIToRegisterForm,
  convertUIToSignInForm,
  convertUIToUserAdditionalInfoForm,
  createSignInModel,
} from '@/modules/user/application/ui-mappers'

describe('user ui-mappers', () => {
  it('createSignInModel returns defaults and merges partial values', () => {
    expect(createSignInModel()).toEqual({
      phone: '',
      password: '',
      captcha: '',
      captchaKey: '',
      remember: false,
    })

    expect(
      createSignInModel({
        phone: '13800138000',
        remember: true,
      }),
    ).toEqual({
      phone: '13800138000',
      password: '',
      captcha: '',
      captchaKey: '',
      remember: true,
    })
  })

  it('convertUIToSignInForm trims phone/captcha but keeps password', () => {
    const result = convertUIToSignInForm({
      phone: ' 13800138000 ',
      password: '  secret  ',
      captcha: ' 1234 ',
      captchaKey: 'captcha-key',
      remember: true,
    })

    expect(result).toEqual({
      phone: '13800138000',
      password: '  secret  ',
      captcha: '1234',
      captchaKey: 'captcha-key',
      remember: true,
    })
  })

  it('convertUIToRegisterForm and convertUIToPasswordRecoveryForm trim expected fields', () => {
    const registerResult = convertUIToRegisterForm({
      phone: ' 13800138000 ',
      password: 'pwd',
      code: ' 6666 ',
      bizId: 'biz-1',
      dbCheckPassword: 'pwd',
    })

    expect(registerResult).toEqual({
      phone: '13800138000',
      password: 'pwd',
      code: '6666',
      bizId: 'biz-1',
      dbCheckPassword: 'pwd',
    })

    const recoveryResult = convertUIToPasswordRecoveryForm({
      phone: ' 13900000000 ',
      password: 'pwd2',
      dbCheckPassword: 'pwd2',
      code: ' 1234 ',
      bizId: 'biz-2',
    })

    expect(recoveryResult).toEqual({
      phone: '13900000000',
      password: 'pwd2',
      dbCheckPassword: 'pwd2',
      code: '1234',
      bizId: 'biz-2',
    })
  })

  it('convertUIToUserAdditionalInfoForm trims required and optional string fields', () => {
    const result = convertUIToUserAdditionalInfoForm({
      id: 11,
      registerType: 1,
      name: '  ACME  ',
      userId: 9,
      bankName: ' Bank ',
      bankAccount: ' 62220000 ',
      invitationCode: ' INV ',
      companyAddress: ' Shanghai ',
      pca: 'shanghai',
      contactPerson: ' Alice ',
      contactPersonPhone: ' 13800138000 ',
      identity: ' 91310000ABCDEFGH12 ',
      referrer: 100,
    })

    expect(result).toEqual({
      id: 11,
      registerType: 1,
      name: 'ACME',
      userId: 9,
      bankName: 'Bank',
      bankAccount: '62220000',
      invitationCode: 'INV',
      companyAddress: 'Shanghai',
      pca: 'shanghai',
      contactPerson: 'Alice',
      contactPersonPhone: '13800138000',
      identity: '91310000ABCDEFGH12',
      referrer: 100,
    })
  })
})
