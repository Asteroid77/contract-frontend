import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useRequest } from '@/modules/shared/infrastructure/useRequest'
import { invitationRepository } from '@/modules/invitation/infrastructure/invitation-repository'

vi.mock('@/modules/shared/infrastructure/useRequest', () => ({
  useRequest: vi.fn(),
}))

describe('invitationRepository contract', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('createInvitationCode posts to create endpoint and returns data', async () => {
    const payload = { id: 1, code: 'INVITE-1' }
    vi.mocked(useRequest).mockResolvedValue(payload as never)

    const result = await invitationRepository.createInvitationCode()

    expect(useRequest).toHaveBeenCalledWith({ url: '/invitation/create', method: 'POST' })
    expect(result).toEqual(payload)
  })

  it('updateInvitationCode posts forms and returns data', async () => {
    const payload = [{ id: 1, code: 'INVITE-1', remark: 'r1' }]
    const dto = [{ id: 1, remark: 'r1' }]

    vi.mocked(useRequest).mockResolvedValue(payload as never)

    const result = await invitationRepository.updateInvitationCode(dto)

    expect(useRequest).toHaveBeenCalledWith({
      url: '/invitation/update',
      method: 'POST',
      data: dto,
    })
    expect(result).toEqual(payload)
  })

  it('deleteInvitationCode sends ids and returns data', async () => {
    vi.mocked(useRequest).mockResolvedValue(true as never)

    const result = await invitationRepository.deleteInvitationCode([1, 2])

    expect(useRequest).toHaveBeenCalledWith({
      url: '/invitation/delete',
      method: 'DELETE',
      data: [1, 2],
    })
    expect(result).toBe(true)
  })

  it('getInvitationCodeList disables success notify and returns data', async () => {
    const payload = [{ id: 1, code: 'INVITE-1' }]
    vi.mocked(useRequest).mockResolvedValue(payload as never)

    const result = await invitationRepository.getInvitationCodeList()

    expect(useRequest).toHaveBeenCalledWith({
      url: '/invitation/list',
      method: 'GET',
      notify: {
        success: false,
      },
    })
    expect(result).toEqual(payload)
  })

  it('getInvitedCount disables success notify and returns data', async () => {
    vi.mocked(useRequest).mockResolvedValue(3 as never)

    const result = await invitationRepository.getInvitedCount()

    expect(useRequest).toHaveBeenCalledWith({
      url: '/invitation/count',
      method: 'GET',
      notify: {
        success: false,
      },
    })
    expect(result).toBe(3)
  })

  it('getInvitationRecordPage posts page body with silent success notify', async () => {
    const dto = {
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

    vi.mocked(useRequest).mockResolvedValue(payload as never)

    const result = await invitationRepository.getInvitationRecordPage(dto)

    expect(useRequest).toHaveBeenCalledWith({
      url: '/invitation_record/list',
      method: 'POST',
      data: dto,
      notify: {
        success: false,
      },
    })
    expect(result).toEqual(payload)
  })
})
