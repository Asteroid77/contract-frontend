import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useRequest } from '@/modules/shared/infrastructure/useRequest'
import { totpRepository } from '@/modules/user/infrastructure/totp-repository'
import { TOTP_ENDPOINTS } from '@/modules/user/infrastructure/totp-endpoints'

vi.mock('@/modules/shared/infrastructure/useRequest', () => ({
  useRequest: vi.fn(),
}))

describe('totpRepository contract', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('verify forwards dto with credentialed request and returns response data', async () => {
    const payload = { token: 'access-token' }
    const dto = {
      twoFactorToken: '2fa-token',
      code: '123456',
      rememberMe: true,
      rememberDevice: false,
    }

    vi.mocked(useRequest).mockResolvedValue(payload as never)

    const result = await totpRepository.verify(dto)

    expect(useRequest).toHaveBeenCalledWith({
      method: 'POST',
      url: TOTP_ENDPOINTS.VERIFY,
      data: dto,
      authMode: 'passthrough',
      withCredentials: true,
    })
    expect(result).toEqual(payload)
  })
})
