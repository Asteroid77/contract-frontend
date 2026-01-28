import { $t } from '@/_utils/i18n'
import type { ApprovalInstance } from '@/components/approval/api/approval'
import type { ServiceAgreementRequestDTO } from '@/components/sign/api/sign'
import AttachmentApprovalDiff from '@/components/sign/AttachmentApprovalDiff'
import ServiceAgreementAttachmentPrint from '@/components/sign/print/ServiceAgreementAttachmentPrint'
import ServiceAgreementPrint from '@/components/sign/print/ServiceAgreementPrint'
import { mapFileIds, useDistributeFiles } from '@/components/approval/print/utils/FileListDiff'
import { useFilesDetailQuery } from '@/hooks/file/useFileService'
import { uniq } from 'lodash'
import { computed } from 'vue'
import { defineComponent, type PropType } from 'vue'

export default defineComponent({
  name: 'ServiceAgreementApprovalDiffTemplate',
  props: {
    data: {
      type: Object as PropType<ApprovalInstance<ServiceAgreementRequestDTO>>,
      required: true,
    },
  },
  setup(props) {
    const approvalData: ServiceAgreementRequestDTO = props.data.approvalData
    const sourceData: ServiceAgreementRequestDTO = props.data.sourceData
    const rules = [
      { title: $t('serviceAgreement.attachments.bills'), key: 'billIds' },
      {
        title: $t('serviceAgreement.attachments.contractScans'),
        key: 'contractScanIds',
      },
      {
        title: $t('serviceAgreement.attachments.supplementary'),
        key: 'supplementaryAttachmentIds',
      },
    ]
    const allFileIds = computed(() => {
      const oldFileIds = mapFileIds(
        {
          billIds: sourceData.billIds || [],
          contractSacnIds: sourceData.contractScanIds || [],
          supplementaryAttachmentIds: sourceData.supplementaryAttachmentIds || [],
        },
        rules,
      )
      const newFileIds = mapFileIds(
        {
          billIds: approvalData.billIds || [],
          contractSacnIds: approvalData.contractScanIds || [],
          supplementaryAttachmentIds: approvalData.supplementaryAttachmentIds || [],
        },
        rules,
      )
      return uniq([...oldFileIds, ...newFileIds])
    })
    const { data: files } = useFilesDetailQuery(allFileIds)
    const filesMap = useDistributeFiles(files, { old: sourceData, new: approvalData }, rules)
    return () => (
      <>
        <ServiceAgreementPrint
          data={approvalData}
          compareData={sourceData}
          v-slots={{
            attachments: () => (
              <>
                <ServiceAgreementAttachmentPrint
                  id={props.data.id}
                  data={{
                    billFiles: filesMap.value.new['billIds'],
                    contractScanFiles: filesMap.value.new['contractScanIds'],
                    supplementaryAttachmentFiles: filesMap.value.new['supplementaryAttachmentIds'],
                  }}
                  compareData={{
                    billFiles: filesMap.value.old['billIds'],
                    contractScanFiles: filesMap.value.old['contractScanIds'],
                    supplementaryAttachmentFiles: filesMap.value.old['supplementaryAttachmentIds'],
                  }}
                  rules={[
                    { title: $t('serviceAgreement.attachments.bills'), key: 'billFiles' },
                    {
                      title: $t('serviceAgreement.attachments.contractScans'),
                      key: 'contractScanFiles',
                    },
                    {
                      title: $t('serviceAgreement.attachments.supplementary'),
                      key: 'supplementaryAttachmentFiles',
                    },
                  ]}
                ></ServiceAgreementAttachmentPrint>
                <AttachmentApprovalDiff
                  filesMap={filesMap.value}
                  rules={rules}
                ></AttachmentApprovalDiff>
              </>
            ),
          }}
        />
      </>
    )
  },
})
