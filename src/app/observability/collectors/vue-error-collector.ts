/**
 * Vue 错误收集器
 * 设置 app.config.errorHandler
 */
import type { App, ComponentPublicInstance } from 'vue'
import { captureVueError } from './error-collector'

/**
 * 安装 Vue 错误处理器
 */
export function setupVueErrorHandler(app: App): void {
  // 保留原有的 errorHandler（如果有）
  const originalHandler = app.config.errorHandler

  app.config.errorHandler = (
    err: unknown,
    instance: ComponentPublicInstance | null,
    info: string,
  ): void => {
    // 捕获到可观测性系统
    if (err instanceof Error) {
      captureVueError(err, instance, info)
    } else {
      captureVueError(new Error(String(err)), instance, info)
    }

    // 调用原有 handler
    if (originalHandler) {
      originalHandler(err, instance, info)
    }

    // 开发环境同时输出到控制台
    if (import.meta.env.DEV) {
      console.error('[Vue Error]', err)
      console.error('Component:', instance?.$options?.name || 'Anonymous')
      console.error('Info:', info)
    }
  }

  // 设置警告处理器（仅开发环境）
  if (import.meta.env.DEV) {
    app.config.warnHandler = (msg, instance, trace) => {
      console.warn('[Vue Warning]', msg)
      if (trace) {
        console.warn('Trace:', trace)
      }
    }
  }
}
