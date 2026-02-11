import { totpRepository } from '../infrastructure/totp-repository'
import type { ITotpRepository } from '../domain/repositories'
import type {
  TotpVerifyForm,
  TotpEnableForm,
  TotpDisableForm,
  TotpStatus,
  TotpSetupResult,
  SignInResponse,
} from './models'
import {
  toDomainTotpVerifyRequest,
  toDomainTotpEnableRequest,
  toDomainTotpDisableRequest,
  toViewSignInResponse,
  toViewTotpStatus,
  toViewTotpSetup,
} from './mappers'

export class TotpService {
  constructor(private readonly repo: ITotpRepository) {}

  verify(data: TotpVerifyForm): Promise<SignInResponse> {
    return this.repo.verify(toDomainTotpVerifyRequest(data)).then(toViewSignInResponse)
  }

  getStatus(): Promise<TotpStatus> {
    return this.repo.getStatus().then(toViewTotpStatus)
  }

  setup(): Promise<TotpSetupResult> {
    return this.repo.setup().then(toViewTotpSetup)
  }

  enable(data: TotpEnableForm): Promise<boolean> {
    return this.repo.enable(toDomainTotpEnableRequest(data))
  }

  disable(data: TotpDisableForm): Promise<void> {
    return this.repo.disable(toDomainTotpDisableRequest(data))
  }

  regenerateBackupCodes(): Promise<string[]> {
    return this.repo.regenerateBackupCodes()
  }
}

export const totpService = new TotpService(totpRepository)
