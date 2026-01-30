import { $t } from '@/_utils/i18n'
import { NTag } from 'naive-ui'
import { defineComponent } from 'vue'
const statusMap = {
  pending: 'success',
  handling: 'success',
  approved: 'info',
  rejected: 'error',
  transfer: 'warning',
  canceled: 'error',
  finished: 'info',
} as const
type ApprovalType = 'Task' | 'Instance'
type BaseStatus = 'pending' | 'handling' | 'approved' | 'rejected'
type ApprovalStatus<T extends ApprovalType> = T extends 'Task'
  ? BaseStatus | 'transfer'
  : BaseStatus | 'canceled'

export default <T extends ApprovalType>(status: ApprovalStatus<T>, type: T, finished?: boolean) =>
  defineComponent({
    props: {
      text: {
        type: Boolean,
        default: false,
      },
    },
    setup(props) {
      const translationKeyMap: Record<string, string> = {
        pending: 'domain.approval.status.pending',
        handling: 'domain.approval.status.processing',
        approved: 'domain.approval.status.approved',
        rejected: 'domain.approval.status.rejected',
        transfer: 'domain.approval.status.transfer',
        canceled: 'domain.approval.status.canceled',
      }
      return () => (
        <>
          {props.text && (
            <NTag type={statusMap[finished ? 'finished' : status]}>
              {finished
                ? $t('domain.approval.status.finished')
                : $t((translationKeyMap[status] || 'common.label.status') as any)}
            </NTag>
          )}
          {!props.text && (
            <span>
              {finished
                ? $t('domain.approval.status.finished')
                : $t((translationKeyMap[status] || 'common.label.status') as any)}
            </span>
          )}
        </>
      )
    },
  })
