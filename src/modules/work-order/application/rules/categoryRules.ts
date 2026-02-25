import type { FormRules } from 'naive-ui'
import { requireRule } from '@/modules/shared/application/rules/RequireRule'
import { $t } from '@/_utils/i18n'

export const useCategoryRules = (): FormRules => ({
  name: [
    {
      required: true,
      validator: (rule, value: string) =>
        requireRule(rule, $t('domain.workOrderCategory.field.name'), value),
      trigger: ['blur', 'input'],
    },
    {
      validator: (_rule, value: string) => {
        if (value && value.length > 100) {
          return new Error($t('domain.workOrderCategory.validation.nameMaxLength'))
        }
        return true
      },
      trigger: ['blur', 'input'],
    },
  ],
  permissionCode: [
    {
      required: true,
      validator: (rule, value: string) =>
        requireRule(rule, $t('domain.workOrderCategory.field.permissionCode'), value),
      trigger: ['blur', 'input'],
    },
    {
      validator: (_rule, value: string) => {
        if (value && value.length > 100) {
          return new Error($t('domain.workOrderCategory.validation.permissionCodeMaxLength'))
        }
        return true
      },
      trigger: ['blur', 'input'],
    },
  ],
})
