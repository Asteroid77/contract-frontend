import { useQuery } from '@tanstack/vue-query'
import { captchaService } from '@/modules/captcha/application/service'
import { withQueryRequestContext } from '@/app/infrastructure/query/query-request-context'

/**
 * 获取校验码
 */
export function useCaptcha() {
  return useQuery({
    queryKey: ['captcha'],
    queryFn: (ctx) => withQueryRequestContext(ctx.queryKey, ctx, () => captchaService.getCaptcha()),
  })
}
