import { $t } from '@/_utils/i18n'
import type { ApprovalInstance } from '@/modules/approval/application/models'
import { showIncompletedUserName } from '@/modules/approval/application/utils'
import { defineComponent, type PropType, computed } from 'vue'

type I18nKey = Parameters<typeof $t>[0]

const statusTextMap: Record<string, I18nKey> = {
  pending: 'domain.approval.status.pending',
  handling: 'domain.approval.status.processing',
  approved: 'domain.approval.status.approved',
  rejected: 'domain.approval.status.rejected',
  transfer: 'domain.approval.status.transfer',
  canceled: 'domain.approval.status.canceled',
}

const toStatusText = (status: string) => {
  const key = statusTextMap[status] ?? 'common.label.status'
  return $t(key) as string
}

export default defineComponent({
  name: 'ApprovalBaseInfoDiffCheck',
  props: {
    data: {
      type: Object as PropType<ApprovalInstance<Record<string, unknown>>>,
      required: true,
    },
  },
  setup(props) {
    const statusText = computed(() => {
      const finished = ['rejected', 'canceled', 'approved'].includes(props.data.status)
      return finished ? toStatusText(props.data.status) : toStatusText(props.data.taskStatus)
    })

    return () => (
      <table class="form-table">
        <tbody>
          <tr>
            <td class="field-label">{$t('domain.approval.field.process')}</td>
            <td>{props.data.processName}</td>
            <td class="field-label">{$t('domain.approval.field.currentNode')}</td>
            <td>{props.data.nodeName}</td>
          </tr>
          <tr>
            <td class="field-label">{$t('domain.approval.field.applicant')}</td>
            <td>{showIncompletedUserName(props.data.applicantName)}</td>
            <td class="field-label">{$t('domain.approval.field.approver')}</td>
            <td>{showIncompletedUserName(props.data.assigneeName)}</td>
          </tr>
          <tr>
            <td class="field-label">{$t('common.label.status')}</td>
            <td colspan={3}>{statusText.value}</td>
          </tr>
        </tbody>
      </table>
    )
  },
})
