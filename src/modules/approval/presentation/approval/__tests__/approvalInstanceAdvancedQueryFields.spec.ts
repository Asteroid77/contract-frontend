import { describe, expect, it } from 'vitest'
import { approvalInstanceAdvancedQueryFields } from '@/modules/approval/presentation/approval/approvalInstanceAdvancedQueryFields'
import { FieldType } from '@/modules/shared/domain/advanced-query'
import { ApprovalProcessNameEnum } from '@/modules/approval/application/constants'

describe('approvalInstanceAdvancedQueryFields', () => {
  it('defines expected field keys and types in stable order', () => {
    expect(
      approvalInstanceAdvancedQueryFields.map((field) => ({
        key: field.key,
        type: field.type,
      })),
    ).toEqual([
      { key: 'processName', type: FieldType.ENUM },
      { key: 'nodeName', type: FieldType.STRING },
      { key: 'assigneeName', type: FieldType.STRING },
      { key: 'applicantName', type: FieldType.STRING },
      { key: 'createdTime', type: FieldType.DATETIME },
    ])
  })

  it('maps processName options from ApprovalProcessNameEnum values', () => {
    const processField = approvalInstanceAdvancedQueryFields.find(
      (field) => field.key === 'processName',
    )

    expect(processField).toBeDefined()
    expect(processField?.labelKey).toBe('domain.approval.field.process')
    expect(processField?.type).toBe(FieldType.ENUM)

    const expectedOptions = Object.values(ApprovalProcessNameEnum).map((value) => ({
      label: value,
      value,
    }))

    expect(processField?.options).toEqual(expectedOptions)
  })

  it('keeps non-enum fields without options', () => {
    const nonEnumFields = approvalInstanceAdvancedQueryFields.filter(
      (field) => field.key !== 'processName',
    )

    nonEnumFields.forEach((field) => {
      expect(field.options).toBeUndefined()
    })
  })
})
