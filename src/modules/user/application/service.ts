import type { BasePageRequest, IPage } from '@/modules/shared/application/request/types'
import { toDomainPageRequest } from '@/modules/shared/application/query/legacy-query-adapter'
import { userRepository } from '../infrastructure/user-repository'
import type { OAuth2ExchangeVo, UserAdditionalInfoVo } from '../domain/types'
import type {
  ChangePasswordForm,
  PasswordRecoveryForm,
  RegisterForm,
  RegisterResponse,
  RevokeDeviceSessionsForm,
  RevokeDeviceSessionsResult,
  SignInForm,
  SignInResponse,
  SignInResponseComplete,
  UserAdditionalInfo,
  UserAdditionalInfoForm,
  UserDeviceSession,
  UserPageItem,
  UserPageQuery,
  UserPageRequest,
} from './models'
import {
  toDomainAdditionalInfoRequest,
  toDomainChangePasswordRequest,
  toDomainLoginRequest,
  toDomainPasswordRecoveryRequest,
  toDomainRegisterRequest,
  toDomainRevokeCurrentUserDevicesRequest,
  toViewAdditionalInfo,
  toViewRegisterResponse,
  toViewRevokeDeviceSessionsResult,
  toViewSignInResponse,
  toViewUserDeviceSession,
  toViewUserPage,
} from './mappers'
import type { ApprovalInstance } from '@/modules/approval/domain/types'
import type { IUserRepository } from '../domain/repositories'
import type { QueryFilters } from '@/modules/shared/domain/query'
import type { BasePageRequest as DomainBasePageRequest } from '@/modules/shared/domain/page'

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

const isQueryFilters = (query: unknown): query is QueryFilters => {
  if (!query || typeof query !== 'object') return false
  return 'filters' in query || 'group' in query
}

const normalizeSize = (size?: BasePageRequest<UserPageQuery>['size']) => {
  if (size == null) return undefined
  if (typeof size === 'number') return size
  if (typeof size === 'string') {
    const parsed = Number(size)
    return Number.isNaN(parsed) ? undefined : parsed
  }
  return undefined
}

const toDomainPageRequestSmart = (
  pageRequest: UserPageRequest,
): DomainBasePageRequest<QueryFilters> => {
  if (isQueryFilters(pageRequest.query)) {
    return {
      page: pageRequest.page,
      size: normalizeSize(pageRequest.size),
      orders: pageRequest.orders?.map((item) => ({
        column: item.column,
        direction: item.direction ?? 'ASC',
      })),
      query: pageRequest.query,
    }
  }
  return toDomainPageRequest(pageRequest as BasePageRequest<UserPageQuery>)
}

const ensureSignInResponseComplete = (response: SignInResponse): SignInResponseComplete => {
  if (response.requireTwoFactor) {
    throw new Error('Current user info requires two-factor verification unexpectedly')
  }

  return response
}

export class UserService {
  constructor(private readonly repo: IUserRepository) {}

  login(data: SignInForm): Promise<SignInResponse> {
    return this.repo.login(toDomainLoginRequest(data)).then(toViewSignInResponse)
  }

  register(data: RegisterForm): Promise<RegisterResponse> {
    return this.repo.register(toDomainRegisterRequest(data)).then(toViewRegisterResponse)
  }

  getCurrentUserInfo(accessToken?: string): Promise<SignInResponseComplete> {
    return this.repo
      .getCurrentUserInfo(accessToken)
      .then(toViewSignInResponse)
      .then(ensureSignInResponseComplete)
  }

  getUserInfoById(userId: number): Promise<UserAdditionalInfo | null> {
    return this.repo.getUserInfoById(userId).then((info) => toViewAdditionalInfo(info.profile))
  }

  exchangeOAuth2Code(authCode: string): Promise<OAuth2ExchangeVo> {
    return this.repo.exchangeOAuth2Code({ authCode })
  }

  changePassword(data: ChangePasswordForm): Promise<boolean> {
    return this.repo.changePassword(toDomainChangePasswordRequest(data))
  }

  deleteUser(userId: number): Promise<boolean> {
    return this.repo.deleteUser(userId)
  }

  listCurrentUserDevices(): Promise<UserDeviceSession[]> {
    return this.repo.listCurrentUserDevices().then((items) => items.map(toViewUserDeviceSession))
  }

  revokeCurrentUserDevices(data: RevokeDeviceSessionsForm): Promise<RevokeDeviceSessionsResult> {
    return this.repo
      .revokeCurrentUserDevices(toDomainRevokeCurrentUserDevicesRequest(data))
      .then(toViewRevokeDeviceSessionsResult)
  }

  additionalInfoRequest(
    data: UserAdditionalInfoForm,
  ): Promise<ApprovalInstance<UserAdditionalInfo>> {
    return this.repo
      .additionalInfoRequest(toDomainAdditionalInfoRequest(data))
      .then(mapAdditionalInfoApproval)
  }

  getUserPage(pageRequest: UserPageRequest): Promise<IPage<UserPageItem>> {
    return this.repo.getUserPage(toDomainPageRequestSmart(pageRequest)).then((page) => ({
      ...page,
      records: page.records.map(toViewUserPage),
    }))
  }

  passwordRecovery(data: PasswordRecoveryForm): Promise<boolean> {
    return this.repo.passwordRecovery(toDomainPasswordRecoveryRequest(data))
  }

  logout(): Promise<boolean> {
    return this.repo.logout()
  }
}

export const userService = new UserService(userRepository)
