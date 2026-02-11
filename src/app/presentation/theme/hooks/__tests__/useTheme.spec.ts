import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick, ref } from 'vue'
import { useStorage } from '@vueuse/core'
import { useTheme } from '@/app/presentation/theme/hooks/useTheme'

vi.mock('@/_utils/i18n', () => ({
  $t: (key: string) => `t:${key}`,
}))

vi.mock('@vueuse/core', () => ({
  useStorage: vi.fn(),
}))

describe('useTheme', () => {
  const storageRef = ref<'light' | 'dark' | 'sakura'>('light')

  beforeEach(() => {
    vi.clearAllMocks()
    storageRef.value = 'light'
    vi.mocked(useStorage).mockReturnValue(storageRef as never)
    document.documentElement.removeAttribute('data-theme')
  })

  afterEach(() => {
    document.documentElement.removeAttribute('data-theme')
  })

  it('initializes with storage theme, theme list and light html attribute behavior', () => {
    const { themes, currentTheme, isDark, activeThemeOverrides } = useTheme()

    expect(useStorage).toHaveBeenCalledWith('app-theme', 'light')
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
