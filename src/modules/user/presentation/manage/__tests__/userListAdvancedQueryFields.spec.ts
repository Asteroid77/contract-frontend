import { describe, expect, it } from 'vitest'
import { FieldType } from '@/modules/shared/domain/advanced-query'
import { FilterOp } from '@/modules/shared/domain/query'
import { userListAdvancedQueryFields } from '@/modules/user/presentation/manage/userListAdvancedQueryFields'

describe('userListAdvancedQueryFields', () => {
  it('exposes required query fields with expected operators', () => {
    expect(userListAdvancedQueryFields.map((field) => field.key)).toEqual([
      'platform',
      'phone',
      'name',
    ])

    const platform = userListAdvancedQueryFields.find((field) => field.key === 'platform')
    const phone = userListAdvancedQueryFields.find((field) => field.key === 'phone')
    const name = userListAdvancedQueryFields.find((field) => field.key === 'name')

    expect(platform?.type).toBe(FieldType.ENUM)
    expect(platform?.operators).toEqual([FilterOp.EQ])
    expect(platform?.options?.map((item) => item.value)).toEqual(['GITHUB', 'WECHAT'])

    expect(phone?.type).toBe(FieldType.STRING)
    expect(phone?.operators).toEqual([FilterOp.LIKE_RIGHT])

    expect(name?.type).toBe(FieldType.STRING)
    expect(name?.operators).toEqual([FilterOp.LIKE_RIGHT])
  })
})
