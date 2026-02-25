import { $t } from '@/_utils/i18n'
import { FieldType, type FieldConfig } from '@/modules/shared/domain/advanced-query'
import { FilterOp } from '@/modules/shared/domain/query'

export const userListAdvancedQueryFields: FieldConfig[] = [
  {
    key: 'platform',
    labelKey: 'layout.profile.field.platform',
    type: FieldType.ENUM,
    operators: [FilterOp.EQ],
    options: [
      { label: $t('layout.profile.platform.github'), value: 'GITHUB' },
      { label: $t('layout.profile.platform.wechat'), value: 'WECHAT' },
    ],
  },
  {
    key: 'phone',
    labelKey: 'layout.profile.field.phone',
    type: FieldType.STRING,
    operators: [FilterOp.LIKE_RIGHT],
  },
  {
    key: 'name',
    labelKey: 'domain.user.field.name',
    type: FieldType.STRING,
    operators: [FilterOp.LIKE_RIGHT],
  },
]
