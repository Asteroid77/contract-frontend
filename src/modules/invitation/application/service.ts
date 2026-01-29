import type { BasePageRequest, IPage } from '@/modules/shared/application/request/types'
import { toDomainPageRequest } from '@/modules/shared/application/query/legacy-query-adapter'
import type {
  InvitationCode,
  InvitationRecord,
  InvitationRecordPageRequest,
  InvitationUpdateRequest,
} from './models'
import { invitationRepository } from '../infrastructure/invitation-repository'

export const invitationService = {
  createInvitationCode: (): Promise<InvitationCode> =>
    invitationRepository.createInvitationCode(),
  updateInvitationCode: (data: InvitationUpdateRequest[]): Promise<InvitationCode[]> =>
    invitationRepository.updateInvitationCode(data),
  deleteInvitationCode: (ids: number[]): Promise<boolean> =>
    invitationRepository.deleteInvitationCode(ids),
  getInvitationCodeList: (): Promise<InvitationCode[]> =>
    invitationRepository.getInvitationCodeList(),
  getInvitedCount: (): Promise<number> => invitationRepository.getInvitedCount(),
  getInvitationRecordPage: (
    pageRequest: InvitationRecordPageRequest,
  ): Promise<IPage<InvitationRecord>> =>
    invitationRepository.getInvitationRecordPage(toDomainPageRequest(pageRequest)),
}
