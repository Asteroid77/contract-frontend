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
type ApprovalTranslationKey<T> = 'canceled' extends T
  ? `approvalInstanceStatus.${BaseStatus | 'canceled'}`
  : `approvalTaskStatus.${BaseStatus | 'transfer'}`
export default <T extends ApprovalType>(status: ApprovalStatus<T>, type: T, finished?: boolean) =>
  defineComponent({
    props: {
      text: {
        type: Boolean,
        default: false,
      },
    },
    setup(props) {
      const translationKey = `approval${type}Status.${status}`
      return () => (
        <>
          {props.text && (
            <NTag type={statusMap[finished ? 'finished' : status]}>
              {finished
                ? $t('approvalTaskStatus.finished')
                : $t(translationKey as ApprovalTranslationKey<T>)}
            </NTag>
          )}
          {!props.text && (
            <span>
              {finished
                ? $t('approvalTaskStatus.finished')
                : $t(translationKey as ApprovalTranslationKey<T>)}
            </span>
          )}
        </>
      )
    },
  })
