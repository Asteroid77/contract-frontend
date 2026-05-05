import { describe, expect, it } from 'vitest'
import {
  resolveWorkOrderDetailPermissions,
  resolveWorkOrderReplyApiMode,
} from '@/modules/work-order/application/rules/workOrderDetailRules'
import { WorkOrderStatus } from '@/modules/work-order/domain/enums'

describe('workOrderDetailRules', () => {
  it('disables all detail actions when detail is unavailable', () => {
    expect(
      resolveWorkOrderDetailPermissions({
        detail: null,
        isHandler: true,
        isOwner: true,
        isCurrentHandler: true,
      }),
    ).toEqual({
      canReplyAsHandler: false,
      canReplyAsUser: false,
      canReply: false,
      canCancel: false,
      canComplete: false,
      canReopen: false,
      canReject: false,
      canClaim: false,
      canRelease: false,
      canScore: false,
    })
  })

  it('allows a current handler to reply, complete and release a processing work order', () => {
    const permissions = resolveWorkOrderDetailPermissions({
      detail: {
        status: WorkOrderStatus.PROCESSING,
        currentHandlerId: 7,
      },
      isHandler: true,
      isOwner: false,
      isCurrentHandler: true,
    })

    expect(permissions).toMatchObject({
      canReplyAsHandler: true,
      canReplyAsUser: false,
      canReply: true,
      canCancel: false,
      canComplete: true,
      canReopen: false,
      canReject: false,
      canClaim: false,
      canRelease: true,
      canScore: false,
    })
  })

  it('allows an owner to manage user-side actions according to status', () => {
    expect(
      resolveWorkOrderDetailPermissions({
        detail: {
          status: WorkOrderStatus.PROCESSING,
          currentHandlerId: 7,
        },
        isHandler: false,
        isOwner: true,
        isCurrentHandler: false,
      }),
    ).toMatchObject({
      canReplyAsHandler: false,
      canReplyAsUser: true,
      canReply: true,
      canCancel: true,
      canComplete: true,
      canReject: true,
      canScore: false,
    })

    expect(
      resolveWorkOrderDetailPermissions({
        detail: {
          status: WorkOrderStatus.CANCELLED,
          currentHandlerId: null,
        },
        isHandler: false,
        isOwner: true,
        isCurrentHandler: false,
      }),
    ).toMatchObject({
      canReply: false,
      canCancel: false,
      canReopen: true,
    })

    expect(
      resolveWorkOrderDetailPermissions({
        detail: {
          status: WorkOrderStatus.COMPLETED,
          currentHandlerId: 7,
        },
        isHandler: false,
        isOwner: true,
        isCurrentHandler: false,
      }),
    ).toMatchObject({
      canReply: false,
      canCancel: false,
      canComplete: false,
      canScore: true,
    })
  })

  it('allows handler claim only for pending work orders', () => {
    expect(
      resolveWorkOrderDetailPermissions({
        detail: {
          status: WorkOrderStatus.PENDING,
          currentHandlerId: null,
        },
        isHandler: true,
        isOwner: false,
        isCurrentHandler: false,
      }).canClaim,
    ).toBe(true)

    expect(
      resolveWorkOrderDetailPermissions({
        detail: {
          status: WorkOrderStatus.PROCESSING,
          currentHandlerId: 7,
        },
        isHandler: true,
        isOwner: false,
        isCurrentHandler: false,
      }).canClaim,
    ).toBe(false)
  })

  it('resolves reply API mode without requiring UI state', () => {
    expect(
      resolveWorkOrderReplyApiMode({
        workOrderId: 11,
        detail: null,
        isHandler: false,
        isOwner: false,
        canReplyAsHandler: false,
      }),
    ).toBe('user')

    expect(
      resolveWorkOrderReplyApiMode({
        workOrderId: 11,
        detail: {
          status: WorkOrderStatus.PROCESSING,
          currentHandlerId: 7,
        },
        isHandler: true,
        isOwner: false,
        canReplyAsHandler: false,
      }),
    ).toBe('handler')

    expect(
      resolveWorkOrderReplyApiMode({
        workOrderId: 11,
        detail: {
          status: WorkOrderStatus.PROCESSING,
          currentHandlerId: 7,
        },
        isHandler: true,
        isOwner: true,
        canReplyAsHandler: false,
      }),
    ).toBe('user')

    expect(
      resolveWorkOrderReplyApiMode({
        workOrderId: 0,
        detail: {
          status: WorkOrderStatus.PROCESSING,
          currentHandlerId: 7,
        },
        isHandler: false,
        isOwner: true,
        canReplyAsHandler: false,
      }),
    ).toBeNull()
  })
})
