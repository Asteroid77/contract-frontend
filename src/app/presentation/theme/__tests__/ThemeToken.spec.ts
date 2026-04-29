import { describe, expect, it } from 'vitest'
import {
  borderTokens,
  colorTokens,
  componentSizeTokens,
  commonTokens,
  elevationTokens,
  layerTokens,
  motionTokens,
  opacityTokens,
  primitiveColorTokens,
  semanticColorTokens,
  spacingScaleTokens,
  statusToneNames,
  themeNames,
  typographyTokens,
} from '@/app/presentation/theme/ThemeToken'

describe('ThemeToken', () => {
  it('contains common layout and spacing tokens in rem', () => {
    expect(commonTokens.radiusSm).toBe('0.25rem')
    expect(commonTokens.radiusMd).toBe('0.5rem')
    expect(commonTokens.radiusLg).toBe('0.75rem')

    expect(commonTokens.siderWidth).toBe('15rem')
    expect(commonTokens.siderCollapsedWidth).toBe('4rem')
    expect(commonTokens.headerHeight).toBe('4rem')

    expect(commonTokens.layoutMaxWidth).toBe('90rem')
    expect(commonTokens.layoutContentMaxWidth).toBe('75rem')

    expect(commonTokens.spacingXs).toBe('0.25rem')
    expect(commonTokens.spacingMd).toBe('1rem')
    expect(commonTokens.spacingXl).toBe('2rem')
    expect(spacingScaleTokens['spacing/120']).toBe('7.5rem')
  })

  it('contains primitive and semantic color tokens', () => {
    expect(primitiveColorTokens['red-500']).toBe('#EF4444')
    expect(primitiveColorTokens['green-500']).toBe('#22C55E')

    expect(semanticColorTokens.light['color/semantic/error']).toBe('#EF4444')
    expect(semanticColorTokens.dark['color/semantic/success']).toBe('#4ADE80')

    expect(semanticColorTokens.light['color/primary/default']).toBe(colorTokens.light.primary)
  })

  it('contains light/dark/sakura color schemes with required fields', () => {
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
      'surfaceRaised',
      'surfaceSubtle',
      'surfaceOverlay',
      'fillHover',
      'fillSelected',
      'focusRing',
      'link',
      'linkHover',
      'warning',
    ]

    expect(themeNames).toEqual(['light', 'dark', 'sakura'])

    for (const themeKey of themeNames) {
      const token = colorTokens[themeKey]
      expect(token).toBeTruthy()

      for (const colorKey of requiredColorKeys) {
        expect(token[colorKey as keyof typeof token]).toBeTruthy()
      }
    }
  })

  it('contains typography and component size tokens aligned to the design contract', () => {
    expect(typographyTokens['font/size/body']).toBe('0.875rem')
    expect(typographyTokens['font/size/title']).toBe('1.25rem')
    expect(typographyTokens['font/weight/medium']).toBe('500')
    expect(typographyTokens['line-height/body']).toBe('1.6')

    expect(componentSizeTokens['component/control/height/medium']).toBe('2.25rem')
    expect(componentSizeTokens['component/table/row-height']).toBe('3rem')
    expect(componentSizeTokens['component/interactive/min-target']).toBe('1.5rem')
  })

  it('contains motion, layer, opacity, elevation and border tokens for shared interaction primitives', () => {
    expect(motionTokens['motion/duration/fast']).toBe('120ms')
    expect(motionTokens['motion/easing/standard']).toBe('cubic-bezier(0.4, 0, 0.2, 1)')
    expect(motionTokens['motion/transition/base']).toBe('180ms cubic-bezier(0.4, 0, 0.2, 1)')

    expect(layerTokens['layer/dropdown']).toBe('1000')
    expect(layerTokens['layer/modal']).toBe('1200')
    expect(layerTokens['layer/tooltip']).toBe('1400')

    expect(opacityTokens['opacity/disabled']).toBe('0.48')
    expect(opacityTokens['opacity/overlay']).toBe('0.72')

    expect(elevationTokens['elevation/card']).toBe(commonTokens.shadowSm)
    expect(elevationTokens['elevation/popover']).toBe(commonTokens.shadowLg)
    expect(elevationTokens['elevation/modal']).toBe(commonTokens.shadowXl)

    expect(borderTokens['border/width/default']).toBe('1px')
    expect(borderTokens['border/style/default']).toBe('solid')
    expect(borderTokens['border/focus-ring-width']).toBe('0.125rem')
  })

  it('contains status semantic tokens for every theme and status tone', () => {
    expect(statusToneNames).toEqual(['draft', 'pending', 'approved', 'rejected', 'archived'])

    for (const themeKey of themeNames) {
      const tokens = semanticColorTokens[themeKey]

      for (const statusTone of statusToneNames) {
        expect(tokens[`color/status/${statusTone}/text`]).toBeTruthy()
        expect(tokens[`color/status/${statusTone}/background`]).toBeTruthy()
        expect(tokens[`color/status/${statusTone}/border`]).toBeTruthy()
      }
    }
  })
})
