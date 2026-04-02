export interface UserDisplayNameInput {
  name?: string | null
  discriminator?: number | string | null
}

export interface UserDisplayTextOptions {
  emptyFallback?: string
  numericNamePrefix?: string
  trimName?: boolean
}

const parseTrailingDiscriminator = (
  rawName: string,
): { baseName: string; trailingDiscriminator: string | null } => {
  const matched = rawName.match(/^(.*?)(?:\s*#\s*(-?\d+))$/)
  if (!matched) {
    return { baseName: rawName, trailingDiscriminator: null }
  }

  const baseName = matched[1] ?? ''
  const trailingDiscriminator = matched[2] ?? null
  return {
    baseName,
    trailingDiscriminator,
  }
}

const normalizeDiscriminator = (
  discriminator: number | string | null | undefined,
): string | null => {
  if (typeof discriminator === 'number') {
    if (Number.isFinite(discriminator) && discriminator > 0) {
      return String(discriminator)
    }
    return null
  }

  if (typeof discriminator === 'string') {
    const normalized = discriminator.trim()
    if (/^\d+$/.test(normalized) && Number(normalized) > 0) {
      return normalized
    }
  }

  return null
}

export function resolveUserDisplayName(input: UserDisplayNameInput): string {
  const rawName = typeof input.name === 'string' ? input.name : ''
  if (!rawName) return ''

  const { baseName, trailingDiscriminator } = parseTrailingDiscriminator(rawName)
  const explicitDiscriminatorProvided =
    input.discriminator !== undefined && input.discriminator !== null
  const explicitDiscriminator = normalizeDiscriminator(input.discriminator)
  const trailingNormalized = normalizeDiscriminator(trailingDiscriminator)

  if (explicitDiscriminatorProvided) {
    if (explicitDiscriminator) {
      return `${baseName}#${explicitDiscriminator}`
    }
    return baseName
  }

  if (trailingNormalized) {
    return `${baseName}#${trailingNormalized}`
  }

  return baseName
}

export function resolveUserDisplayText(
  name: string | null | undefined,
  options: UserDisplayTextOptions = {},
): string {
  const trimName = options.trimName ?? true
  const normalizedName = typeof name === 'string' ? (trimName ? name.trim() : name) : ''

  if (!normalizedName) {
    return options.emptyFallback ?? ''
  }

  if (options.numericNamePrefix && /^\d+$/.test(normalizedName) && Number(normalizedName) > 0) {
    return resolveUserDisplayName({
      name: options.numericNamePrefix,
      discriminator: normalizedName,
    })
  }

  return resolveUserDisplayName({ name: normalizedName })
}
