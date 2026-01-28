import { useQuery } from '@tanstack/vue-query'
import { captchaApi } from '@/components/captcha/api/captcha.api'
import type { ServerResponse } from '@/types/request'
import type { CaptchaResponse } from '@/components/captcha/api/captcha'
import type { AxiosError } from 'axios'

/**
 * 获取校验码
 */
export function useCaptcha() {
  return useQuery<
    ServerResponse<CaptchaResponse>,
    AxiosError<ServerResponse<unknown>>,
    CaptchaResponse
  >({
    queryKey: ['captcha'],
    queryFn: () => captchaApi.getCaptcha(),
  })
}
