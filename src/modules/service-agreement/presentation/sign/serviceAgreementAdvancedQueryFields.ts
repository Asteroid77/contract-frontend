import { FieldType, type FieldConfig } from '@/modules/shared/domain/advanced-query'
import { FilterOp } from '@/modules/shared/domain/query'
import { ServiceAgreementStatusOption } from '@/modules/service-agreement/application/constants'

export const serviceAgreementAdvancedQueryFields: FieldConfig[] = [
  {
    key: 'companyName',
    labelKey: 'domain.agreement.field.companyName',
    type: FieldType.STRING,
    operators: [FilterOp.LIKE_RIGHT],
  },
  {
    key: 'status',
    labelKey: 'common.label.status',
    type: FieldType.ENUM,
    operators: [FilterOp.EQ],
    options: ServiceAgreementStatusOption.map(({ label, value }) => ({ label, value })),
  },
]
