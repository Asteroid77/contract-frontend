import type { ServiceAgreementRequestDTO } from '../domain/dto'
import type { ServiceAgreementStatus } from '../domain/enums'

const SIGNING_STATUS: ServiceAgreementStatus = 2

export const sanitizeServiceAgreementRequest = (
  payload: ServiceAgreementRequestDTO,
): ServiceAgreementRequestDTO => {
  if (payload.status === SIGNING_STATUS) {
    return payload
  }

  return {
    ...payload,
    priceModel: null,
    priceType: null,
    priceCategory: null,
    fixedPrice: null,
    fixedSpread: null,
    revenueShareRatio: null,
    comment: null,
    expirationTime: null,
    billIds: null,
    supplementaryAttachmentIds: null,
    contractScanIds: null,
    servicePointSpecifications: null,
  }
}
