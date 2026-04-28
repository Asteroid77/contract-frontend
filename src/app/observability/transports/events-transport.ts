import type { FrontendEventEnvelope, ObservabilityConfig } from '../types'

function getEventsEndpoint(config: ObservabilityConfig): string {
  return (
    config.frontendObservabilityEndpoint ||
    config.sourcemapResolverEndpoint ||
    config.otelTracesEndpoint ||
    config.otelEndpoint ||
    ''
  )
}

export async function sendEventEnvelope(
  event: FrontendEventEnvelope,
  config: ObservabilityConfig,
): Promise<void> {
  if (!config.enabled) {
    return
  }

  try {
    const response = await fetch(`${getEventsEndpoint(config)}/v1/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
      keepalive: true,
    })

    if (!response.ok && config.debug) {
      console.warn('[EventsTransport] Failed to send event:', response.status)
    }
  } catch (error) {
    if (config.debug) {
      console.warn('[EventsTransport] Failed to send event:', error)
    }
  }
}

export async function sendEventBatch(
  events: FrontendEventEnvelope[],
  config: ObservabilityConfig,
): Promise<void> {
  if (!config.enabled || events.length === 0) {
    return
  }

  try {
    const response = await fetch(`${getEventsEndpoint(config)}/v1/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(events),
      keepalive: true,
    })

    if (!response.ok && config.debug) {
      console.warn('[EventsTransport] Failed to send events:', response.status)
    }
  } catch (error) {
    if (config.debug) {
      console.warn('[EventsTransport] Failed to send events:', error)
    }
  }
}
