import { $t } from '@/_utils/i18n'
import type { ApprovalInstance } from '@/modules/approval/application/models'
import type { ServiceAgreementRequestDTO } from '@/modules/service-agreement/application/models'
import AttachmentApprovalDiff from '@/modules/service-agreement/presentation/sign/AttachmentApprovalDiff'
import ServiceAgreementAttachmentPrint from '@/modules/service-agreement/presentation/print/ServiceAgreementAttachmentPrint'
import ServiceAgreementPrint from '@/modules/service-agreement/presentation/print/ServiceAgreementPrint'
import { mapFileIds, useDistributeFiles } from '@/modules/approval/application/print/FileListDiff'
import { useFilesDetailQuery } from '@/modules/file/application/hooks/useFileService'
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
    const sourceData = props.data.sourceData
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
          billIds: sourceData?.billIds || [],
          contractScanIds: sourceData?.contractScanIds || [],
          supplementaryAttachmentIds: sourceData?.supplementaryAttachmentIds || [],
        },
        rules,
      )
      const newFileIds = mapFileIds(
        {
          billIds: approvalData.billIds || [],
          contractScanIds: approvalData.contractScanIds || [],
          supplementaryAttachmentIds: approvalData.supplementaryAttachmentIds || [],
        },
        rules,
      )
      return uniq([...oldFileIds, ...newFileIds])
    })
    const { data: files } = useFilesDetailQuery(allFileIds)
    const filesMap = useDistributeFiles(files, { old: sourceData ?? {}, new: approvalData }, rules)
    return () => (
      <>
        <ServiceAgreementPrint
          data={approvalData}
          compareData={sourceData ?? null}
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
