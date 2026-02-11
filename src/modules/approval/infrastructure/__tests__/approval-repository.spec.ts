import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useRequest } from '@/modules/shared/infrastructure/useRequest'
import { approvalRepository } from '@/modules/approval/infrastructure/approval-repository'

vi.mock('@/modules/shared/infrastructure/useRequest', () => ({
  useRequest: vi.fn(),
}))

describe('approvalRepository contract', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('claimTask forwards taskId and returns response data', async () => {
    vi.mocked(useRequest).mockResolvedValue({ data: true } as never)

    const result = await approvalRepository.claimTask(888)

    expect(useRequest).toHaveBeenCalledWith({
      url: '/approval/task/claim',
      method: 'post',
      data: 888,
    })
    expect(result).toBe(true)
  })

  it('handleTask forwards dto and returns response data', async () => {
    const payload = {
      id: 101,
      taskId: 888,
    }
    const dto = {
      taskId: 888,
      comment: '同意',
      approved: true,
    }

    vi.mocked(useRequest).mockResolvedValue({ data: payload } as never)

    const result = await approvalRepository.handleTask(dto)

    expect(useRequest).toHaveBeenCalledWith({
      url: '/approval/task/handle',
      method: 'post',
      data: dto,
    })
    expect(result).toEqual(payload)
  })

  it('cancelInstance posts to cancel endpoint and returns response data', async () => {
    vi.mocked(useRequest).mockResolvedValue({ data: true } as never)

    const result = await approvalRepository.cancelInstance(101)

    expect(useRequest).toHaveBeenCalledWith({
      url: '/approval/instance/101/cancel',
      method: 'post',
    })
    expect(result).toBe(true)
  })

  it('getInstancePage forwards page request body and returns response data', async () => {
    const payload = {
      records: [],
      total: 0,
    }
    const pageRequest = {
      page: 1,
      size: 20,
      query: {
        filters: [],
      },
    }

    vi.mocked(useRequest).mockResolvedValue({ data: payload } as never)

    const result = await approvalRepository.getInstancePage(pageRequest as never)

    expect(useRequest).toHaveBeenCalledWith({
      url: '/approval/instance/page',
      method: 'post',
      data: pageRequest,
    })
    expect(result).toEqual(payload)
  })

  it('getInstanceDetail sends instanceId as query params and returns response data', async () => {
    const payload = {
      id: 101,
      taskId: 888,
    }

    vi.mocked(useRequest).mockResolvedValue({ data: payload } as never)

    const result = await approvalRepository.getInstanceDetail(101)

    expect(useRequest).toHaveBeenCalledWith({
      url: '/approval/instance/detail',
      method: 'get',
      params: {
        instanceId: 101,
      },
    })
    expect(result).toEqual(payload)
  })

  it('getHistoryList sends instanceId params and returns response data', async () => {
    const payload = [
      {
        id: 1,
        instanceId: 101,
      },
    ]

    vi.mocked(useRequest).mockResolvedValue({ data: payload } as never)

    const result = await approvalRepository.getHistoryList(101)

    expect(useRequest).toHaveBeenCalledWith({
      url: '/approval/history/list',
      method: 'get',
      params: {
        instanceId: 101,
      },
    })
    expect(result).toEqual(payload)
  })

  it('getLatestAdditionalInfoInstanceStatus fetches status endpoint and returns data', async () => {
    const payload = {
      id: 101,
      status: 'pending',
    }

    vi.mocked(useRequest).mockResolvedValue({ data: payload } as never)

    const result = await approvalRepository.getLatestAdditionalInfoInstanceStatus()

    expect(useRequest).toHaveBeenCalledWith({
      url: '/approval/instance/additional-info/latest/status',
      method: 'get',
    })
    expect(result).toEqual(payload)
  })
})
