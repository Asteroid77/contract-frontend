const SCHEME_PATTERN = /^[a-zA-Z][a-zA-Z\d+.-]*:/

export function resolveEndpoint(endpoint?: string): string | undefined {
  if (!endpoint) {
    return undefined
  }

  if (SCHEME_PATTERN.test(endpoint)) {
    return endpoint
  }

  if (typeof window === 'undefined') {
    return endpoint
  }

  return new URL(endpoint, `${window.location.origin}/`).toString()
}
