import { useRequest } from '@/hooks/request/useRequest.ts'
import { $t } from '@/_utils/i18n'
import { createPrefixedEndpoints } from '../../../_utils/api/api-prefix-generator'
import type { CaptchaResponse, SMSSendResponse } from './captcha'
import type { ServerResponse } from '@/types/request'
export const CAPTCHA_API_ENDPOINT = createPrefixedEndpoints('/captcha', {
  GET_CAPTCHA: '/arithmetic',
  GET_SMS_CODE: '/sms/send',
})

export const captchaApi = {
  getCaptcha: (): Promise<ServerResponse<CaptchaResponse>> => {
    /**
     * 登录验证码接口
     */
    return useRequest<ServerResponse<CaptchaResponse>, undefined>({
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
    return useRequest<ServerResponse<SMSSendResponse>, string>({
      method: 'POST',
      url: CAPTCHA_API_ENDPOINT.GET_SMS_CODE,
      data: phone,
      notify: {
        success: { title: $t('captcha.sms.success.title'), type: 'notification' },
      },
    })
  },
}
