import { NQrCode } from 'naive-ui'
import { defineComponent, type PropType } from 'vue'
import { $t } from '@/_utils/i18n'

import type { FieldDefinition, FormData } from '@/modules/shared/presentation/diff-check/domain/types/field'
import UnifiedFormTable from '@/modules/shared/presentation/diff-check/components/unified/UnifiedFormTable'

export default defineComponent({
  name: 'UnifiedFormPrint',
  props: {
    title: { type: String, required: true },
    docNo: { type: String, default: '' },
    previewUrl: { type: String, required: true },
    fields: { type: Array as PropType<FieldDefinition[]>, required: true },
    data: { type: Object as PropType<FormData>, required: true },
    oldData: { type: Object as PropType<FormData | null>, default: null },
  },
  setup(props) {
    const now = new Date().toLocaleString('zh-CN')

    return () => (
      <div class="print-container" style="max-width: 210mm; margin: 0 auto;">
        <div class="print-header" style="min-height: 80px; --qr-area-width: 60px;">
          <div class="print-header-side"></div>
          <div class="print-header-center">
            <h1>{props.title}</h1>
            <div style="font-size:12px;color:#000;">
              {$t('common.diffCheck.print.docNo')}：{props.docNo || '—'} | {$t('common.diffCheck.print.generatedAt')}：{now}
            </div>
          </div>
          <div class="print-header-qr">
            <NQrCode value={props.previewUrl} size={60} padding={0} type="svg" />
            <div class="print-header-qr-hint">{$t('common.diffCheck.print.qrHint')}</div>
          </div>
        </div>

        <div style="margin-bottom:16px;font-size:11px;">
          <strong>{$t('common.diffCheck.print.legend.title')}：</strong>
          <span style="text-decoration:line-through;margin-left:8px;">{$t('common.diffCheck.print.legend.strikeThrough')}</span> = {$t('common.diffCheck.print.legend.originalValue')} |
          <span style="font-weight:bold;border-bottom:1px solid #000;margin-left:8px;">{$t('common.diffCheck.print.legend.boldUnderline')}</span> = {$t('common.diffCheck.print.legend.newValue')} |
          [{$t('common.action.add')}] = {$t('common.diffCheck.print.legend.addedItem')} | [{$t('common.action.delete')}] = {$t('common.diffCheck.print.legend.removedItem')}
        </div>

        <UnifiedFormTable
          class="print-only"
          variant="print"
          fields={props.fields}
          data={props.data}
          oldData={props.oldData}
          showOnlyChanged={false}
          columnCount={2}
          expandAllLists
          disableListToggle
        />
      </div>
    )
  },
})
