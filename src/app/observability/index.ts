/**
 * 可观测性体系初始化入口
 * 架构: OTEL JS SDK + SigNoz + OpenReplay
 */
import type { App } from 'vue'
import type { ObservabilityConfig } from './types'
import { initTracer, shutdownTracer } from './otel/tracer'
import { initErrorCollector } from './collectors/error-collector'
import { jsErrorCollector } from './collectors/js-error-collector'
import { securityPolicyCollector } from './collectors/security-policy-collector'
import { setupVueErrorHandler } from './collectors/vue-error-collector'
import { initLogger } from './logger'
import { resolveEndpoint } from './utils/resolve-endpoint'
import {
  initOpenReplay,
  stopOpenReplay,
  getSessionId,
  getSessionUrl,
  setUser as setReplayUser,
  type OpenReplayConfig,
} from './replay/openreplay'

let isInitialized = false

export interface InitOptions {
  /** 可观测性配置 */
  observability?: Partial<ObservabilityConfig>
  /** OpenReplay 配置 */
  openReplay?: OpenReplayConfig
}

/**
 * 默认配置
 */
function getDefaultConfig(): ObservabilityConfig {
  const isDev = import.meta.env.DEV
  const defaultOtelTracesEndpoint =
    resolveEndpoint(
      import.meta.env.VITE_OTEL_TRACES_ENDPOINT || import.meta.env.VITE_OTEL_ENDPOINT,
    ) || '/observability/frontend/v1/traces'

  return {
    serviceName: import.meta.env.VITE_APP_NAME || 'contract-frontend',
    serviceVersion: import.meta.env.VITE_APP_VERSION || '0.0.0',
    serviceRelease:
      import.meta.env.VITE_APP_RELEASE ||
      import.meta.env.VITE_APP_VERSION ||
      __GIT_COMMIT_HASH__ ||
      '0.0.0',
    buildId: import.meta.env.VITE_APP_BUILD_ID,
    gitBranch: import.meta.env.VITE_GIT_BRANCH || __GIT_BRANCH__,
    gitCommit: import.meta.env.VITE_GIT_COMMIT || __GIT_COMMIT_HASH__,
    releaseChannel: import.meta.env.VITE_RELEASE_CHANNEL || (isDev ? 'development' : 'production'),
    environment: isDev ? 'development' : 'production',
    otelTracesEndpoint: defaultOtelTracesEndpoint,
    otelEndpoint: defaultOtelTracesEndpoint,
    frontendObservabilityEndpoint:
      resolveEndpoint(import.meta.env.VITE_FRONTEND_OBSERVABILITY_ENDPOINT) ||
      '/observability/frontend',
    sourcemapResolverEndpoint:
      resolveEndpoint(import.meta.env.VITE_SOURCEMAP_RESOLVER_ENDPOINT) ||
      resolveEndpoint(import.meta.env.VITE_FRONTEND_OBSERVABILITY_ENDPOINT) ||
      '/observability/frontend',
    enabled: !isDev, // 生产环境默认启用
    sampleRate: isDev ? 1.0 : 0.1, // 开发环境全采样，生产环境 10%
    debug: isDev,
    ignoreErrors: [
      /ResizeObserver loop/i,
      /Loading chunk \d+ failed/i,
      /Network Error/i,
      /AbortError/i,
      /cancelled/i,
    ],
    ignoreUrls: [/extensions\//i, /^chrome:\/\//i, /^moz-extension:\/\//i],
  }
}

/**
 * 初始化可观测性体系
 */
export function initObservability(app: App, options: InitOptions = {}): void {
  if (isInitialized) {
    console.warn('[Observability] Already initialized')
    return
  }

  const explicitOtelTracesEndpoint = resolveEndpoint(options.observability?.otelTracesEndpoint)
  const explicitLegacyOtelEndpoint = resolveEndpoint(options.observability?.otelEndpoint)

  const config: ObservabilityConfig = {
    ...getDefaultConfig(),
    ...options.observability,
  }

  config.otelTracesEndpoint =
    explicitOtelTracesEndpoint ||
    explicitLegacyOtelEndpoint ||
    resolveEndpoint(config.otelTracesEndpoint || config.otelEndpoint) ||
    `${window.location.origin}/observability/frontend/v1/traces`
  config.otelEndpoint = config.otelTracesEndpoint
  config.frontendObservabilityEndpoint =
    resolveEndpoint(config.frontendObservabilityEndpoint) ||
    `${window.location.origin}/observability/frontend`
  config.sourcemapResolverEndpoint = resolveEndpoint(config.sourcemapResolverEndpoint)

  console.log('[Observability] Initializing...', {
    serviceName: config.serviceName,
    environment: config.environment,
    enabled: config.enabled,
  })

  // 1. 初始化统一 logger
  initLogger(config)

  // 2. 初始化错误收集器核心
  initErrorCollector(config)

  // 3. 初始化 OpenTelemetry 追踪器
  initTracer(config)

  // 4. 初始化 OpenReplay (如果配置了)
  if (options.openReplay?.projectKey) {
    initOpenReplay(options.openReplay, config)
  }

  // 5. 安装 Vue 错误处理器
  setupVueErrorHandler(app)

  // 6. 初始化全局 JS 错误收集器
  jsErrorCollector.init()

  // 7. 初始化 CSP violation 收集器
  securityPolicyCollector.init(config)

  isInitialized = true
  console.log('[Observability] Initialized successfully')
}

/**
 * 关闭可观测性体系
 */
export async function shutdownObservability(): Promise<void> {
  if (!isInitialized) return

  jsErrorCollector.destroy()
  securityPolicyCollector.destroy()
  stopOpenReplay()
  await shutdownTracer()

  isInitialized = false
  console.log('[Observability] Shutdown complete')
}

/**
 * 设置当前用户 (用于错误关联)
 */
export function setUser(userId: string, metadata?: { username?: string; email?: string }): void {
  // 同步到 OpenReplay
  setReplayUser(userId, metadata as Record<string, string>)
}

/**
 * 获取当前会话信息 (用于支持反馈等场景)
 */
export function getSessionInfo(): { sessionId: string | null; sessionUrl: string | null } {
  return {
    sessionId: getSessionId(),
    sessionUrl: getSessionUrl(),
  }
}

// 导出公共 API
export {
  captureError,
  captureVueError,
  captureHttpError,
  capturePermissionError,
  getRecentErrors,
} from './collectors/error-collector'

export { getTracer, withSpan, getCurrentTraceContext, recordError } from './otel/tracer'

export { getSessionId, getSessionUrl, trackEvent, trackIssue } from './replay/openreplay'

export { logger } from './logger'

export type { ObservabilityError, ObservabilityConfig, ErrorSource, ErrorSeverity } from './types'

export type { OpenReplayConfig } from './replay/openreplay'
