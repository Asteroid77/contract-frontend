import { FieldType, type FieldConfig } from '@/modules/shared/domain/advanced-query'
import { ApprovalProcessNameEnum } from '@/modules/approval/application/constants'

export const approvalInstanceAdvancedQueryFields: FieldConfig[] = [
  {
    key: 'processName',
    labelKey: 'domain.approval.field.process',
    type: FieldType.ENUM,
    options: (Object.values(ApprovalProcessNameEnum) as string[]).map((v) => ({
      label: v,
      value: v,
    })),
  },
  { key: 'nodeName', labelKey: 'domain.approval.field.nodeName', type: FieldType.STRING },
  { key: 'assigneeName', labelKey: 'domain.approval.field.approver', type: FieldType.STRING },
  { key: 'applicantName', labelKey: 'domain.approval.field.applicant', type: FieldType.STRING },
  { key: 'createdTime', labelKey: 'common.time.created', type: FieldType.DATETIME },
]
