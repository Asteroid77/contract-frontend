import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import {
  invitationKeys,
  useCreateInvitationCodeMutation,
  useDeleteInvitationCodeMutation,
  useInvitatedCountQuery,
  useInvitationCodeListQuery,
  useUpdateInvitationCodeMutation,
} from '@/modules/invitation/application/hooks/useInvitationService'
import { invitationService } from '@/modules/invitation/application/service'
import { withQueryRequestContext } from '@/app/infrastructure/query/query-request-context'

vi.mock('@tanstack/vue-query', () => ({
  useQuery: vi.fn((options) => options),
  useMutation: vi.fn((options) => options),
  useQueryClient: vi.fn(),
}))

vi.mock('@/modules/invitation/application/service', () => ({
  invitationService: {
    createInvitationCode: vi.fn(),
    updateInvitationCode: vi.fn(),
    deleteInvitationCode: vi.fn(),
    getInvitationCodeList: vi.fn(),
    getInvitedCount: vi.fn(),
  },
}))

vi.mock('@/app/infrastructure/query/query-request-context', () => ({
  withQueryRequestContext: vi.fn((_queryKey, _ctx, runner) => runner()),
}))

const queryClient = {
  invalidateQueries: vi.fn(),
}

type QueryOptionsLike<TData = unknown> = {
  queryKey: unknown
  queryFn: (ctx: { queryKey: unknown; signal: AbortSignal }) => Promise<TData> | TData
}

type MutationOptionsLike<TData = unknown, TVariables = unknown> = {
  mutationFn: (variables: TVariables) => Promise<TData> | TData
  onSuccess?: () => void
}

const getLatestQueryOptions = <TData = unknown>(): QueryOptionsLike<TData> => {
  const latestCall = vi.mocked(useQuery).mock.calls.at(-1)
  if (!latestCall) {
    throw new Error('useQuery should be called before reading options')
  }
  return latestCall[0] as QueryOptionsLike<TData>
}

const getLatestMutationOptions = <TData = unknown, TVariables = unknown>(): MutationOptionsLike<TData, TVariables> => {
  const latestCall = vi.mocked(useMutation).mock.calls.at(-1)
  if (!latestCall) {
    throw new Error('useMutation should be called before reading options')
  }
  return latestCall[0] as MutationOptionsLike<TData, TVariables>
}

describe('useInvitationService hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useQueryClient).mockReturnValue(queryClient as never)
  })

  it('defines stable invitation keys', () => {
    expect(invitationKeys.all).toEqual(['invitations'])
    expect(invitationKeys.lists()).toEqual(['invitations', 'list'])
    expect(invitationKeys.list('x')).toEqual(['invitations', 'list', { filters: 'x' }])
    expect(invitationKeys.count()).toEqual(['invitations', 'count'])
  })

  it('useInvitationCodeListQuery wraps list request by query request context', async () => {
    const payload = [{ id: 1, code: 'INVITE-1' }]
    vi.mocked(invitationService.getInvitationCodeList).mockResolvedValue(payload as never)

    useInvitationCodeListQuery()
    const options = getLatestQueryOptions<typeof payload>()

    expect(options.queryKey).toEqual(invitationKeys.lists())

    const ctx = {
      queryKey: invitationKeys.lists(),
      signal: new AbortController().signal,
    }
    const result = await options.queryFn(ctx)

    expect(withQueryRequestContext).toHaveBeenCalledWith(invitationKeys.lists(), ctx, expect.any(Function))
    expect(invitationService.getInvitationCodeList).toHaveBeenCalledTimes(1)
    expect(result).toEqual(payload)
  })

  it('useInvitatedCountQuery wraps count request by query request context', async () => {
    vi.mocked(invitationService.getInvitedCount).mockResolvedValue(9)

    useInvitatedCountQuery()
    const options = getLatestQueryOptions<number>()

    expect(options.queryKey).toEqual(invitationKeys.count())

    const ctx = {
      queryKey: invitationKeys.count(),
      signal: new AbortController().signal,
    }
    const result = await options.queryFn(ctx)

    expect(withQueryRequestContext).toHaveBeenCalledWith(invitationKeys.count(), ctx, expect.any(Function))
    expect(invitationService.getInvitedCount).toHaveBeenCalledTimes(1)
    expect(result).toBe(9)
  })

  it('useCreateInvitationCodeMutation invalidates invitation list on success', async () => {
    useCreateInvitationCodeMutation()
    const options = getLatestMutationOptions<{ id: number }, void>()

    vi.mocked(invitationService.createInvitationCode).mockResolvedValue({ id: 1 } as never)

    await options.mutationFn()
    expect(invitationService.createInvitationCode).toHaveBeenCalledTimes(1)

    if (!options.onSuccess) throw new Error('onSuccess should be defined')
    options.onSuccess()
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: invitationKeys.lists() })
  })

  it('useUpdateInvitationCodeMutation delegates params and runs callback', async () => {
    const callback = vi.fn()
    const payload = [{ id: 1, remark: 'new' }]

    useUpdateInvitationCodeMutation(callback)
    const options = getLatestMutationOptions<Array<{ id: number }>, typeof payload>()

    vi.mocked(invitationService.updateInvitationCode).mockResolvedValue([{ id: 1 }] as never)

    await options.mutationFn(payload)
    expect(invitationService.updateInvitationCode).toHaveBeenCalledWith(payload)

    if (!options.onSuccess) throw new Error('onSuccess should be defined')
    options.onSuccess()
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: invitationKeys.lists() })
    expect(callback).toHaveBeenCalledTimes(1)
  })

  it('useDeleteInvitationCodeMutation delegates params and runs callback', async () => {
    const callback = vi.fn()

    useDeleteInvitationCodeMutation(callback)
    const options = getLatestMutationOptions<boolean, number[]>()

    vi.mocked(invitationService.deleteInvitationCode).mockResolvedValue(true)

    await options.mutationFn([1, 2])
    expect(invitationService.deleteInvitationCode).toHaveBeenCalledWith([1, 2])

    if (!options.onSuccess) throw new Error('onSuccess should be defined')
    options.onSuccess()
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: invitationKeys.lists() })
    expect(callback).toHaveBeenCalledTimes(1)
  })
})
