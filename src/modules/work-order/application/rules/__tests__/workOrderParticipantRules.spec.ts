import { describe, expect, it } from 'vitest'
import {
  resolveWorkOrderHandlerName,
  resolveWorkOrderReplyAuthorName,
  resolveWorkOrderUserName,
} from '@/modules/work-order/application/rules/workOrderParticipantRules'

describe('workOrderParticipantRules', () => {
  it('uses backend initiator name before current user fallback and id fallback', () => {
    expect(
      resolveWorkOrderUserName({
        userId: 11,
        userName: 'Alice # 20',
        currentUserId: 11,
        currentUserDisplayName: 'Current Alice',
      }),
    ).toBe('Alice#20')

    expect(
      resolveWorkOrderUserName({
        userId: 11,
        userName: null,
        currentUserId: 11,
        currentUserDisplayName: 'Current Alice',
      }),
    ).toBe('Current Alice')

    expect(
      resolveWorkOrderUserName({
        userId: 11,
        userName: null,
        currentUserId: 5,
        currentUserDisplayName: 'Current Alice',
      }),
    ).toBe('#11')
  })

  it('returns null for missing handler and resolves handler fallbacks when claimed', () => {
    expect(
      resolveWorkOrderHandlerName({
        currentHandlerId: null,
        currentHandlerName: null,
        currentUserId: 7,
        currentUserDisplayName: 'Current Handler',
      }),
    ).toBeNull()

    expect(
      resolveWorkOrderHandlerName({
        currentHandlerId: 7,
        currentHandlerName: 'Handler # 8',
        currentUserId: 7,
        currentUserDisplayName: 'Current Handler',
      }),
    ).toBe('Handler#8')

    expect(
      resolveWorkOrderHandlerName({
        currentHandlerId: 7,
        currentHandlerName: null,
        currentUserId: 7,
        currentUserDisplayName: 'Current Handler',
      }),
    ).toBe('Current Handler')

    expect(
      resolveWorkOrderHandlerName({
        currentHandlerId: 7,
        currentHandlerName: null,
        currentUserId: 5,
        currentUserDisplayName: 'Current Handler',
      }),
    ).toBe('#7')
  })

  it('uses reply user name before current user fallback and id fallback', () => {
    expect(
      resolveWorkOrderReplyAuthorName({
        userId: 9,
        userName: 'Reply User # 12',
        currentUserId: 9,
        currentUserDisplayName: 'Current Reply User',
      }),
    ).toBe('Reply User#12')

    expect(
      resolveWorkOrderReplyAuthorName({
        userId: 9,
        userName: null,
        currentUserId: 9,
        currentUserDisplayName: 'Current Reply User',
      }),
    ).toBe('Current Reply User')

    expect(
      resolveWorkOrderReplyAuthorName({
        userId: 9,
        userName: null,
        currentUserId: 5,
        currentUserDisplayName: 'Current Reply User',
      }),
    ).toBe('#9')
  })
})
