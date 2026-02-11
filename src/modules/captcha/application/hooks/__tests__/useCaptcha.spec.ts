import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useQuery } from '@tanstack/vue-query'
import { captchaService } from '@/modules/captcha/application/service'
import { withQueryRequestContext } from '@/app/infrastructure/query/query-request-context'
import { useCaptcha } from '@/modules/captcha/application/hooks/useCaptcha'

vi.mock('@tanstack/vue-query', () => ({
  useQuery: vi.fn((options) => options),
}))

vi.mock('@/modules/captcha/application/service', () => ({
  captchaService: {
    getCaptcha: vi.fn(),
  },
}))

vi.mock('@/app/infrastructure/query/query-request-context', () => ({
  withQueryRequestContext: vi.fn((_queryKey, _ctx, runner) => runner()),
}))

describe('useCaptcha', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates query with stable key and wraps queryFn by request context', async () => {
    const payload = {
      id: 'captcha-1',
      image: 'base64-image',
    }
    vi.mocked(captchaService.getCaptcha).mockResolvedValue(payload as never)

    const queryResult = useCaptcha()
    const options = vi.mocked(useQuery).mock.calls[0][0] as any

    expect(options.queryKey).toEqual(['captcha'])

    const signal = new AbortController().signal
    const ctx = {
      queryKey: ['captcha'],
      signal,
    }

    const result = await options.queryFn(ctx)

    expect(withQueryRequestContext).toHaveBeenCalledWith(['captcha'], ctx, expect.any(Function))
    expect(captchaService.getCaptcha).toHaveBeenCalledTimes(1)
    expect(result).toEqual(payload)
    expect(queryResult).toBe(options)
  })
})
