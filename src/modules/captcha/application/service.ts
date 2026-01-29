import type { CaptchaResponse, SMSSendResponse } from './models'
import { captchaRepository } from '../infrastructure/captcha-repository'

export const captchaService = {
  getCaptcha: (): Promise<CaptchaResponse> => captchaRepository.getCaptcha(),
  sendSmsCode: (phone: string): Promise<SMSSendResponse> =>
    captchaRepository.sendSmsCode(phone),
}
