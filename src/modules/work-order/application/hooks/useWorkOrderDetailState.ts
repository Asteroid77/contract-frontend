import { computed, type ComputedRef, type Ref } from 'vue'
import type { WorkOrderReplyVO } from '../../domain/types'
import {
  useHandlerDetail,
  useHandlerReplies,
  useWorkOrderDetail,
  useWorkOrderReplies,
} from './useWorkOrderService'
import {
  resolveWorkOrderDetailPermissions,
  resolveWorkOrderReplyApiMode,
} from '../rules/workOrderDetailRules'
import {
  resolveWorkOrderHandlerName,
  resolveWorkOrderReplyAuthorName,
  resolveWorkOrderUserName,
} from '../rules/workOrderParticipantRules'

type UseWorkOrderDetailStateInput = {
  workOrderId: Ref<number>
  isHandler: Ref<boolean>
  currentUserId: Ref<number>
  currentUserDisplayName: ComputedRef<string> | Ref<string>
  isOwner: (ownerId: number | undefined) => boolean
}

export function useWorkOrderDetailState({
  workOrderId,
  isHandler,
  currentUserId,
  currentUserDisplayName,
  isOwner: resolveIsOwner,
}: UseWorkOrderDetailStateInput) {
  const userDetailQuery = useWorkOrderDetail(workOrderId, {
    enabled: computed(() => !isHandler.value),
  })
  const handlerDetailQuery = useHandlerDetail(workOrderId, { enabled: isHandler })
  const detailQuery = computed(() => (isHandler.value ? handlerDetailQuery : userDetailQuery))
  const detail = computed(() => detailQuery.value.data.value)

  const isOwner = computed(() => detail.value && resolveIsOwner(detail.value.userId))
  const isCurrentHandler = computed(
    () => detail.value && detail.value.currentHandlerId === currentUserId.value,
  )

  const permissions = computed(() =>
    resolveWorkOrderDetailPermissions({
      detail: detail.value,
      isHandler: isHandler.value,
      isOwner: !!isOwner.value,
      isCurrentHandler: !!isCurrentHandler.value,
    }),
  )

  const canReplyAsHandler = computed(() => permissions.value.canReplyAsHandler)

  const replyApiMode = computed<'user' | 'handler' | null>(() =>
    resolveWorkOrderReplyApiMode({
      workOrderId: workOrderId.value,
      detail: detail.value,
      isHandler: isHandler.value,
      isOwner: !!isOwner.value,
      canReplyAsHandler: canReplyAsHandler.value,
    }),
  )

  const userRepliesQuery = useWorkOrderReplies(workOrderId, {
    enabled: computed(() => replyApiMode.value === 'user'),
  })
  const handlerRepliesQuery = useHandlerReplies(workOrderId, {
    enabled: computed(() => replyApiMode.value === 'handler'),
  })
  const repliesQuery = computed(() =>
    replyApiMode.value === 'handler' ? handlerRepliesQuery : userRepliesQuery,
  )
  const replies = computed(() => repliesQuery.value.data.value ?? [])

  const initiatorName = computed(() => {
    if (!detail.value) return '-'
    return resolveWorkOrderUserName({
      userId: detail.value.userId,
      userName: detail.value.userName,
      currentUserId: currentUserId.value,
      currentUserDisplayName: currentUserDisplayName.value,
    })
  })

  const claimerName = computed(() => {
    if (!detail.value) return null
    return resolveWorkOrderHandlerName({
      currentHandlerId: detail.value.currentHandlerId,
      currentHandlerName: detail.value.currentHandlerName,
      currentUserId: currentUserId.value,
      currentUserDisplayName: currentUserDisplayName.value,
    })
  })

  const replyAuthorName = (reply: WorkOrderReplyVO) =>
    resolveWorkOrderReplyAuthorName({
      userId: reply.userId,
      userName: reply.userName,
      currentUserId: currentUserId.value,
      currentUserDisplayName: currentUserDisplayName.value,
    })

  return {
    userDetailQuery,
    handlerDetailQuery,
    detailQuery,
    detail,
    isOwner,
    isCurrentHandler,
    permissions,
    canReplyAsHandler,
    replyApiMode,
    userRepliesQuery,
    handlerRepliesQuery,
    repliesQuery,
    replies,
    canReply: computed(() => permissions.value.canReply),
    canCancel: computed(() => permissions.value.canCancel),
    canComplete: computed(() => permissions.value.canComplete),
    canReopen: computed(() => permissions.value.canReopen),
    canReject: computed(() => permissions.value.canReject),
    canClaim: computed(() => permissions.value.canClaim),
    canRelease: computed(() => permissions.value.canRelease),
    canScore: computed(() => permissions.value.canScore),
    initiatorName,
    claimerName,
    replyAuthorName,
  }
}
