import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { RestSmsCd } from '@/app/infrastructure/storage/dexie/defineRestSMSCd'

const {
  useMutationMock,
  sendSmsCodeMock,
  whereMock,
  equalsMock,
  firstMock,
  addMock,
  putMock,
  tMock,
} = vi.hoisted(() => {
  const useMutation = vi.fn((options) => options)
  const sendSmsCode = vi.fn()

  const first = vi.fn<() => Promise<RestSmsCd | undefined>>()
  const equals = vi.fn(() => ({ first }))
  const where = vi.fn(() => ({ equals }))

  const add = vi.fn()
  const put = vi.fn()

  const dict: Record<string, string> = {
    'auth.validation.phoneRequired': '请填写手机号',
    'auth.sms.resendPrefix': '重新发送(',
    'auth.sms.resendSuffix': 's)',
    'common.action.send': '发送',
  }
  const t = vi.fn((key: string) => dict[key] ?? key)

  return {
    useMutationMock: useMutation,
    sendSmsCodeMock: sendSmsCode,
    whereMock: where,
    equalsMock: equals,
    firstMock: first,
    addMock: add,
    putMock: put,
    tMock: t,
  }
})

vi.mock('@tanstack/vue-query', () => ({
  useMutation: useMutationMock,
}))

vi.mock('@/modules/captcha/application/service', () => ({
  captchaService: {
    sendSmsCode: sendSmsCodeMock,
  },
}))

vi.mock('@/app/infrastructure/storage/dexie', () => ({
  default: {
    restcd: {
      where: whereMock,
      add: addMock,
      put: putMock,
    },
  },
}))

vi.mock('@/_utils/i18n', () => ({
  $t: tMock,
}))

const flushPromises = async () => {
  await Promise.resolve()
  await Promise.resolve()
}

const loadUseSMS = async () => {
  const module = await import('@/modules/captcha/application/hooks/useSMS')
  return module.useSMS
}

describe('useSMS', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-02-10T12:00:00.000Z'))
  })

  afterEach(() => {
    vi.clearAllTimers()
    vi.useRealTimers()
  })

  it('getSendBtnLabelText returns phone required text when phone is empty', async () => {
    vi.resetModules()
    const useSMS = await loadUseSMS()

    const { getSendBtnLabelText } = useSMS()
    const label = getSendBtnLabelText('')

    expect(label.value).toBe('请填写手机号')
    expect(whereMock).not.toHaveBeenCalled()
  })

  it('sendSMSCode onSuccess adds new cooldown record when phone record does not exist', async () => {
    vi.resetModules()
    const useSMS = await loadUseSMS()

    const phone = '13800000000'
    const payload = {
      phone,
      bizId: 'biz-1',
    }

    firstMock.mockResolvedValueOnce(undefined).mockResolvedValueOnce(undefined)
    sendSmsCodeMock.mockResolvedValue(payload)

    const { getSMSCoolDownSecond, sendSMSCode } = useSMS()
    const cooldown = getSMSCoolDownSecond(phone)
    await flushPromises()

    const mutation = sendSMSCode() as any
    const result = await mutation.mutationFn(phone)
    expect(result).toEqual(payload)

    await mutation.onSuccess(payload, phone)

    expect(whereMock).toHaveBeenCalledWith('phone')
    expect(equalsMock).toHaveBeenCalledWith(phone)
    expect(sendSmsCodeMock).toHaveBeenCalledWith(phone)
    expect(addMock).toHaveBeenCalledWith({
      phone,
      time: expect.any(Date),
    })
    expect(putMock).not.toHaveBeenCalled()
    expect(cooldown.value).toBe(60)
  })

  it('sendSMSCode onSuccess updates existing cooldown record when phone exists', async () => {
    vi.resetModules()
    const useSMS = await loadUseSMS()

    const phone = '13800000000'
    const payload = {
      phone,
      bizId: 'biz-2',
    }

    firstMock
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce({
        id: 7,
        phone,
        time: new Date('2026-02-10T11:58:00.000Z'),
      })
    sendSmsCodeMock.mockResolvedValue(payload)

    const { getSMSCoolDownSecond, sendSMSCode } = useSMS()
    getSMSCoolDownSecond(phone)
    await flushPromises()

    const mutation = sendSMSCode() as any
    await mutation.onSuccess(payload, phone)

    expect(putMock).toHaveBeenCalledWith({
      id: 7,
      phone,
      time: expect.any(Date),
    })
    expect(addMock).not.toHaveBeenCalled()
  })

  it('getSMSCoolDownSecond reuses in-memory countdown and does not query twice', async () => {
    vi.resetModules()
    const useSMS = await loadUseSMS()

    const phone = '13800000000'
    firstMock.mockResolvedValueOnce({
      id: 1,
      phone,
      time: new Date('2026-02-10T11:59:30.000Z'),
    })

    const { getSMSCoolDownSecond, getSendBtnLabelText } = useSMS()
    const cooldownA = getSMSCoolDownSecond(phone)
    await flushPromises()

    expect(cooldownA.value).toBe(30)

    const label = getSendBtnLabelText(phone)
    expect(label.value).toBe('重新发送(30s)')

    const cooldownB = getSMSCoolDownSecond(phone)
    expect(cooldownB).toBe(cooldownA)
    expect(whereMock).toHaveBeenCalledTimes(1)

    vi.advanceTimersByTime(1000)
    expect(cooldownA.value).toBe(29)
  })
})
