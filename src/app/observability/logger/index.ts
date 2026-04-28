import { getCurrentTraceContext } from '../otel/tracer'
import { getSessionId, getSessionUrl } from '../replay/openreplay'
import { sendEventEnvelope } from '../transports/events-transport'
import type {
  FrontendEventEnvelope,
  FrontendEventLevel,
  LoggerEventOptions,
  ObservabilityConfig,
} from '../types'
import { nanoid } from '../utils/nanoid'

let config: ObservabilityConfig | null = null

function shouldSend(level: FrontendEventLevel, currentConfig: ObservabilityConfig): boolean {
  if (!currentConfig.enabled) {
    return false
  }

  if (level === 'debug' && currentConfig.environment === 'production' && !currentConfig.debug) {
    return false
  }

  return true
}

function buildReleaseTags(currentConfig: ObservabilityConfig): Record<string, string> {
  return Object.fromEntries(
    [
      ['git.commit', currentConfig.gitCommit],
      ['git.branch', currentConfig.gitBranch],
      ['build.id', currentConfig.buildId],
      ['release.channel', currentConfig.releaseChannel],
    ].filter((entry): entry is [string, string] => Boolean(entry[1])),
  )
}

function buildEventEnvelope(
  level: FrontendEventLevel,
  message: string,
  options: LoggerEventOptions,
  currentConfig: ObservabilityConfig,
): FrontendEventEnvelope {
  const trace = getCurrentTraceContext()
  const sessionId = getSessionId()
  const sessionUrl = getSessionUrl()

  return {
    eventId: nanoid(),
    timestamp: Date.now(),
    category: 'log',
    level,
    message,
    service: {
      name: currentConfig.serviceName,
      version: currentConfig.serviceVersion,
      environment: currentConfig.environment,
      release: currentConfig.serviceRelease,
    },
    context: {
      url: window.location.href,
      route: window.location.pathname,
    },
    session: {
      sessionId: sessionId || undefined,
      sessionUrl: sessionUrl || undefined,
    },
    trace: {
      traceId: trace.traceId,
      spanId: trace.spanId,
    },
    payload: options.data
      ? {
          kind: 'log',
          data: options.data,
        }
      : undefined,
    tags: {
      ...options.tags,
      ...(options.module ? { module: options.module } : {}),
      ...(options.component ? { component: options.component } : {}),
      ...buildReleaseTags(currentConfig),
    },
  }
}

async function emit(level: FrontendEventLevel, message: string, options: LoggerEventOptions = {}) {
  if (!config || !shouldSend(level, config)) {
    return
  }

  await sendEventEnvelope(buildEventEnvelope(level, message, options, config), config)
}

export function initLogger(nextConfig: ObservabilityConfig): void {
  config = nextConfig
}

export const logger = {
  debug(message: string, options?: LoggerEventOptions) {
    return emit('debug', message, options)
  },
  info(message: string, options?: LoggerEventOptions) {
    return emit('info', message, options)
  },
  warn(message: string, options?: LoggerEventOptions) {
    return emit('warn', message, options)
  },
  error(message: string, options?: LoggerEventOptions) {
    return emit('error', message, options)
  },
}
