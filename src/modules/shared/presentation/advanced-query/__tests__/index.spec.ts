import { describe, expect, it } from 'vitest'
import { ModernQueryBuilder } from '@/modules/shared/presentation/advanced-query'
import DirectModernQueryBuilder from '@/modules/shared/presentation/advanced-query/modern/ModernQueryBuilder'

describe('shared/presentation/advanced-query/index exports', () => {
  it('re-exports ModernQueryBuilder as default modern builder component', () => {
    expect(ModernQueryBuilder).toBe(DirectModernQueryBuilder)
    expect((ModernQueryBuilder as any).name).toBe('AdvancedQueryModernQueryBuilder')
  })
})
