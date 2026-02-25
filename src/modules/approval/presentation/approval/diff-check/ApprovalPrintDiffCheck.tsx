import { $t } from '@/_utils/i18n'
import type { ApprovalHistory, ApprovalInstance } from '@/modules/approval/application/models'
import { showIncompletedUserName } from '@/modules/approval/application/utils'
import { formatted } from '@/modules/shared/presentation/time'
import { NQrCode } from 'naive-ui'
import { match } from 'ts-pattern'
import { computed, defineComponent, type PropType } from 'vue'
import ApprovalContentDiffCheck from './ApprovalContentDiffCheck'

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

const toActionLabelKey = (action: string): I18nKey =>
  match(action)
    .returnType<I18nKey>()
    .with('approve', () => 'domain.approval.action.pass')
    .with('reject', () => 'domain.approval.action.reject')
    .with('claim', () => 'common.action.claim')
    .with('submit', () => 'common.action.submit')
    .with('transfer', () => 'common.action.transfer')
    .with('cancel', () => 'common.action.cancel')
    .otherwise(() => 'common.label.action')

export default defineComponent({
  name: 'ApprovalPrintDiffCheck',
  props: {
    data: {
      type: Object as PropType<ApprovalInstance<Record<string, unknown>>>,
      required: true,
    },
    historyList: {
      type: Array as PropType<ApprovalHistory[]>,
      default: () => [],
    },
  },
  setup(props) {
    const now = new Date().toLocaleString('zh-CN')

    const statusText = computed(() => {
      const finished = ['rejected', 'canceled', 'approved'].includes(props.data.status)
      return finished ? toStatusText(props.data.status) : toStatusText(props.data.taskStatus)
    })

    const previewUrl = computed(() => {
      const origin = window.location.origin
      // 项目A既有附件预览入口：/sign/preview/attachments
      // 审批场景统一走 APPROVAL_VIEW（2）
      return `${origin}/sign/preview/attachments?id=${props.data.id}&type=2`
    })

    return () => (
      <div class="print-container" style="max-width: 210mm; margin: 0 auto;">
        <div class="print-header" style="min-height: 80px; --qr-area-width: 60px;">
          <div class="print-header-side"></div>
          <div class="print-header-center">
            <h1>{props.data.processName}</h1>
            <div style="font-size:12px;color:#000;">
              {$t('common.diffCheck.print.docNo')}：{props.data.id} |{' '}
              {$t('common.diffCheck.print.generatedAt')}：{now}
            </div>
          </div>
          <div class="print-header-qr">
            <NQrCode value={previewUrl.value} size={60} padding={0} type="svg" />
            <div class="print-header-qr-hint">{$t('common.diffCheck.print.qrHint')}</div>
          </div>
        </div>

        <div style="margin-bottom:16px;font-size:11px;">
          <strong>{$t('common.diffCheck.print.legend.title')}：</strong>
          <span style="text-decoration:line-through;margin-left:8px;">
            {$t('common.diffCheck.print.legend.strikeThrough')}
          </span>{' '}
          = {$t('common.diffCheck.print.legend.originalValue')} |
          <span style="font-weight:bold;border-bottom:1px solid #000;margin-left:8px;">
            {$t('common.diffCheck.print.legend.boldUnderline')}
          </span>{' '}
          = {$t('common.diffCheck.print.legend.newValue')} | [{$t('common.action.add')}] ={' '}
          {$t('common.diffCheck.print.legend.addedItem')} | [{$t('common.action.delete')}] ={' '}
          {$t('common.diffCheck.print.legend.removedItem')}
        </div>

        <div style="font-weight: bold; margin: 12px 0 8px;">
          {$t('domain.approval.section.baseInfo')}
        </div>
        <table class="print-table">
          <tbody>
            <tr>
              <td style={{ width: '20%', fontWeight: 'bold' }}>
                {$t('domain.approval.field.process')}
              </td>
              <td style={{ width: '30%' }}>{props.data.processName}</td>
              <td style={{ width: '20%', fontWeight: 'bold' }}>
                {$t('domain.approval.field.currentNode')}
              </td>
              <td style={{ width: '30%' }}>{props.data.nodeName}</td>
            </tr>
            <tr>
              <td style={{ fontWeight: 'bold' }}>{$t('domain.approval.field.applicant')}</td>
              <td>{showIncompletedUserName(props.data.applicantName)}</td>
              <td style={{ fontWeight: 'bold' }}>{$t('domain.approval.field.approver')}</td>
              <td>{showIncompletedUserName(props.data.assigneeName)}</td>
            </tr>
            <tr>
              <td style={{ fontWeight: 'bold' }}>{$t('common.label.status')}</td>
              <td colspan={3}>{statusText.value}</td>
            </tr>
          </tbody>
        </table>

        <div style="font-weight: bold; margin: 16px 0 8px;">
          {$t('domain.approval.section.content')}
        </div>
        <ApprovalContentDiffCheck data={props.data} variant="print" disableListToggle />

        <div style="font-weight: bold; margin: 16px 0 8px;">
          {$t('domain.approval.section.history')}
        </div>
        <table class="print-table">
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
            {props.historyList.length > 0 ? (
              props.historyList.map((row) => (
                <tr key={row.id}>
                  <td>{row.nodeName}</td>
                  <td>{showIncompletedUserName(row.operator)}</td>
                  <td>{$t(toActionLabelKey(row.action))}</td>
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
      </div>
    )
  },
})
