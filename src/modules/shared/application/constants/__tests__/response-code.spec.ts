import { describe, expect, it } from 'vitest'
import { ResponseCode } from '@/modules/shared/application/constants/response-code'

describe('ResponseCode', () => {
  it('contains key success and common system/user/oauth codes', () => {
    expect(ResponseCode.SUCCESS).toBe(10000)
    expect(ResponseCode.SYSTEM_ERROR).toBe(10001)
    expect(ResponseCode.PARAM_ERROR).toBe(10002)

    expect(ResponseCode.AUTH_ACCESS_TOKEN_EXPIRED).toBe(20005)
    expect(ResponseCode.AUTH_REFRESH_GRANT_INVALID).toBe(20008)
    expect(ResponseCode.AUTH_REQUEST_ORIGIN_INVALID).toBe(20009)
    expect(ResponseCode.USER_NOT_FOUND).toBe(30001)
    expect(ResponseCode.CAPTCHA_INVALID).toBe(50001)
  })

  it('contains device/session related approval and sign codes', () => {
    expect(ResponseCode.APPROVAL_TASK_NOT_EXIST).toBe(80001)
    expect(ResponseCode.APPROVAL_INSTANCE_NOT_EXIST).toBe(90001)
    expect(ResponseCode.SIGN_NOT_FOUND).toBe(140001)
    expect(ResponseCode.SIGN_USER_NO_PERMISSION).toBe(140002)
    expect(ResponseCode.FILE_UPLOAD_TICKET_INVALID).toBe(130006)
  })
})
