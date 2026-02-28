/**
 * 错误收集核心 - 统一入口
 * 优化版：更好的 SigNoz 日志格式 + OpenReplay 关联
 */
import { nanoid } from '../utils/nanoid'
import type { ObservabilityError, ErrorSource, ErrorSeverity, ObservabilityConfig } from '../types'
import { getCurrentTraceContext, recordError } from '../otel/tracer'
import { sendToSigNoz } from '../transports/signoz-transport'
import { getSessionId, getSessionUrl, trackError as trackReplayError } from '../replay/openreplay'
import { $t } from '@/_utils/i18n'

let config: ObservabilityConfig | null = null
const errorBuffer: ObservabilityError[] = []
const MAX_BUFFER_SIZE = 100
const seenErrors = new Map<string, { count: number; firstSeen: number }>()
const DEDUP_WINDOW_MS = 5000

/**
 * 初始化错误收集器
 */
export function initErrorCollector(cfg: ObservabilityConfig): void {
  config = cfg
}

/**
 * 生成错误指纹用于去重和聚合
 */
function getErrorFingerprint(error: Partial<ObservabilityError>): string {
  const stack = error.stack?.split('\n').slice(0, 3).join('\n') || ''
  return `${error.source}:${error.message}:${stack}`
}

/**
 * 检查是否应该忽略此错误
 */
function shouldIgnore(error: Partial<ObservabilityError>): boolean {
  if (!config) return false

  if (config.ignoreErrors?.some((pattern) => pattern.test(error.message || ''))) {
    return true
  }

  if (
    error.page?.url &&
    config.ignoreUrls?.some((pattern) => pattern.test(error.page?.url || ''))
  ) {
    return true
  }

  return false
}

/**
 * 采样决策
 */
function shouldSample(): boolean {
  if (!config) return true
  return Math.random() < config.sampleRate
}

/**
 * 去重检查 - 返回是否为重复错误及出现次数
 */
function checkDuplicate(fingerprint: string): { isDuplicate: boolean; count: number } {
  const now = Date.now()
  const existing = seenErrors.get(fingerprint)

  if (existing && now - existing.firstSeen < DEDUP_WINDOW_MS) {
    existing.count++
    return { isDuplicate: true, count: existing.count }
  }

  seenErrors.set(fingerprint, { count: 1, firstSeen: now })

  // 清理过期条目
  setTimeout(() => seenErrors.delete(fingerprint), DEDUP_WINDOW_MS)

  return { isDuplicate: false, count: 1 }
}

/**
 * 丰富错误上下文 - 添加 OpenReplay sessionId
 */
function enrichError(error: Partial<ObservabilityError>): ObservabilityError {
  const traceContext = getCurrentTraceContext()
  const sessionId = getSessionId()
  const sessionUrl = getSessionUrl()

  return {
    id: error.id || nanoid(),
    source: error.source || 'js',
    severity: error.severity || 'error',
    message: error.message || $t('observability.error.unknownError'),
    stack: error.stack,
    timestamp: error.timestamp || Date.now(),
    traceId: error.traceId || traceContext.traceId,
    spanId: error.spanId || traceContext.spanId,
    code: error.code,
    httpStatus: error.httpStatus,
    problemType: error.problemType,
    user: error.user,
    page: error.page || {
      url: window.location.href,
      route: window.location.pathname,
      referrer: document.referrer,
    },
    browser: error.browser || {
      userAgent: navigator.userAgent,
      language: navigator.language,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
    },
    context: {
      ...error.context,
      // OpenReplay 关联
      sessionId,
      sessionUrl,
    },
    tags: {
      ...error.tags,
      environment: config?.environment || 'unknown',
      version: config?.serviceVersion || 'unknown',
      // 用于 SigNoz 过滤
      'error.source': error.source || 'js',
      ...(sessionId && { 'session.id': sessionId }),
    },
  }
}

/**
 * 核心错误捕获函数
 */
