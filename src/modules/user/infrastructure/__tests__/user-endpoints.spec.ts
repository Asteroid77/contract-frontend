import { describe, expect, it } from 'vitest'
import { USER_ENDPOINTS } from '@/modules/user/infrastructure/user-endpoints'

describe('user-endpoints', () => {
  it('exposes all user endpoints with /user prefix', () => {
    expect(USER_ENDPOINTS.LOGIN).toBe('/user/login')
    expect(USER_ENDPOINTS.REGISTER).toBe('/user/register')
    expect(USER_ENDPOINTS.ME).toBe('/user/me')
    expect(USER_ENDPOINTS.PASSWORD_CHANGE).toBe('/user/password/change')
    expect(USER_ENDPOINTS.DEVICES).toBe('/user/devices')
    expect(USER_ENDPOINTS.DEVICES_REVOKE).toBe('/user/devices/revoke')
    expect(USER_ENDPOINTS.ADDITIONAL_INFO_PUT).toBe('/user/additional_info/put')
    expect(USER_ENDPOINTS.PAGE).toBe('/user/page')
    expect(USER_ENDPOINTS.PASSWORD_RECOVERY).toBe('/user/password/recovery')
  })
})
