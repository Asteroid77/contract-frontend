import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick, ref } from 'vue'

vi.mock('@/_utils/i18n', () => ({
  $t: (key: string) => `t:${key}`,
}))

const storageRef = ref<'light' | 'dark' | 'sakura'>('light')

vi.mock('@vueuse/core', () => ({
  useStorage: vi.fn(() => storageRef),
}))

describe('useTheme', () => {
  beforeEach(() => {
    storageRef.value = 'light'
    document.documentElement.removeAttribute('data-theme')
  })

  afterEach(() => {
    document.documentElement.removeAttribute('data-theme')
  })

  it('initializes with storage theme, theme list and light html attribute behavior', async () => {
    const { useTheme } = await import('@/app/presentation/theme/hooks/useTheme')
    const { themes, currentTheme, isDark, activeThemeOverrides } = useTheme()

    expect(themes.map((item) => item.key)).toEqual(['light', 'dark', 'sakura'])
    expect(themes.map((item) => item.label)).toEqual([
      't:layout.theme.light',
      't:layout.theme.dark',
      't:layout.theme.sakura',
    ])

    expect(currentTheme.value).toBe('light')
    expect(isDark.value).toBe(false)
    expect(activeThemeOverrides.value).toBeTruthy()
    expect(document.documentElement.getAttribute('data-theme')).toBeNull()
  })

  it('setTheme updates current theme, isDark and html data-theme', async () => {
    const { useTheme } = await import('@/app/presentation/theme/hooks/useTheme')
    const { currentTheme, isDark, setTheme } = useTheme()

    setTheme('dark')
    await nextTick()

    expect(currentTheme.value).toBe('dark')
    expect(isDark.value).toBe(true)
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')

    setTheme('sakura')
    await nextTick()

    expect(currentTheme.value).toBe('sakura')
    expect(isDark.value).toBe(false)
    expect(document.documentElement.getAttribute('data-theme')).toBe('sakura')

    setTheme('light')
    await nextTick()

    expect(document.documentElement.getAttribute('data-theme')).toBeNull()
  })
})
