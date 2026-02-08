import type { AxiosResponse, AxiosResponseHeaders, RawAxiosResponseHeaders } from 'axios'
import type { RFC7807Response } from '@/modules/shared/domain/response'

export const REQUEST_ID_HEADER = 'X-Request-Id'

export const createRequestId = (): string =>
  globalThis.crypto?.randomUUID?.() ?? `${Date.now()}_${Math.random().toString(16).slice(2)}`

export const normalizeRequestId = (value: unknown): string | undefined => {
  if (typeof value !== 'string') {
    return undefined
  }

  const normalized = value.trim()
  return normalized.length > 0 ? normalized : undefined
}

export const readRequestIdFromHeaders = (
  headers?: AxiosResponseHeaders | RawAxiosResponseHeaders,
): string | undefined => {
  if (!headers) return undefined

  const fromCanonical = normalizeRequestId(headers[REQUEST_ID_HEADER])
  if (fromCanonical) return fromCanonical

  return normalizeRequestId(headers[REQUEST_ID_HEADER.toLowerCase()])
}

export const readRequestIdFromBody = (body?: Partial<RFC7807Response<unknown>>): string | undefined => {
  if (!body) return undefined

  const payload = body as Partial<RFC7807Response<unknown>> & {
    reuqestId?: string
  }

  return normalizeRequestId(payload.requestId) ?? normalizeRequestId(payload.reuqestId)
}

export const resolveResponseRequestId = (response: AxiosResponse<RFC7807Response<unknown>>) =>
  readRequestIdFromBody(response.data) ?? readRequestIdFromHeaders(response.headers)
