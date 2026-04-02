import { beforeEach, describe, expect, it, vi } from 'vitest'
import { approvalService } from '@/modules/approval/application/service'
import { approvalRepository } from '@/modules/approval/infrastructure/approval-repository'
import { toDomainPageRequest } from '@/modules/shared/application/query/legacy-query-adapter'
import { FilterOp } from '@/modules/shared/domain/query'
import type {
  ApprovalHistory,
  ApprovalInstance,
  LatestAdditionalInfoInstance,
} from '@/modules/approval/domain/types'

vi.mock('@/modules/approval/infrastructure/approval-repository', () => ({
  approvalRepository: {
    claimTask: vi.fn(),
    handleTask: vi.fn(),
    cancelInstance: vi.fn(),
    getInstancePage: vi.fn(),
    getInstanceDetail: vi.fn(),
    getHistoryList: vi.fn(),
    getLatestAdditionalInfoInstanceStatus: vi.fn(),
  },
}))

vi.mock('@/modules/shared/application/query/legacy-query-adapter', () => ({
  toDomainPageRequest: vi.fn(),
}))

const createApprovalInstance = (): ApprovalInstance<Record<string, unknown>> => ({
  id: 101,
  processId: 1,
  processName: '用户信息审批',
  formId: 9,
  currentNodeId: 2,
  nodeName: '提交',
  status: 'pending',
  applicantId: 66,
  approvalData: {},
  sourceData: null,
  createdTime: '2026-02-10T10:00:00+08:00',
  taskStatus: 'pending',
  taskId: 888,
})

describe('approvalService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('handleTask maps form data to approval comment request', async () => {
    const payload = createApprovalInstance()
    vi.mocked(approvalRepository.handleTask).mockResolvedValue(payload)

    const result = await approvalService.handleTask({
      taskId: 888,
      comment: '同意',
      approved: true,
    })

    expect(approvalRepository.handleTask).toHaveBeenCalledWith({
      taskId: 888,
      comment: '同意',
      approved: true,
    })
    expect(result).toEqual(payload)
  })

  it('getInstancePage maps QueryFilters request and normalizes size/orders', async () => {
    vi.mocked(approvalRepository.getInstancePage).mockResolvedValue({
      records: [],
    } as never)

    const queryFilters = {
      filters: [{ field: 'status', op: FilterOp.EQ, value: 'pending' }],
    }

    await approvalService.getInstancePage({
      page: 2,
      size: '20',
      orders: [{ column: 'createdTime' }, { column: 'id', direction: 'DESC' }],
      query: queryFilters,
    } as never)

    expect(toDomainPageRequest).not.toHaveBeenCalled()
    expect(approvalRepository.getInstancePage).toHaveBeenCalledWith({
      page: 2,
      size: 20,
      orders: [
        { column: 'createdTime', direction: 'ASC' },
        { column: 'id', direction: 'DESC' },
      ],
      query: queryFilters,
    })
  })

  it('getInstancePage sets size undefined when QueryFilters size is invalid string', async () => {
    vi.mocked(approvalRepository.getInstancePage).mockResolvedValue({
      records: [],
    } as never)

    const queryFilters = {
      filters: [{ field: 'status', op: FilterOp.EQ, value: 'pending' }],
    }

    await approvalService.getInstancePage({
      page: 1,
      size: 'invalid-size',
      query: queryFilters,
    } as never)

    expect(approvalRepository.getInstancePage).toHaveBeenCalledWith({
      page: 1,
      size: undefined,
      orders: undefined,
      query: queryFilters,
    })
  })

  it('getInstancePage delegates legacy query request to legacy adapter', async () => {
    const mappedRequest = {
      page: 3,
      size: 15,
      orders: [{ column: 'createdTime', direction: 'DESC' as const }],
      query: {
        filters: [{ field: 'applicantId', op: FilterOp.EQ, value: 1 }],
      },
    }

    vi.mocked(toDomainPageRequest).mockReturnValue(mappedRequest as never)
    vi.mocked(approvalRepository.getInstancePage).mockResolvedValue({
      records: [],
    } as never)

    const legacyPageRequest = {
      page: 3,
      size: '15',
      orders: [{ column: 'createdTime', direction: 'DESC' as const }],
      query: {
        applicantId: {
          condition: 'eq',
          value: 1,
        },
      },
    }

    await approvalService.getInstancePage(legacyPageRequest as never)

    expect(toDomainPageRequest).toHaveBeenCalledWith(legacyPageRequest)
    expect(approvalRepository.getInstancePage).toHaveBeenCalledWith(mappedRequest)
  })

  it('passes through repository methods for claim/cancel/detail/history/latest-status', async () => {
    const detail = createApprovalInstance()
    const history: ApprovalHistory[] = [
      {
        id: 1,
        instanceId: 101,
        taskId: 888,
        nodeId: 2,
        operatorId: 66,
        action: 'approve',
        comment: 'ok',
        createdTime: '2026-02-10T10:30:00+08:00',
        nodeName: '审批',
        operator: '张三',
      },
    ]
    const latest: LatestAdditionalInfoInstance = {
      id: 101,
      status: 'pending',
    }

    vi.mocked(approvalRepository.claimTask).mockResolvedValue(true)
    vi.mocked(approvalRepository.cancelInstance).mockResolvedValue(true)
    vi.mocked(approvalRepository.getInstanceDetail).mockResolvedValue(detail)
    vi.mocked(approvalRepository.getHistoryList).mockResolvedValue(history)
    vi.mocked(approvalRepository.getLatestAdditionalInfoInstanceStatus).mockResolvedValue(latest)

    await expect(approvalService.claimTask(888)).resolves.toBe(true)
    await expect(approvalService.cancelInstance(101)).resolves.toBe(true)
    await expect(approvalService.getInstanceDetail(101)).resolves.toEqual(detail)
    await expect(approvalService.getHistoryList(101)).resolves.toEqual(history)
    await expect(approvalService.getLatestAdditionalInfoInstanceStatus()).resolves.toEqual(latest)

    expect(approvalRepository.claimTask).toHaveBeenCalledWith(888)
    expect(approvalRepository.cancelInstance).toHaveBeenCalledWith(101)
    expect(approvalRepository.getInstanceDetail).toHaveBeenCalledWith(101)
    expect(approvalRepository.getHistoryList).toHaveBeenCalledWith(101)
    expect(approvalRepository.getLatestAdditionalInfoInstanceStatus).toHaveBeenCalledTimes(1)
  })
})
