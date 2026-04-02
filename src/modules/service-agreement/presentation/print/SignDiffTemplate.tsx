import { $t } from '@/_utils/i18n'
import type { ApprovalInstance } from '@/modules/approval/application/models'
import type { ServiceAgreementRequestDTO } from '@/modules/service-agreement/domain/dto'
import AttachmentApprovalDiff from '@/modules/service-agreement/presentation/sign/AttachmentApprovalDiff'
import ServiceAgreementAttachmentPrint from '@/modules/service-agreement/presentation/print/ServiceAgreementAttachmentPrint'
import ServiceAgreementPrint from '@/modules/service-agreement/presentation/print/ServiceAgreementPrint'
import { mapFileIds, useDistributeFiles } from '@/modules/approval/application/print/FileListDiff'
import { useFilesDetailQuery } from '@/modules/file/application/hooks/useFileService'
import { uniq } from 'lodash'
import { computed, defineComponent, type PropType } from 'vue'
import { toViewServiceAgreementRequest } from '@/modules/service-agreement/application/mappers'

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
      { title: $t('domain.agreement.file.bill'), key: 'billIds' },
      {
        title: $t('domain.agreement.file.contract'),
        key: 'contractScanIds',
      },
      {
        title: $t('domain.agreement.file.other'),
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
    const filesMap = useDistributeFiles(
      files,
      {
        old: (sourceData ?? {}) as unknown as Record<string, unknown>,
        new: approvalData as unknown as Record<string, unknown>,
      },
      rules,
    )

    const viewApprovalData = computed(() => toViewServiceAgreementRequest(approvalData))
    const viewSourceData = computed(() =>
      sourceData ? toViewServiceAgreementRequest(sourceData) : null,
    )

    return () => (
      <>
        <ServiceAgreementPrint
          data={viewApprovalData.value}
          compareData={viewSourceData.value}
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
                    { title: $t('domain.agreement.file.bill'), key: 'billFiles' },
                    {
                      title: $t('domain.agreement.file.contract'),
                      key: 'contractScanFiles',
                    },
                    {
                      title: $t('domain.agreement.file.other'),
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
