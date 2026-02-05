/**
 * SigNoz 日志传输器
 * 通过 Source Map Resolver 解析堆栈后发送到 OTEL Collector
 */
import type { ObservabilityError, ObservabilityConfig } from '../types'

/**
 * 发送错误到 Source Map Resolver (解析后转发到 SigNoz)
 */
export async function sendToSigNoz(
  error: ObservabilityError,
  config: ObservabilityConfig,
): Promise<void> {
  if (!config.enabled) return

  // 使用 sourcemap resolver 端点 (如果配置了)
  const endpoint = config.sourcemapResolverEndpoint || config.otelEndpoint

  const payload = {
    message: error.message,
    stack: error.stack || '',
    traceId: error.traceId,
    spanId: error.spanId,
    sessionId: error.context?.sessionId as string,
    timestamp: error.timestamp,
    source: error.source,
    severity: error.severity,
    code: error.code,
    httpStatus: error.httpStatus,
    page: error.page,
    user: error.user,
    tags: error.tags,
  }

  try {
    const response = await fetch(`${endpoint}/v1/errors`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
    })

    if (!response.ok && config.debug) {
      console.warn('[SigNoz] Failed to send error:', response.status)
    }
  } catch (err) {
    if (config.debug) {
      console.warn('[SigNoz] Failed to send error:', err)
    }
  }
}

/**
 * 批量发送错误
 */
export async function sendBatchToSigNoz(
  errors: ObservabilityError[],
  config: ObservabilityConfig,
): Promise<void> {
  if (!config.enabled || errors.length === 0) return

  // 并行发送
  await Promise.allSettled(errors.map((error) => sendToSigNoz(error, config)))
}
