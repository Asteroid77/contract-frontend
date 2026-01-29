import { useQuery } from '@tanstack/vue-query'
import { captchaService } from '@/modules/captcha/application/service'
import type { CaptchaResponse } from '@/modules/captcha/application/models'

/**
 * 获取校验码
 */
export function useCaptcha() {
  return useQuery<CaptchaResponse, unknown, CaptchaResponse>({
    queryKey: ['captcha'],
    queryFn: () => captchaService.getCaptcha(),
  })
}
