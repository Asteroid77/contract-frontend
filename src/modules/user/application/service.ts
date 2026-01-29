import type { BasePageRequest, IPage } from '@/modules/shared/application/request/types'
import { toDomainPageRequest } from '@/modules/shared/application/query/legacy-query-adapter'
import { userRepository } from '../infrastructure/user-repository'
import type {
  PasswordRecoveryRequest,
  RegisterRequest,
  RegisterResponse,
  SignInRequest,
  SignInResponse,
  UserAdditionalInfo,
  UserAdditionalInfoRequest,
  UserPageDTO,
  UserPageVO,
} from './models'
import {
  toDomainAdditionalInfoRequest,
  toDomainLoginRequest,
  toDomainPasswordRecoveryRequest,
  toDomainRegisterRequest,
  toViewAdditionalInfo,
  toViewRegisterResponse,
  toViewSignInResponse,
  toViewUserPage,
} from './mappers'
import type { ApprovalInstance } from '@/modules/approval/domain/types'

const mapAdditionalInfoApproval = (
  instance: ApprovalInstance<Record<string, unknown>>,
): ApprovalInstance<UserAdditionalInfo> => {
  return {
    ...instance,
    approvalData:
      (toViewAdditionalInfo(instance.approvalData as any) ??
        instance.approvalData) as UserAdditionalInfo,
    sourceData: instance.sourceData
      ? ((toViewAdditionalInfo(instance.sourceData as any) ??
          instance.sourceData) as UserAdditionalInfo)
      : null,
  }
}

export const userService = {
  login: (data: SignInRequest): Promise<SignInResponse> =>
    userRepository.login(toDomainLoginRequest(data)).then(toViewSignInResponse),
  register: (data: RegisterRequest): Promise<RegisterResponse> =>
    userRepository.register(toDomainRegisterRequest(data)).then(toViewRegisterResponse),
  getUserInfoByToken: (token: string): Promise<SignInResponse> =>
    userRepository.getByToken(token).then(toViewSignInResponse),
  additionalInfoRequest: (
    data: UserAdditionalInfoRequest,
  ): Promise<ApprovalInstance<UserAdditionalInfo>> =>
    userRepository
      .additionalInfoRequest(toDomainAdditionalInfoRequest(data))
      .then(mapAdditionalInfoApproval),
  getUserPage: (pageRequest: BasePageRequest<UserPageDTO>): Promise<IPage<UserPageVO>> =>
    userRepository.getUserPage(toDomainPageRequest(pageRequest)).then((page) => ({
      ...page,
      records: page.records.map(toViewUserPage),
    })),
  passwordRecovery: (data: PasswordRecoveryRequest): Promise<boolean> =>
    userRepository.passwordRecovery(toDomainPasswordRecoveryRequest(data)),
}
