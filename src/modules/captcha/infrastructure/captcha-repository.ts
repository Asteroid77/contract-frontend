import { useRequest } from '@/modules/shared/infrastructure/useRequest'
import { $t } from '@/_utils/i18n'
import { createPrefixedEndpoints } from '@/modules/shared/infrastructure/api/api-prefix-generator'
import type { ServerResponse } from '@/modules/shared/domain/response'
import type { ImageCaptchaResponse, SmsCaptchaResponse } from '../domain/types'

const CAPTCHA_ENDPOINTS = createPrefixedEndpoints('/captcha', {
  ARITHMETIC: '/arithmetic',
  SMS_SEND: '/sms/send',
})

export const captchaRepository = {
  getCaptcha: (): Promise<ImageCaptchaResponse> =>
    useRequest<ServerResponse<ImageCaptchaResponse>, undefined>({
      method: 'GET',
      url: CAPTCHA_ENDPOINTS.ARITHMETIC,
      notify: {
        success: false,
      },
    }).then((resp) => resp.data),
  sendSmsCode: (phone: string): Promise<SmsCaptchaResponse> =>
    useRequest<ServerResponse<SmsCaptchaResponse>, string>({
      method: 'POST',
      url: CAPTCHA_ENDPOINTS.SMS_SEND,
      data: phone,
      notify: {
        success: { title: $t('captcha.sms.success.title'), type: 'notification' },
      },
    }).then((resp) => resp.data),
}
