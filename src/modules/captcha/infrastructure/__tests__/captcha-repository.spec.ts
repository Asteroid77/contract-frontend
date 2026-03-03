import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useRequest } from '@/modules/shared/infrastructure/useRequest'
import { captchaRepository } from '@/modules/captcha/infrastructure/captcha-repository'
import { $t } from '@/_utils/i18n'

vi.mock('@/modules/shared/infrastructure/useRequest', () => ({
  useRequest: vi.fn(),
}))

vi.mock('@/_utils/i18n', () => ({
  $t: vi.fn((key: string) => key),
}))

describe('captchaRepository contract', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('getCaptcha uses arithmetic endpoint with silent success notify and returns data', async () => {
    const payload = {
      id: 'captcha-1',
      image: 'base64-image',
    }

    vi.mocked(useRequest).mockResolvedValue(payload as never)

    const result = await captchaRepository.getCaptcha()

    expect(useRequest).toHaveBeenCalledWith({
      method: 'GET',
      url: '/captcha/arithmetic',
      notify: {
        success: false,
      },
    })
    expect(result).toEqual(payload)
  })

  it('sendSmsCode posts phone with translated success notification and returns data', async () => {
    const payload = {
      phone: '13800000000',
      bizId: 'biz-1',
    }

    vi.mocked($t).mockImplementation((key: string) => {
      if (key === 'auth.sms.sentSuccess') {
        return '发送成功'
      }
      return key
    })
    vi.mocked(useRequest).mockResolvedValue(payload as never)

    const result = await captchaRepository.sendSmsCode('13800000000')

    expect(useRequest).toHaveBeenCalledWith({
      method: 'POST',
      url: '/captcha/sms/send',
      data: '13800000000',
      notify: {
        success: {
          title: '发送成功',
          type: 'notification',
        },
      },
    })
    expect(result).toEqual(payload)
  })
})