export function captureError(
  error: Error | string,
  options: {
    source?: ErrorSource
    severity?: ErrorSeverity
    traceId?: string
    code?: number
    httpStatus?: number
    problemType?: string
    context?: Record<string, unknown>
    tags?: Record<string, string>
  } = {},
): ObservabilityError | null {
  const errorObj = typeof error === 'string' ? new Error(error) : error

  const partialError: Partial<ObservabilityError> = {
    source: options.source || 'js',
    severity: options.severity || 'error',
    message: errorObj.message,
    stack: errorObj.stack,
    traceId: options.traceId,
    code: options.code,
    httpStatus: options.httpStatus,
    problemType: options.problemType,
    context: options.context,
    tags: options.tags,
  }

  // 检查是否忽略
  if (shouldIgnore(partialError)) {
    if (config?.debug) {
      // 开发环境调试信息
    }
    return null
  }

  // 去重检查
  const fingerprint = getErrorFingerprint(partialError)
  const { isDuplicate } = checkDuplicate(fingerprint)

  if (isDuplicate) {
    if (config?.debug) {
      // 开发环境调试信息：重复错误
    }
    // 重复错误只更新计数，不重复发送
    return null
  }

  // 采样检查
  if (!shouldSample()) {
    if (config?.debug) {
      // 开发环境调试信息：已采样过滤
    }
    return null
  }

  // 丰富错误上下文
  const enrichedError = enrichError(partialError)

  // 1. 记录到 OpenTelemetry span
  recordError(errorObj, {
    'error.source': enrichedError.source,
    'error.code': String(enrichedError.code || ''),
    'error.trace_id': enrichedError.traceId || '',
    'session.id': (enrichedError.context?.sessionId as string) || '',
  })

  // 2. 发送到 SigNoz (通过 OTEL Logs)
  sendToSigNoz(enrichedError, config!)

  // 3. 同步到 OpenReplay (用于回放时显示错误标记)
  trackReplayError(errorObj, {
    traceId: enrichedError.traceId,
    source: enrichedError.source,
    code: enrichedError.code,
  })

  // 添加到本地缓冲区
  errorBuffer.push(enrichedError)
  if (errorBuffer.length > MAX_BUFFER_SIZE) {
    errorBuffer.shift()
  }

  // 调试输出（仅开发环境）
  if (config?.debug) {
    // 开发环境可以在这里添加详细的调试信息
    // 生产环境不输出任何日志
  }

  return enrichedError
}

/**
 * 捕获 Vue 组件错误
 */
export function captureVueError(
  error: Error,
  instance: unknown,
  info: string,
): ObservabilityError | null {
  return captureError(error, {
    source: 'vue',
    severity: 'error',
    context: {
      componentName: (instance as { $options?: { name?: string } })?.$options?.name,
      lifecycleHook: info,
    },
  })
}

/**
 * 捕获 HTTP 错误 (BusinessError)
 */
export function captureHttpError(
  error: Error & {
    code?: number
    traceId?: string
    status?: number
    type?: string
  },
): ObservabilityError | null {
  return captureError(error, {
    source: 'http',
    severity: error.status && error.status >= 500 ? 'error' : 'warning',
    traceId: error.traceId,
    code: error.code,
    httpStatus: error.status,
    problemType: error.type,
  })
}

/**
 * 捕获权限错误 (预留给 @casl/vue 集成)
 */
export function capturePermissionError(
  action: string,
  subject: string,
  reason?: string,
): ObservabilityError | null {
  return captureError(new Error(`Permission denied: ${action} on ${subject}`), {
    source: 'permission',
    severity: 'warning',
    context: {
      action,
      subject,
      reason,
    },
    tags: {
      'permission.action': action,
      'permission.subject': subject,
    },
  })
}

/**
 * 获取最近的错误
 */
export function getRecentErrors(): ObservabilityError[] {
  return [...errorBuffer]
}

/**
 * 清空错误缓冲区
 */
export function clearErrorBuffer(): void {
  errorBuffer.length = 0
}
