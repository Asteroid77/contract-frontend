import { $t } from '@/_utils/i18n'
import { requireRule } from '@/_utils/rules/RequireRule'
import type { FormItemRule } from 'naive-ui'

export const approvalOpinionRequestRule = () => {
  return {
    comment: [
      {
        required: true,
        trigger: ['blur'],
        validator: (rule: FormItemRule, value: string) =>
          requireRule(rule, $t('approval.handleTask.opinion'), value),
      },
    ],
    approve: [
      {
        required: true,
        trigger: ['blur'],
        validator: (rule: FormItemRule, value: boolean | undefined | null) => {
          if (value === undefined || value === null) {
            return new Error(`${$t('approval.handleTask.decision')}`)
          }
          return true
        },
      },
    ],
  }
}
