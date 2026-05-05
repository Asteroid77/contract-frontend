import { resolveUserDisplayName } from '@/modules/user/application/utils/displayName'

type WorkOrderParticipantNameInput = {
  userId: number
  userName?: string | null
  currentUserId: number
  currentUserDisplayName: string
}

type WorkOrderHandlerNameInput = {
  currentHandlerId: number | null
  currentHandlerName?: string | null
  currentUserId: number
  currentUserDisplayName: string
}

function resolveParticipantName({
  userId,
  userName,
  currentUserId,
  currentUserDisplayName,
}: WorkOrderParticipantNameInput) {
  const displayName = resolveUserDisplayName({ name: userName })
  if (displayName) return displayName

  if (userId === currentUserId && currentUserDisplayName) {
    return currentUserDisplayName
  }

  return `#${userId}`
}

export function resolveWorkOrderUserName(input: WorkOrderParticipantNameInput) {
  return resolveParticipantName(input)
}

export function resolveWorkOrderReplyAuthorName(input: WorkOrderParticipantNameInput) {
  return resolveParticipantName(input)
}

export function resolveWorkOrderHandlerName({
  currentHandlerId,
  currentHandlerName,
  currentUserId,
  currentUserDisplayName,
}: WorkOrderHandlerNameInput) {
  if (currentHandlerId == null) return null

  return resolveParticipantName({
    userId: currentHandlerId,
    userName: currentHandlerName,
    currentUserId,
    currentUserDisplayName,
  })
}
