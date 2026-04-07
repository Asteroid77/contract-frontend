import { useRequest } from '@/modules/shared/infrastructure/useRequest'
import { $t } from '@/_utils/i18n'
import { createPrefixedEndpoints } from '@/modules/shared/infrastructure/api/api-prefix-generator'
import type { ImageCaptchaResponse, SmsCaptchaResponse } from '../domain/types'

const CAPTCHA_ENDPOINTS = createPrefixedEndpoints('/captcha', {
  ARITHMETIC: '/arithmetic',
  SMS_SEND: '/sms/send',
})

export const captchaRepository = {
  getCaptcha: (): Promise<ImageCaptchaResponse> =>
    useRequest<ImageCaptchaResponse, undefined>({
      method: 'GET',
      url: CAPTCHA_ENDPOINTS.ARITHMETIC,
      authMode: 'passthrough',
      notify: {
        success: false,
      },
    }),
  sendSmsCode: (phone: string): Promise<SmsCaptchaResponse> =>
    useRequest<SmsCaptchaResponse, string>({
      method: 'POST',
      url: CAPTCHA_ENDPOINTS.SMS_SEND,
      data: phone,
      authMode: 'passthrough',
      notify: {
        success: { title: $t('auth.sms.sentSuccess'), type: 'notification' },
      },
    }),
}
