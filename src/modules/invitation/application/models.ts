import type { BasePageRequest, BaseQuery } from '@/modules/shared/application/request/types'
import type { EditRemarkDTO } from '../domain/dto'
import type {
  InvitationCode as DomainInvitationCode,
  InvitationCodeStatus as DomainInvitationCodeStatus,
  InvitationRecord as DomainInvitationRecord,
} from '../domain/types'

export type InvitationUpdateRequest = EditRemarkDTO
export type InvitationRecordPageRequest = BasePageRequest<BaseQuery>

export type InvitationCode = DomainInvitationCode
export type InvitationRecord = DomainInvitationRecord
export type InvitationCodeStatus = DomainInvitationCodeStatus
