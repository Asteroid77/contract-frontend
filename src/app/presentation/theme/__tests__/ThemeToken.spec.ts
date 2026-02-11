import { describe, expect, it } from 'vitest'
import { colorTokens, commonTokens } from '@/app/presentation/theme/ThemeToken'

describe('ThemeToken', () => {
  it('contains common layout and spacing tokens', () => {
    expect(commonTokens.radiusSm).toBe('4px')
    expect(commonTokens.radiusMd).toBe('8px')
    expect(commonTokens.radiusLg).toBe('12px')

    expect(commonTokens.siderWidth).toBe('240px')
    expect(commonTokens.siderCollapsedWidth).toBe('64px')
    expect(commonTokens.headerHeight).toBe('64px')

    expect(commonTokens.spacingXs).toBe('4px')
    expect(commonTokens.spacingMd).toBe('16px')
    expect(commonTokens.spacingXl).toBe('32px')
  })

  it('contains light/dark/sakura color schemes with required fields', () => {
    const themes = ['light', 'dark', 'sakura'] as const
    const requiredColorKeys = [
      'primary',
      'primaryHover',
      'primaryPressed',
      'primarySuppl',
      'accent',
      'accentHover',
      'accentPressed',
      'accentSuppl',
      'bgBody',
      'bgCard',
      'textMain',
      'textBody',
      'textLight',
      'textDisabled',
      'border',
    ]

    for (const themeKey of themes) {
      const token = colorTokens[themeKey]
      expect(token).toBeTruthy()

      for (const colorKey of requiredColorKeys) {
        expect(token[colorKey as keyof typeof token]).toBeTruthy()
      }
    }
  })
})
