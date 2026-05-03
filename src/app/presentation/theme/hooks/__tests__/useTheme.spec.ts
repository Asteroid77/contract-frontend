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

  it('bridges design-system tokens into Naive UI component overrides', async () => {
    const {
      borderTokens,
      colorTokens,
      commonTokens,
      componentSizeTokens,
      elevationTokens,
      motionTokens,
      opacityTokens,
      semanticColorTokens,
      typographyTokens,
    } = await import('@/app/presentation/theme/ThemeToken')
    const { createThemeBridge } = await import('@/app/presentation/theme/hooks/useTheme')

    const bridge = createThemeBridge(colorTokens.light)

    expect(bridge.common?.fontSize).toBe(typographyTokens['font/size/body'])
    expect(bridge.common?.fontSizeMedium).toBe(typographyTokens['font/size/body'])
    expect(bridge.common?.heightMedium).toBe(componentSizeTokens['component/control/height/medium'])
    expect(bridge.common?.borderRadius).toBe(commonTokens.radiusMd)
    expect(bridge.common?.borderRadiusSmall).toBe(commonTokens.radiusSm)
    expect(bridge.common?.opacityDisabled).toBe(opacityTokens['opacity/disabled'])
    expect(bridge.common?.boxShadow1).toBe(elevationTokens['elevation/card'])
    expect(bridge.common?.boxShadow2).toBe(elevationTokens['elevation/popover'])
    expect(bridge.common?.boxShadow3).toBe(elevationTokens['elevation/modal'])
    expect(bridge.common?.cubicBezierEaseInOut).toBe(motionTokens['motion/easing/standard'])
    expect(bridge.common?.successColor).toBe(
      semanticColorTokens.light['color/status/approved/text'],
    )
    expect(bridge.common?.warningColor).toBe(semanticColorTokens.light['color/status/pending/text'])
    expect(bridge.common?.errorColor).toBe(semanticColorTokens.light['color/status/rejected/text'])

    expect(bridge.DataTable?.thColor).toBe(semanticColorTokens.light['color/surface/subtle'])
    expect(bridge.DataTable?.tdColorHover).toBe(
      semanticColorTokens.light['color/interaction/hover'],
    )
    expect(bridge.DataTable?.thFontWeight).toBe(typographyTokens['font/weight/semibold'])
    expect(bridge.Card?.borderRadius).toBe(commonTokens.radiusLg)
    expect(bridge.Dialog?.borderRadius).toBe(commonTokens.radiusLg)
    expect(bridge.Menu?.itemHeight).toBe(componentSizeTokens['component/navigation/item-height'])
    expect(bridge.Menu?.borderRadius).toBe(commonTokens.radiusMd)
    expect(bridge.Menu?.itemColorActive).toBe(
      semanticColorTokens.light['color/interaction/selected'],
    )
    expect(bridge.Tag?.colorWarning).toBe(
      semanticColorTokens.light['color/status/pending/background'],
    )
    expect(bridge.Tag?.textColorSuccess).toBe(
      semanticColorTokens.light['color/status/approved/text'],
    )
    expect(bridge.Pagination?.itemColorActive).toBe(
      semanticColorTokens.light['color/interaction/selected'],
    )
    expect(bridge.Card?.boxShadow).toBe(elevationTokens['elevation/card'])
    expect(bridge.Modal?.boxShadow).toBe(elevationTokens['elevation/modal'])
    expect(bridge.Popover?.boxShadow).toBe(elevationTokens['elevation/popover'])
    expect(bridge.Spin?.opacitySpinning).toBe(opacityTokens['opacity/loading'])
    expect(bridge.Select?.peers?.InternalSelection?.border).toBe(
      `${borderTokens['border/width/default']} ${borderTokens['border/style/default']} ${colorTokens.light.border}`,
    )
  })
})
