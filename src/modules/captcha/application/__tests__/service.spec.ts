import { beforeEach, describe, expect, it, vi } from 'vitest'
import { captchaService } from '@/modules/captcha/application/service'
import { captchaRepository } from '@/modules/captcha/infrastructure/captcha-repository'

vi.mock('@/modules/captcha/infrastructure/captcha-repository', () => ({
  captchaRepository: {
    getCaptcha: vi.fn(),
    sendSmsCode: vi.fn(),
  },
}))

describe('captchaService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('getCaptcha delegates to repository and returns payload', async () => {
    const payload = {
      id: 'captcha-1',
      image: 'base64-image',
    }
    vi.mocked(captchaRepository.getCaptcha).mockResolvedValue(payload as never)

    const result = await captchaService.getCaptcha()

    expect(captchaRepository.getCaptcha).toHaveBeenCalledTimes(1)
    expect(result).toEqual(payload)
  })

  it('sendSmsCode delegates phone to repository and returns payload', async () => {
    const payload = {
      phone: '13800000000',
      bizId: 'biz-1',
    }
    vi.mocked(captchaRepository.sendSmsCode).mockResolvedValue(payload as never)

    const result = await captchaService.sendSmsCode('13800000000')

    expect(captchaRepository.sendSmsCode).toHaveBeenCalledWith('13800000000')
    expect(result).toEqual(payload)
  })
})
