import { computed } from 'vue'
import type { ComputedRef } from 'vue'
import { BusinessError } from '@/modules/shared/domain/errors'

export type PanelStatus = 'loading' | 'error' | 'empty' | 'ready'

export interface PanelErrorMeta {
  message: string
  traceId?: string
  requestId?: string
}

export interface PanelState {
  status: PanelStatus
  errorMeta?: PanelErrorMeta
}

export interface QueryPanelLike<TData> {
  isLoading: { value: boolean }
  isError: { value: boolean }
  data: { value: TData | undefined }
  error: { value: unknown }
}

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null
}

const getString = (value: unknown): string | undefined => {
  if (typeof value !== 'string') {
    return undefined
  }

  const trimmed = value.trim()
  return trimmed ? trimmed : undefined
}

export const getBusinessErrorMeta = (
  error: unknown,
  requestFailedText: ComputedRef<string>,
): PanelErrorMeta => {
  if (error instanceof BusinessError) {
    return {
      message: getString(error.message) ?? requestFailedText.value,
      traceId: getString(error.traceId),
      requestId: getString(error.requestId),
    }
  }

  if (error instanceof Error && getString(error.message)) {
    const wrapped = error as unknown as { traceId?: unknown; requestId?: unknown; cause?: unknown }
    return {
      message: error.message,
      traceId: getString(wrapped.traceId),
      requestId: getString(wrapped.requestId),
    }
  }

  const sources: unknown[] = [error]
  if (isRecord(error)) {
    if ('response' in error && isRecord(error.response) && 'data' in error.response) {
      sources.push(error.response.data)
    }
    if ('cause' in error) {
      sources.push(error.cause)
    }
  }

  for (const source of sources) {
    if (!isRecord(source)) {
      continue
    }

    const message = getString(source.message)
    const traceId = getString(source.traceId)
    const requestId = getString(source.requestId)

    if (message || traceId || requestId) {
      return {
        message: message ?? requestFailedText.value,
        traceId,
        requestId,
      }
    }
  }

  return {
    message: requestFailedText.value,
  }
}

export const buildPanelState = <TData,>(
  query: QueryPanelLike<TData>,
  requestFailedText: ComputedRef<string>,
  hasData: (data: TData | undefined) => boolean,
) => {
  return computed<PanelState>(() => {
    const data = query.data.value
    const ready = hasData(data)

    if (!ready && query.isLoading.value) {
      return { status: 'loading' }
    }

    if (query.isError.value) {
      return {
        status: 'error',
        errorMeta: getBusinessErrorMeta(query.error.value, requestFailedText),
      }
    }

    if (ready) {
      return { status: 'ready' }
    }

    return { status: 'empty' }
  })
}
