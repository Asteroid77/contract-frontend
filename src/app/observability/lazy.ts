import type { App } from 'vue'
import type { InitOptions } from './index'
import type { ErrorSeverity, ErrorSource } from './types'

type ObservabilityModule = typeof import('./index')

let observabilityPromise: Promise<ObservabilityModule> | null = null
let initPromise: Promise<ObservabilityModule> | null = null

const loadObservability = () => {
  if (!observabilityPromise) {
    observabilityPromise = import('./index')
  }

  return observabilityPromise
}

const scheduleTask = (task: () => void) => {
  if (typeof window === 'undefined') {
    task()
    return
  }

  const idleWindow = window as Window & {
    requestIdleCallback?: (
      callback: (deadline: { didTimeout: boolean; timeRemaining: () => number }) => void,
      options?: { timeout: number },
    ) => number
  }

  if (typeof idleWindow.requestIdleCallback === 'function') {
    idleWindow.requestIdleCallback(() => task(), { timeout: 2000 })
    return
  }

  window.setTimeout(task, 0)
}

export function initObservabilityDeferred(app: App, options: InitOptions): void {
  if (initPromise) {
    return
  }

  initPromise = new Promise((resolve, reject) => {
    scheduleTask(() => {
      loadObservability()
        .then((module) => {
          module.initObservability(app, options)
          resolve(module)
        })
        .catch((error) => {
          initPromise = null
          reject(error)
        })
    })
  })
}

const withObservability = (callback: (module: ObservabilityModule) => void) => {
  if (!initPromise) {
    return
  }

  void initPromise
    .then((module) => {
      callback(module)
    })
    .catch(() => undefined)
}

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
): void {
  withObservability((module) => {
    module.captureError(error, options)
  })
}

export function capturePermissionError(action: string, subject: string, reason?: string): void {
  withObservability((module) => {
    module.capturePermissionError(action, subject, reason)
  })
}

export function captureVueError(error: Error, instance: unknown, info: string): void {
  withObservability((module) => {
    module.captureVueError(error, instance, info)
  })
}
