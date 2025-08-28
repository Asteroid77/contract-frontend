import { useRequest } from '@/hooks/request/useRequest.ts'
import { $t } from '@/_utils/i18n'
import { createPrefixedEndpoints } from './api-prefix-generator'
import type { CaptchaResponse, SMSSendResponse } from './types/captcha'
export const CAPTCHA_API_ENDPOINT = createPrefixedEndpoints('/captcha', {
  GET_CAPTCHA: '/arithmetic',
  GET_SMS_CODE: '/sms/send',
})

export const captchaApi = {
  getCaptcha: (): Promise<CaptchaResponse> => {
    /**
     * 登录验证码接口
     */
    return useRequest<CaptchaResponse, undefined>({
      method: 'GET',
      url: CAPTCHA_API_ENDPOINT.GET_CAPTCHA,
      notify: {
        success: false,
      },
    })
  },
  /**
   * 手机验证码接口
   * @param {string} phone 手机号
   */
  getSMSCode: (phone: string) => {
    return useRequest<SMSSendResponse, string>({
      method: 'POST',
      url: CAPTCHA_API_ENDPOINT.GET_SMS_CODE,
      data: phone,
      notify: {
        success: { title: $t('captcha.sms.success.title'), type: 'notification' },
      },
    })
  },
}
