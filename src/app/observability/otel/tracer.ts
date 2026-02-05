/**
 * OpenTelemetry 追踪器配置
 */
import {
  WebTracerProvider,
  BatchSpanProcessor,
  SimpleSpanProcessor,
} from '@opentelemetry/sdk-trace-web'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'
import { ZoneContextManager } from '@opentelemetry/context-zone'
import { resourceFromAttributes } from '@opentelemetry/resources'
import { SEMRESATTRS_SERVICE_NAME, SEMRESATTRS_SERVICE_VERSION } from '@opentelemetry/semantic-conventions'
import { registerInstrumentations } from '@opentelemetry/instrumentation'
import { FetchInstrumentation } from '@opentelemetry/instrumentation-fetch'
import { DocumentLoadInstrumentation } from '@opentelemetry/instrumentation-document-load'
import { trace, SpanStatusCode, type Span } from '@opentelemetry/api'
import type { ObservabilityConfig } from '../types'

let provider: WebTracerProvider | null = null
let isInitialized = false

/**
 * 初始化 OpenTelemetry 追踪器
 */
export function initTracer(config: ObservabilityConfig): void {
  if (isInitialized) {
    console.warn('[OTEL] Tracer already initialized')
    return
  }

  if (!config.enabled) {
    console.log('[OTEL] Tracing disabled')
    return
  }

  const resource = resourceFromAttributes({
    [SEMRESATTRS_SERVICE_NAME]: config.serviceName,
    [SEMRESATTRS_SERVICE_VERSION]: config.serviceVersion,
    'deployment.environment': config.environment,
  })

  const exporter = new OTLPTraceExporter({
    url: `${config.otelEndpoint}/v1/traces`,
    headers: {},
  })

  // 使用 SimpleSpanProcessor 用于开发，BatchSpanProcessor 用于生产
  const spanProcessor = config.debug
    ? new SimpleSpanProcessor(exporter)
    : new BatchSpanProcessor(exporter)

  provider = new WebTracerProvider({
    resource,
    spanProcessors: [spanProcessor],
  })

  provider.register({
    contextManager: new ZoneContextManager(),
  })

  // 注册自动埋点
  registerInstrumentations({
    instrumentations: [
      new FetchInstrumentation({
        propagateTraceHeaderCorsUrls: [/.*/], // 传播 trace header 到所有请求
        clearTimingResources: true,
        applyCustomAttributesOnSpan: (span, _request, result) => {
          // 从响应中提取 traceId
          if (result instanceof Response) {
            const traceId = result.headers.get('x-trace-id')
            if (traceId) {
              span.setAttribute('backend.trace_id', traceId)
            }
          }
        },
      }),
      new DocumentLoadInstrumentation(),
    ],
  })

  isInitialized = true
  console.log('[OTEL] Tracer initialized', {
    serviceName: config.serviceName,
    endpoint: config.otelEndpoint,
  })
}

/**
 * 获取追踪器实例
 */
export function getTracer(name: string = 'default') {
  return trace.getTracer(name)
}

/**
 * 获取当前活动的 Span
 */
export function getActiveSpan(): Span | undefined {
  return trace.getActiveSpan()
}

/**
 * 获取当前 trace context
 */
export function getCurrentTraceContext(): { traceId?: string; spanId?: string } {
  const span = getActiveSpan()
  if (!span) return {}

  const spanContext = span.spanContext()
  return {
    traceId: spanContext.traceId,
    spanId: spanContext.spanId,
  }
}

/**
 * 创建一个新的 Span 并执行函数
 */
export async function withSpan<T>(
  name: string,
  fn: (span: Span) => Promise<T>,
  attributes?: Record<string, string | number | boolean>,
): Promise<T> {
  const tracer = getTracer()
  return tracer.startActiveSpan(name, async (span) => {
    try {
      if (attributes) {
        Object.entries(attributes).forEach(([key, value]) => {
          span.setAttribute(key, value)
        })
      }
      const result = await fn(span)
      span.setStatus({ code: SpanStatusCode.OK })
      return result
    } catch (error) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error instanceof Error ? error.message : String(error),
      })
      span.recordException(error as Error)
      throw error
    } finally {
      span.end()
    }
  })
}

/**
 * 记录错误到当前 Span
 */
export function recordError(error: Error, attributes?: Record<string, string>): void {
  const span = getActiveSpan()
  if (span) {
    span.recordException(error)
    span.setStatus({
      code: SpanStatusCode.ERROR,
      message: error.message,
    })
    if (attributes) {
      Object.entries(attributes).forEach(([key, value]) => {
        span.setAttribute(key, value)
      })
    }
  }
}

/**
 * 关闭追踪器
 */
export async function shutdownTracer(): Promise<void> {
  if (provider) {
    await provider.shutdown()
    isInitialized = false
    provider = null
    console.log('[OTEL] Tracer shutdown')
  }
}
