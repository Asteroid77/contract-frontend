import { describe, expect, it } from 'vitest'
import { resolveEndpoint } from '@/app/observability/utils/resolve-endpoint'

describe('resolveEndpoint', () => {
  it('keeps absolute endpoints unchanged', () => {
    expect(resolveEndpoint('https://otel.example.com')).toBe('https://otel.example.com')
    expect(resolveEndpoint('http://localhost:4318')).toBe('http://localhost:4318')
  })

  it('resolves same-origin relative endpoints to absolute URLs', () => {
    expect(resolveEndpoint('/observability/otel')).toBe(
      `${window.location.origin}/observability/otel`,
    )
    expect(resolveEndpoint('observability/replay')).toBe(
      `${window.location.origin}/observability/replay`,
    )
  })

  it('returns undefined when endpoint is empty', () => {
    expect(resolveEndpoint(undefined)).toBeUndefined()
    expect(resolveEndpoint('')).toBeUndefined()
  })
})
