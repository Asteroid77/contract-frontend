import { defineComponent, type PropType, computed, h } from 'vue'
import { $t } from '@/_utils/i18n'
import type { ApprovalInstance, ApprovalTaskStatus } from '@/modules/approval/application/models'
import { showIncompletedUserName } from '@/modules/approval/application/utils'
import StatusTag from './StatusTag'
import type { ApprovalInstanceStatus } from '@/modules/approval/domain/enums'

export default defineComponent({
  name: 'PrintBaseInfo',
  props: {
    data: {
      type: Object as PropType<ApprovalInstance<Record<string, unknown>>>,
      required: true,
    },
  },
  setup(props) {
    const statusText = computed(() => {
      return ['rejected', 'canceled', 'approved'].includes(props.data.status)
        ? h(
            StatusTag(
              props.data.status as ApprovalInstanceStatus,
              'Instance',
            ),
          )
        : h(
            StatusTag(
              props.data.taskStatus as ApprovalTaskStatus,
              'Task',
            ),
          )
    })

    return () => (
      <div class="print-section">
        <table class="info-table">
          <tbody>
            <tr>
              <td class="label">{$t('approval.instance.processName')}</td>
              <td class="value">{props.data.processName}</td>
              <td class="label">{$t('approval.handleTask.currentNode')}</td>
              <td class="value">{props.data.nodeName}</td>
            </tr>
            <tr>
              <td class="label">{$t('approval.instance.applicantName')}</td>
              <td class="value">{showIncompletedUserName(props.data.applicantName)}</td>
              <td class="label">{$t('approval.instance.assigneeName')}</td>
              <td class="value">{showIncompletedUserName(props.data.assigneeName)}</td>
            </tr>
            <tr>
              <td class="label">{$t('common.status')}</td>
              <td class="value" colspan={3}>
                {statusText.value}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    )
  },
})
