import { describe, expect, it } from 'vitest'
import { ModernQueryBuilder } from '@/modules/shared/presentation/advanced-query'
import DirectModernQueryBuilder from '@/modules/shared/presentation/advanced-query/modern/ModernQueryBuilder'

describe('shared/presentation/advanced-query/index exports', () => {
  it('re-exports ModernQueryBuilder as default modern builder component', () => {
    const component = ModernQueryBuilder as { name?: string }
    expect(ModernQueryBuilder).toBe(DirectModernQueryBuilder)
    expect(component.name).toBe('AdvancedQueryModernQueryBuilder')
  })
})
