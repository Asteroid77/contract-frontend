import type { BasePageRequest, IPage } from '@/modules/shared/application/request/types'
import { toDomainPageRequest } from '@/modules/shared/application/query/legacy-query-adapter'
import { userRepository } from '../infrastructure/user-repository'
import type { UserAdditionalInfoVo } from '../domain/types'
import type {
  PasswordRecoveryForm,
  RegisterForm,
  RegisterResponse,
  SignInForm,
  SignInResponse,
  UserAdditionalInfo,
  UserAdditionalInfoForm,
  UserPageQuery,
  UserPageItem,
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
    approvalData: (toViewAdditionalInfo(instance.approvalData as unknown as UserAdditionalInfoVo) ??
      instance.approvalData) as UserAdditionalInfo,
    sourceData: instance.sourceData
      ? ((toViewAdditionalInfo(instance.sourceData as unknown as UserAdditionalInfoVo) ??
          instance.sourceData) as UserAdditionalInfo)
      : null,
  }
}

export const userService = {
  login: (data: SignInForm): Promise<SignInResponse> =>
    userRepository.login(toDomainLoginRequest(data)).then(toViewSignInResponse),
  register: (data: RegisterForm): Promise<RegisterResponse> =>
    userRepository.register(toDomainRegisterRequest(data)).then(toViewRegisterResponse),
  getUserInfoByToken: (token: string): Promise<SignInResponse> =>
    userRepository.getByToken(token).then(toViewSignInResponse),
  additionalInfoRequest: (
    data: UserAdditionalInfoForm,
  ): Promise<ApprovalInstance<UserAdditionalInfo>> =>
    userRepository
      .additionalInfoRequest(toDomainAdditionalInfoRequest(data))
      .then(mapAdditionalInfoApproval),
  getUserPage: (pageRequest: BasePageRequest<UserPageQuery>): Promise<IPage<UserPageItem>> =>
    userRepository.getUserPage(toDomainPageRequest(pageRequest)).then((page) => ({
      ...page,
      records: page.records.map(toViewUserPage),
    })),
  passwordRecovery: (data: PasswordRecoveryForm): Promise<boolean> =>
    userRepository.passwordRecovery(toDomainPasswordRecoveryRequest(data)),
}
