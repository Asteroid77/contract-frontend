import { describe, expect, it } from 'vitest'
import {
  ModernQueryBuilder,
  QueryActionButtons,
} from '@/modules/shared/presentation/advanced-query'
import DirectModernQueryBuilder from '@/modules/shared/presentation/advanced-query/modern/ModernQueryBuilder'
import DirectQueryActionButtons from '@/modules/shared/presentation/advanced-query/QueryActionButtons'

describe('shared/presentation/advanced-query/index exports', () => {
  it('re-exports ModernQueryBuilder as default modern builder component', () => {
    const component = ModernQueryBuilder as { name?: string }
    expect(ModernQueryBuilder).toBe(DirectModernQueryBuilder)
    expect(component.name).toBe('AdvancedQueryModernQueryBuilder')
  })

  it('re-exports QueryActionButtons as shared query action component', () => {
    const component = QueryActionButtons as { name?: string }
    expect(QueryActionButtons).toBe(DirectQueryActionButtons)
    expect(component.name).toBe('AdvancedQueryActionButtons')
  })
})
