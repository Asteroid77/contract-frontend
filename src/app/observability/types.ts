/**
 * 可观测性体系类型定义
 */

/** 错误来源类型 */
export type ErrorSource = 'vue' | 'js' | 'promise' | 'http' | 'resource' | 'permission'

/** 错误严重级别 */
export type ErrorSeverity = 'debug' | 'info' | 'warning' | 'error' | 'fatal'

/** 标准化错误事件 */
export interface ObservabilityError {
  /** 唯一标识 */
  id: string
  /** 错误来源 */
  source: ErrorSource
  /** 严重级别 */
  severity: ErrorSeverity
  /** 错误消息 */
  message: string
  /** 堆栈信息 */
  stack?: string
  /** 发生时间戳 */
  timestamp: number
  /** 后端追踪 ID (RFC 7807) */
  traceId?: string
  /** 前端 span ID (OpenTelemetry) */
  spanId?: string
  /** 业务错误码 */
  code?: number
  /** HTTP 状态码 */
  httpStatus?: number
  /** RFC 7807 问题类型 */
  problemType?: string
  /** 用户信息 */
  user?: {
    id: string
    username?: string
  }
  /** 页面信息 */
  page?: {
    url: string
    route?: string
    referrer?: string
  }
  /** 浏览器/设备信息 */
  browser?: {
    userAgent: string
    language: string
    viewport?: { width: number; height: number }
  }
  /** 额外上下文 */
  context?: Record<string, unknown>
  /** 标签 */
  tags?: Record<string, string>
}

export type FrontendEventCategory = 'log' | 'custom' | 'error' | 'security'

export type FrontendEventLevel = 'debug' | 'info' | 'warn' | 'error'

export interface FrontendEventEnvelope {
  eventId: string
  timestamp: number
  category: FrontendEventCategory
  level: FrontendEventLevel
  message: string
  service: {
    name: string
    version: string
    environment: string
    release: string
  }
  context: {
    url: string
    route: string
  }
  session?: {
    sessionId?: string
    sessionUrl?: string
  }
  trace?: {
    traceId?: string
    spanId?: string
  }
  payload?: {
    kind: string
    data?: Record<string, unknown>
  }
  tags: Record<string, string>
}

export interface LoggerEventOptions {
  module?: string
  component?: string
  data?: Record<string, unknown>
  tags?: Record<string, string>
}

/** 可观测性配置 */
export interface ObservabilityConfig {
  /** 服务名称 */
  serviceName: string
  /** 服务版本 */
  serviceVersion: string
  /** 部署发布标识；用于 sourcemap / event / trace 归属 */
  serviceRelease: string
  /** 构建流水线或本地打包标识；用于排查 artifact 来源 */
  buildId?: string
  /** 构建输入分支；仅作为查询上下文，不作为 sourcemap lookup key */
  gitBranch?: string
  /** 构建输入 commit；用于审计和代码定位 */
  gitCommit?: string
  /** 发布通道；用于区分 staging / production 等环境 */
  releaseChannel?: 'development' | 'staging' | 'production'
  /** 环境 */
  environment: 'development' | 'staging' | 'production'
  /** OTLP traces 最终上报端点 */
  otelTracesEndpoint: string
  /** 已弃用：兼容旧名，语义与 otelTracesEndpoint 相同 */
  otelEndpoint?: string
  /** Frontend Observability 服务端点 */
  frontendObservabilityEndpoint?: string
  /** Source Map Resolver 端点 (可选，默认使用 frontendObservabilityEndpoint) */
  sourcemapResolverEndpoint?: string
  /** 是否启用 */
  enabled: boolean
  /** 采样率 (0-1) */
  sampleRate: number
  /** 是否启用控制台输出 */
  debug: boolean
  /** 忽略的错误模式 */
  ignoreErrors?: RegExp[]
  /** 忽略的 URL 模式 */
  ignoreUrls?: RegExp[]
}

/** 错误收集器接口 */
export interface ErrorCollector {
  /** 收集器名称 */
  name: string
  /** 初始化 */
  init(): void
  /** 销毁 */
  destroy(): void
}

/** 错误传输器接口 */
export interface ErrorTransport {
  /** 发送错误 */
  send(error: ObservabilityError): Promise<void>
  /** 批量发送 */
  flush(): Promise<void>
}
