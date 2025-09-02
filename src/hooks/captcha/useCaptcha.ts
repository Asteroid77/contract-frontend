import { useQuery } from '@tanstack/vue-query'
import { captchaApi } from '@/api/captcha.api.ts'

/**
 * 获取校验码
 */
export function useCaptcha() {
  return useQuery({
    queryKey: ['captcha'],
    queryFn: () => captchaApi.getCaptcha(),
  })
}
