import { beforeEach, describe, expect, it, vi } from 'vitest'
import { invitationService } from '@/modules/invitation/application/service'
import { invitationRepository } from '@/modules/invitation/infrastructure/invitation-repository'
import { toDomainPageRequest } from '@/modules/shared/application/query/legacy-query-adapter'

vi.mock('@/modules/invitation/infrastructure/invitation-repository', () => ({
  invitationRepository: {
    createInvitationCode: vi.fn(),
    updateInvitationCode: vi.fn(),
    deleteInvitationCode: vi.fn(),
    getInvitationCodeList: vi.fn(),
    getInvitedCount: vi.fn(),
    getInvitationRecordPage: vi.fn(),
  },
}))

vi.mock('@/modules/shared/application/query/legacy-query-adapter', () => ({
  toDomainPageRequest: vi.fn(),
}))

describe('invitationService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('passes through create/update/delete/list/count methods', async () => {
    vi.mocked(invitationRepository.createInvitationCode).mockResolvedValue({ id: 1 } as never)
    vi.mocked(invitationRepository.updateInvitationCode).mockResolvedValue([{ id: 1 }] as never)
    vi.mocked(invitationRepository.deleteInvitationCode).mockResolvedValue(true)
    vi.mocked(invitationRepository.getInvitationCodeList).mockResolvedValue([{ id: 1 }] as never)
    vi.mocked(invitationRepository.getInvitedCount).mockResolvedValue(5)

    await expect(invitationService.createInvitationCode()).resolves.toEqual({ id: 1 })
    await expect(invitationService.updateInvitationCode([{ id: 1, remark: 'x' }])).resolves.toEqual([
      { id: 1 },
    ])
    await expect(invitationService.deleteInvitationCode([1])).resolves.toBe(true)
    await expect(invitationService.getInvitationCodeList()).resolves.toEqual([{ id: 1 }])
    await expect(invitationService.getInvitedCount()).resolves.toBe(5)

    expect(invitationRepository.createInvitationCode).toHaveBeenCalledTimes(1)
    expect(invitationRepository.updateInvitationCode).toHaveBeenCalledWith([{ id: 1, remark: 'x' }])
    expect(invitationRepository.deleteInvitationCode).toHaveBeenCalledWith([1])
    expect(invitationRepository.getInvitationCodeList).toHaveBeenCalledTimes(1)
    expect(invitationRepository.getInvitedCount).toHaveBeenCalledTimes(1)
  })

  it('maps page request via legacy adapter before querying record page', async () => {
    const pageRequest = {
      page: 1,
      size: 20,
      query: {
        createdTime: {
          condition: 'like',
          value: '2026',
        },
      },
    }
    const mapped = {
      page: 1,
      size: 20,
      query: {
        filters: [],
      },
    }
    const payload = {
      records: [],
      total: 0,
    }

    vi.mocked(toDomainPageRequest).mockReturnValue(mapped as never)
    vi.mocked(invitationRepository.getInvitationRecordPage).mockResolvedValue(payload as never)

    const result = await invitationService.getInvitationRecordPage(pageRequest as never)

    expect(toDomainPageRequest).toHaveBeenCalledWith(pageRequest)
    expect(invitationRepository.getInvitationRecordPage).toHaveBeenCalledWith(mapped)
    expect(result).toEqual(payload)
  })
})
