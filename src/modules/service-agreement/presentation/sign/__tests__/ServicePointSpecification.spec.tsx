import { beforeEach, describe, expect, it, vi } from 'vitest'

const { dialogCreateSpy } = vi.hoisted(() => ({
  dialogCreateSpy: vi.fn(),
}))

vi.mock('@/_utils/i18n', () => ({
  $t: vi.fn((key: string) => key),
}))

vi.mock('@/_utils/discrete_naive_api', () => ({
  dialog: {
    create: dialogCreateSpy,
  },
}))

import { motivateSPS } from '@/modules/service-agreement/presentation/sign/ServicePointSpecification'

describe('motivateSPS', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates edit dialog and uses cloned initial data on positive click', async () => {
    const callback = vi.fn((formValue: Record<string, unknown>) => {
      void formValue
      return true
    })
    const data = {
      id: 1,
      agreementId: 100,
      serviceAccount: 'A001',
      transformerCapacity: 100,
      electricityConsumptionType: 1,
      voltageClass: '10kV',
    }

    motivateSPS(callback as never, data as never)

    expect(dialogCreateSpy).toHaveBeenCalledTimes(1)
    const config = dialogCreateSpy.mock.calls[0][0]
    expect(config.title).toBe('domain.servicePoint.field.accountNo: common.action.edit')
    expect(config.negativeText).toBe('common.action.cancel')
    expect(config.positiveText).toBe('common.action.confirm')

    data.serviceAccount = 'CHANGED'
    const result = await config.onPositiveClick()

    expect(result).toBe(true)
    expect(callback).toHaveBeenCalledTimes(1)
    const firstArg = callback.mock.calls[0]?.[0]
    expect((firstArg as { serviceAccount?: string } | undefined)?.serviceAccount).toBe('A001')
  })

  it('creates add dialog and returns callback result', async () => {
    const callback = vi.fn((formValue: Record<string, unknown>) => {
      void formValue
      return false
    })

    motivateSPS(callback as never)

    expect(dialogCreateSpy).toHaveBeenCalledTimes(1)
    const config = dialogCreateSpy.mock.calls[0][0]
    expect(config.title).toBe('domain.servicePoint.field.accountNo: common.action.add')

    const result = await config.onPositiveClick()

    expect(result).toBe(false)
    expect(callback).toHaveBeenCalledTimes(1)
    const firstArg = callback.mock.calls[0]?.[0]
    expect(Object.keys((firstArg as Record<string, unknown> | undefined) ?? {})).toHaveLength(0)
  })
})
