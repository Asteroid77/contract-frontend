/**
 * OpenReplay Session Replay 集成
 */
import Tracker from '@openreplay/tracker'
import { installTrustedTypesWorkerConstructors } from '@/modules/shared/application/security/trusted-types'
import type { ObservabilityConfig } from '../types'
import { resolveEndpoint } from '../utils/resolve-endpoint'

let tracker: Tracker | null = null
let isInitialized = false
let releaseTrustedWorkerScriptUrls: (() => void) | null = null

export interface OpenReplayConfig {
  /** OpenReplay 项目 Key */
  projectKey: string
  /** OpenReplay Ingest 端点 (自托管) */
  ingestPoint?: string
  /** 是否启用 */
  enabled?: boolean
  /** 是否在控制台输出日志 */
  verbose?: boolean
  /** 隐私设置 */
  privacy?: {
    /** 默认输入模式: plain | obscured | hidden */
    defaultInputMode?: 'plain' | 'obscured' | 'hidden'
    /** 是否遮盖文本 */
    obscureTextEmails?: boolean
    /** 是否遮盖数字 */
    obscureTextNumbers?: boolean
  }
}

/**
 * 初始化 OpenReplay
 */
export function initOpenReplay(
  config: OpenReplayConfig,
  _observabilityConfig?: ObservabilityConfig,
): Tracker | null {
  if (isInitialized && tracker) {
    console.warn('[OpenReplay] Already initialized')
    return tracker
  }

  if (config.enabled === false) {
    console.log('[OpenReplay] Disabled')
    return null
  }

  const ingestPoint = resolveEndpoint(config.ingestPoint || '/observability/frontend/replay')

  releaseTrustedWorkerScriptUrls = installTrustedTypesWorkerConstructors()

  try {
    tracker = new Tracker({
      projectKey: config.projectKey,
      ingestPoint,
      __DISABLE_SECURE_MODE: import.meta.env.DEV, // 开发环境允许 HTTP
      network: {
        capturePayload: true, // 捕获请求/响应体
        failuresOnly: false,
        sessionTokenHeader: 'X-OpenReplay-SessionToken',
        ignoreHeaders: ['Authorization', 'Cookie'], // 隐私保护
        captureInIframes: false,
      },
      obscureTextEmails: config.privacy?.obscureTextEmails ?? true,
      obscureTextNumbers: config.privacy?.obscureTextNumbers ?? false,
    })
  } catch (error) {
    releaseTrustedWorkerScriptUrls?.()
    releaseTrustedWorkerScriptUrls = null
    throw error
  }

  // 启动追踪
  tracker.start().then((sessionInfo) => {
    if (sessionInfo && 'sessionID' in sessionInfo && sessionInfo.sessionID) {
      console.log('[OpenReplay] Session started:', sessionInfo.sessionID)
      // 存储 sessionId 供其他模块使用
      sessionStorage.setItem('openreplay_session_id', sessionInfo.sessionID)
    }
  })

  isInitialized = true
  console.log('[OpenReplay] Initialized', {
    projectKey: config.projectKey,
    ingestPoint,
  })

  return tracker
}

/**
 * 获取 OpenReplay Tracker 实例
 */
export function getTracker(): Tracker | null {
  return tracker
}

/**
 * 获取当前 Session ID
 */
export function getSessionId(): string | null {
  return tracker?.getSessionID() ?? sessionStorage.getItem('openreplay_session_id')
}

/**
 * 获取 Session 回放 URL
 */
export function getSessionUrl(): string | null {
  return tracker?.getSessionURL() ?? null
}

/**
 * 设置用户身份
 */
export function setUser(userId: string, metadata?: Record<string, string>): void {
  if (!tracker) return
  tracker.setUserID(userId)
  if (metadata) {
    Object.entries(metadata).forEach(([key, value]) => {
      tracker?.setMetadata(key, value)
    })
  }
}

/**
 * 记录自定义事件
 */
export function trackEvent(name: string, payload?: Record<string, unknown>): void {
  if (!tracker) return
  tracker.event(name, payload)
}

/**
 * 记录错误到 OpenReplay
 */
export function trackError(error: Error, metadata?: Record<string, unknown>): void {
  if (!tracker) return

  // OpenReplay 会自动捕获错误，但我们可以添加额外上下文
  tracker.event('error', {
    message: error.message,
    stack: error.stack,
    ...metadata,
  })
}

/**
 * 记录 Issue (带追踪 ID 关联)
 */
export function trackIssue(
  message: string,
  payload?: Record<string, unknown> & { traceId?: string },
): void {
  if (!tracker) return
  tracker.issue(message, payload)
}

/**
 * 停止 OpenReplay
 */
export function stopOpenReplay(): void {
  if (tracker) {
    tracker.stop()
    tracker = null
    isInitialized = false
    sessionStorage.removeItem('openreplay_session_id')
    releaseTrustedWorkerScriptUrls?.()
    releaseTrustedWorkerScriptUrls = null
    console.log('[OpenReplay] Stopped')
  }
}
