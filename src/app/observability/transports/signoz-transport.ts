/**
 * Error 事件传输器
 * 将前端错误统一映射到 frontend observability events ingest
 */
import { sendEventBatch, sendEventEnvelope } from './events-transport'
import type {
  FrontendEventEnvelope,
  FrontendEventLevel,
  ObservabilityConfig,
  ObservabilityError,
} from '../types'

/**
 * 将错误严重级别映射到统一 event level
 */
function toEventLevel(severity: ObservabilityError['severity']): FrontendEventLevel {
  switch (severity) {
    case 'debug':
      return 'debug'
    case 'info':
      return 'info'
    case 'warning':
      return 'warn'
    case 'error':
    case 'fatal':
      return 'error'
  }
}

function buildReleaseTags(config: ObservabilityConfig): Record<string, string> {
  return Object.fromEntries(
    [
      ['git.commit', config.gitCommit],
      ['git.branch', config.gitBranch],
      ['build.id', config.buildId],
      ['release.channel', config.releaseChannel],
    ].filter((entry): entry is [string, string] => Boolean(entry[1])),
  )
}

export function buildErrorEventEnvelope(
  error: ObservabilityError,
  config: ObservabilityConfig,
): FrontendEventEnvelope {
  return {
    eventId: error.id,
    timestamp: error.timestamp,
    category: 'error',
    level: toEventLevel(error.severity),
    message: error.message,
    service: {
      name: config.serviceName,
      version: config.serviceVersion,
      environment: config.environment,
      release: config.serviceRelease,
    },
    context: {
      url: error.page?.url || window.location.href,
      route: error.page?.route || window.location.pathname,
    },
    session: {
      sessionId: error.context?.sessionId as string | undefined,
      sessionUrl: error.context?.sessionUrl as string | undefined,
    },
    trace: {
      traceId: error.traceId,
      spanId: error.spanId,
    },
    payload: {
      kind: 'error',
      data: {
        source: error.source,
        stack: error.stack,
        code: error.code,
        httpStatus: error.httpStatus,
        problemType: error.problemType,
      },
    },
    tags: {
      ...error.tags,
      'error.source': error.source,
      ...buildReleaseTags(config),
    },
  }
}

export async function sendToSigNoz(
  error: ObservabilityError,
  config: ObservabilityConfig,
): Promise<void> {
  if (!config.enabled) {
    return
  }

  await sendEventEnvelope(buildErrorEventEnvelope(error, config), config)
}

/**
 * 批量发送错误
 */
export async function sendBatchToSigNoz(
  errors: ObservabilityError[],
  config: ObservabilityConfig,
): Promise<void> {
  if (!config.enabled || errors.length === 0) return

  await sendEventBatch(
    errors.map((error) => buildErrorEventEnvelope(error, config)),
    config,
  )
}
