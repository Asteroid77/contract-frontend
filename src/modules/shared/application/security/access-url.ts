import accessPolicy from './access-policy.json'

const ALLOWED_ACCESS_URL_PROTOCOLS = new Set(['http:', 'https:'])

const getWindowOrigin = (): string | null => {
  if (typeof window === 'undefined' || !window.location?.origin) return null
  return window.location.origin
}

type AccessPolicy = {
  accessUrlAllowedHosts: string[]
}

type AllowedAccessHostRules = {
  exactHosts: Set<string>
  wildcardHostnames: string[]
}

const getAllowedAccessHostRules = (): AllowedAccessHostRules => {
  const exactHosts = new Set<string>()
  const wildcardHostnames: string[] = []

  for (const rawValue of (accessPolicy as AccessPolicy).accessUrlAllowedHosts) {
    const value = rawValue.trim().toLowerCase()
    if (!value) continue

    if (value.startsWith('*.') && value.length > 2) {
      wildcardHostnames.push(value.slice(2))
      continue
    }

    exactHosts.add(value)
  }

  return { exactHosts, wildcardHostnames }
}

export const resolveAllowedAccessUrl = (raw: string): string | null => {
  const candidate = raw.trim()
  if (!candidate) return null

  const origin = getWindowOrigin()

  let url: URL
  try {
    url = origin ? new URL(candidate, origin) : new URL(candidate)
  } catch {
    return null
  }

  if (!ALLOWED_ACCESS_URL_PROTOCOLS.has(url.protocol)) {
    return null
  }

  if (origin && url.origin === origin) {
    return url.toString()
  }

  const { exactHosts, wildcardHostnames } = getAllowedAccessHostRules()
  const host = url.host.toLowerCase()
  const hostname = url.hostname.toLowerCase()

  if (exactHosts.has(host)) {
    return url.toString()
  }

  if (wildcardHostnames.some((suffix) => hostname !== suffix && hostname.endsWith(`.${suffix}`))) {
    return url.toString()
  }

  return null
}
