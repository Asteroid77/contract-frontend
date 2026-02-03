import { $t } from '@/_utils/i18n'
import type { ApprovalHistory } from '@/modules/approval/application/models'
import { showIncompletedUserName } from '@/modules/approval/application/utils'
import { formatted } from '@/modules/shared/presentation/time'
import { match } from 'ts-pattern'
import { defineComponent, type PropType } from 'vue'

export default defineComponent({
  name: 'ApprovalHistoryDiffCheck',
  props: {
    list: {
      type: Array as PropType<ApprovalHistory[]>,
      required: true,
    },
  },
  setup(props) {
    return () => (
      <table class="form-table">
        <thead>
          <tr>
            <th style={{ width: '15%' }}>{$t('domain.approval.field.nodeName')}</th>
            <th style={{ width: '15%' }}>{$t('domain.approval.field.operator')}</th>
            <th style={{ width: '10%' }}>{$t('common.label.action')}</th>
            <th style={{ width: '20%' }}>{$t('common.time.created')}</th>
            <th style={{ width: '40%' }}>{$t('domain.approval.field.comment')}</th>
          </tr>
        </thead>
        <tbody>
          {props.list.length > 0 ? (
            props.list.map((row) => (
              <tr key={row.id}>
                <td>{row.nodeName}</td>
                <td>{showIncompletedUserName(row.operator)}</td>
                <td>
                  {$t(
                    match(row.action)
                      .with('approve', () => 'common.action.approve')
                      .with('reject', () => 'common.action.reject')
                      .with('claim', () => 'common.action.claim')
                      .with('submit', () => 'common.action.submit')
                      .with('transfer', () => 'common.action.transfer')
                      .with('cancel', () => 'common.action.cancel')
                      .otherwise(() => 'common.label.action') as any,
                  )}
                </td>
                <td>{formatted(row.createdTime).standard}</td>
                <td>{row.comment || '-'}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colspan={5} style={{ textAlign: 'center', color: '#999' }}>
                {$t('common.label.none')}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    )
  },
})

