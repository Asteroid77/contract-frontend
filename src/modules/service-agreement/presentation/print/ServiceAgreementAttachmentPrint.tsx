import { $t } from '@/_utils/i18n'
import { NQrCode } from 'naive-ui'
import { computed } from 'vue'
import { defineComponent } from 'vue'
import { renderAttachmentRows } from '@/modules/approval/application/print/FileListDiff'
import type { ServiceAgreementVo } from '@/modules/service-agreement/application/models'
import type { PropType } from 'vue'
import clsx from 'clsx'
import { PreviewTypeEnum } from '@/modules/service-agreement/application/constants'

export default defineComponent({
  props: {
    id: { type: Number, required: true },
    data: {
      type: Object as PropType<
        Pick<ServiceAgreementVo, 'billFiles' | 'contractScanFiles' | 'supplementaryAttachmentFiles'>
      >,
      required: true,
    },
    compareData: {
      type: Object as PropType<
        | Pick<
            ServiceAgreementVo,
            'billFiles' | 'contractScanFiles' | 'supplementaryAttachmentFiles'
          >
        | null
        | undefined
      >,
    },
    rules: {
      type: Array as PropType<
        { title: string; key: 'billFiles' | 'supplementaryAttachmentFiles' | 'contractScanFiles' }[]
      >,
      required: true,
    },
  },
  setup(props) {
    const previewUrl = computed(() => {
      const origin = window.location.origin
      return `${origin}/sign/preview/attachments?id=${props.id}&type=${props.compareData === undefined ? PreviewTypeEnum.FORM_VIEW : PreviewTypeEnum.APPROVAL_VIEW}`
    })
    const { contractScanFiles, billFiles, supplementaryAttachmentFiles } = props.data
    const inApprovalMode = computed(() => props.compareData !== undefined)
    const noEmpty = computed(() => {
      return (
        contractScanFiles?.length ||
        billFiles?.length ||
        supplementaryAttachmentFiles?.length ||
        props.compareData?.contractScanFiles.length ||
        props.compareData?.billFiles.length ||
        props.compareData?.supplementaryAttachmentFiles.length
      )
    })
    return () => (
      <>
        {/* ---  附件清单 --- */}
        {props.data && (
          <section
            class={clsx('print-section', 'avoid-break', {
              'in-approval-mode': inApprovalMode.value,
            })}
          >
            <div class="section-header-with-qr">
              <div class={clsx(`${inApprovalMode.value ? 'sub-section-title' : 'section-title'}`)}>
                {$t('domain.agreement.tab.files')}
              </div>
              {/* 打印专用二维码 */}
              <div class="qr-box">
                <NQrCode value={previewUrl.value} size={60} padding={0} />
                <span>{$t('domain.agreement.print.qr')}</span>
              </div>
            </div>
            <table class="list-table attachment-list">
              <thead>
                <tr>
                  <th style={{ width: '25%' }}>{$t('common.field.type')}</th>
                  <th>{$t('common.field.name')}</th>
                  <th style={{ width: '20%' }}> 大小</th>
                </tr>
              </thead>
              <tbody>
                {props.rules.map((item) => {
                  return renderAttachmentRows(
                    item.title,
                    props.data[item.key],
                    props.compareData?.[item.key],
                    inApprovalMode.value,
                  )
                })}
                {/* 全空状态 */}
                {!noEmpty.value && (
                  <tr>
                    <td colspan={3} style={{ textAlign: 'center' }}>
                      {$t('common.label.noData')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>
        )}
      </>
    )
  },
})
