import { afterEach, describe, expect, it, vi } from 'vitest'

const loadTimeModule = async (locale: 'zh-CN' | 'en') => {
  vi.resetModules()
  vi.doMock('@/_utils/i18n', () => ({
    language: {
      value: locale,
    },
  }))
  return import('@/modules/shared/presentation/time/index')
}

describe('shared/presentation/time/index', () => {
  afterEach(() => {
    vi.useRealTimers()
    vi.doUnmock('@/_utils/i18n')
  })

  it('formatted returns expected keys and deterministic standard/custom formats', async () => {
    const { formatted } = await loadTimeModule('zh-CN')

    const result = formatted('2026-02-10 13:00:00')

    expect(result).toEqual(
      expect.objectContaining({
        standard: '2026-02-10 13:00:00',
        custom: '02月10日 13:00',
      }),
    )
    expect(result.long.length).toBeGreaterThan(0)
    expect(result.short.length).toBeGreaterThan(0)
    expect(result.relative.length).toBeGreaterThan(0)
  })

  it('initializes locale from language value at module load', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-02-10T13:00:30'))

    const zhModule = await loadTimeModule('zh-CN')
    const zhResult = zhModule.formatted('2026-02-10 13:00:00')

    const enModule = await loadTimeModule('en')
    const enResult = enModule.formatted('2026-02-10 13:00:00')

    expect(zhResult.long).toContain('年')
    expect(zhResult.relative).toContain('前')

    expect(enResult.long).not.toContain('年')
    expect(enResult.relative.toLowerCase()).toContain('ago')
  })
})
