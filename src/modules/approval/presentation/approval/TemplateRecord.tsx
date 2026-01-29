import { defineComponent, type PropType, computed } from 'vue'
import { $t } from '@/_utils/i18n'
import type { ApprovalInstance } from '@/modules/approval/application/models'
import { useApprovalHistoryQuery } from '@/modules/approval/application/hooks/useApprovalService'
import { formatted } from '@/modules/shared/presentation/time'
import { showIncompletedUserName } from '@/modules/approval/application/utils'

export default defineComponent({
  name: 'PrintHistoryList',
  props: {
    data: {
      type: Object as PropType<ApprovalInstance<Record<string, unknown>>>,
      required: true,
    },
  },
  setup(props) {
    const { data: historyData } = useApprovalHistoryQuery(computed(() => props.data.id))

    const list = computed(() => {
      if (!historyData.value) return []
      const result = [...historyData.value]
      if (result.length) {
        // 处理第一条和撤回逻辑
        result[result.length - 1].nodeName = $t('approval.history.first')
        if (result[0].action === 'cancel') {
          result[0].nodeName = $t('approval.history.withdrawn')
        }
      }
      return result
    })

    return () => (
      <div class="print-section">
        <table class="list-table">
          <thead>
            <tr>
              <th style={{ width: '15%' }}>{$t('approval.history.fields.nodeName')}</th>
              <th style={{ width: '15%' }}>{$t('approval.history.fields.operator')}</th>
              <th style={{ width: '10%' }}>{$t('approval.history.fields.action')}</th>
              <th style={{ width: '20%' }}>{$t('approval.history.fields.createdTime')}</th>
              <th style={{ width: '40%' }}>{$t('approval.history.fields.comment')}</th>
            </tr>
          </thead>
          <tbody>
            {list.value.length > 0 ? (
              list.value.map((row) => (
                <tr key={row.id}>
                  <td>{row.nodeName}</td>
                  <td>{showIncompletedUserName(row.operator)}</td>
                  <td>{$t(`approvalHistoryActions.${row.action}`)}</td>
                  <td>{formatted(row.createdTime).standard}</td>
                  <td>
                    {/* 打印时，评论不为空则显示，为空显示 - */}
                    {row.comment || '-'}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colspan={5} style={{ textAlign: 'center', color: '#999' }}>
                  {/* 避免打印出 loading 状态，如果没数据就显示空 */}
                  {$t('common.empty')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    )
  },
})
