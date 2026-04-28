import type { CspViolationPayload, ObservabilityConfig } from '../types'

function getFrontendObservabilityEndpoint(config: ObservabilityConfig): string {
  return (
    config.frontendObservabilityEndpoint ||
    config.sourcemapResolverEndpoint ||
    config.otelTracesEndpoint ||
    config.otelEndpoint ||
    ''
  )
}

export async function sendCspViolationReport(
  payload: CspViolationPayload,
  config: ObservabilityConfig,
): Promise<void> {
  const endpoint = getFrontendObservabilityEndpoint(config)

  try {
    const response = await fetch(`${endpoint}/v1/security/csp-reports`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
    })

    if (!response.ok && config.debug) {
      console.warn('[SecurityReport] Failed to send CSP violation:', response.status)
    }
  } catch (error) {
    if (config.debug) {
      console.warn('[SecurityReport] Failed to send CSP violation:', error)
    }
  }
}
