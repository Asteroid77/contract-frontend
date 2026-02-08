import { useQuery } from '@tanstack/vue-query'
import { captchaService } from '@/modules/captcha/application/service'
import type { CaptchaResponse } from '@/modules/captcha/application/models'
import { withQueryRequestContext } from '@/app/infrastructure/query/query-request-context'

/**
 * 获取校验码
 */
export function useCaptcha() {
  return useQuery<CaptchaResponse, unknown, CaptchaResponse>({
    queryKey: ['captcha'],
    queryFn: (ctx) => withQueryRequestContext(ctx.queryKey, ctx, () => captchaService.getCaptcha()),
  })
}
