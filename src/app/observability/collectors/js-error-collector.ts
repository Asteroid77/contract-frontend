/**
 * 全局 JavaScript 错误收集器
 * 捕获 window.onerror 和 unhandledrejection
 */
import { captureError } from './error-collector'
import type { ErrorCollector } from '../types'

let isInitialized = false

/**
 * 处理全局 JS 错误
 */
function handleGlobalError(
  event: ErrorEvent | string,
  source?: string,
  lineno?: number,
  colno?: number,
  error?: Error,
): void {
  // ErrorEvent 对象
  if (event instanceof ErrorEvent) {
    captureError(event.error || new Error(event.message), {
      source: 'js',
      severity: 'error',
      context: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      },
    })
    return
  }

  // 传统 onerror 参数
  captureError(error || new Error(String(event)), {
    source: 'js',
    severity: 'error',
    context: {
      filename: source,
      lineno,
      colno,
    },
  })
}

/**
 * 处理未捕获的 Promise 拒绝
 */
function handleUnhandledRejection(event: PromiseRejectionEvent): void {
  const error =
    event.reason instanceof Error ? event.reason : new Error(String(event.reason || 'Unknown'))

  captureError(error, {
    source: 'promise',
    severity: 'error',
    context: {
      type: 'unhandledrejection',
      reason: event.reason,
    },
  })
}

/**
 * 处理资源加载错误
 */
function handleResourceError(event: Event): void {
  const target = event.target as HTMLElement & { src?: string; href?: string }

  if (target && (target.src || target.href)) {
    captureError(new Error(`Resource failed to load: ${target.src || target.href}`), {
      source: 'resource',
      severity: 'warning',
      context: {
        tagName: target.tagName,
        src: target.src,
        href: target.href,
      },
    })
  }
}

/**
 * 全局 JS 错误收集器
 */
export const jsErrorCollector: ErrorCollector = {
  name: 'js-error-collector',

  init(): void {
    if (isInitialized) return

    // 全局错误处理
    window.addEventListener('error', handleGlobalError as EventListener)

    // 未捕获的 Promise 拒绝
    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    // 资源加载错误（使用捕获阶段）
    window.addEventListener('error', handleResourceError, true)

    isInitialized = true
    // 初始化完成（生产环境不输出日志）
  },

  destroy(): void {
    window.removeEventListener('error', handleGlobalError as EventListener)
    window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    window.removeEventListener('error', handleResourceError, true)
    isInitialized = false
  },
}
