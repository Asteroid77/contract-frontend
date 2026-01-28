import { pruneEmpty } from '@/_utils/form'
import { $t } from '@/_utils/i18n'
import type { ServiceAgreementRequestDTO, ServiceAgreementUIMap } from '@/components/sign/api/sign'
import { ServiceAgreementStatusEnum } from '@/components/sign/constant/enum'
import { convertUIToRequestDTO } from '@/components/sign/model'
import ServiceAgreementForm from '@/components/sign/ServiceAgreementForm'
import {
  useServiceAgreementDetail,
  useSubmitRecordMutation,
  useSubmitSignMutation,
} from '@/components/sign/hooks/useSignService'
import { NButton, NSpace } from 'naive-ui'
import { match } from 'ts-pattern'
import { computed, defineComponent } from 'vue'
import { useRouter } from 'vue-router'
import ServiceAgreementPrint from '@/components/sign/print/ServiceAgreementPrint'
import ServiceAgreementAttachmentPrint from '@/components/sign/print/ServiceAgreementAttachmentPrint'
import { usePrint } from '@/components/approval/hook/usePrint'
import printStyle from '@/components/sign/print/styles/FormPrintCSS.module.css'
export default defineComponent({
  name: 'ServiceAgreementDetail',
  props: {
    id: {
      type: Number,
    },
  },
  setup(props) {
    const router = useRouter()
    const { print } = usePrint()
    // 获取详情数据
    const { data: serviceAgreementData, isLoading: initialDataLoading } = useServiceAgreementDetail(
      computed(() => {
        return props.id ? props.id : null
      }),
    )
    const initialData = computed(() => serviceAgreementData.value)
    // 备案提交
    const submitRecord = useSubmitRecordMutation((resp) => {
      router.push({
        path: '/auth/sign/result',
        query: {
          id: String(resp.data.id),
          status: String(ServiceAgreementStatusEnum.Record),
        },
      })
    })

    // 签约提交
    const submitSign = useSubmitSignMutation((resp) => {
      router.push({
        path: '/auth/sign/result',
        query: {
          id: String(resp.data.id),
          status: String(ServiceAgreementStatusEnum.Sign),
        },
      })
    })

    // 提交处理
    const handleClick = async (
      formValue: ServiceAgreementUIMap,
      handleValidate: () => Promise<boolean>,
    ) => {
      const isValid = await handleValidate()
      if (!isValid) return

      const converter = convertUIToRequestDTO(formValue)
      const payload = pruneEmpty<ServiceAgreementRequestDTO>(
        converter,
      ) as ServiceAgreementRequestDTO

      match(formValue.customerInfo.status)
        .with(ServiceAgreementStatusEnum.Record, () => {
          submitRecord.mutate(payload)
        })
        .with(ServiceAgreementStatusEnum.Sign, () => {
          submitSign.mutate(payload)
        })
        .otherwise(() => {
          console.warn('Unknown status:', formValue.customerInfo.status)
        })
    }
    const handlePrint = () => {
      print('printable-approval-area')
    }

    return () => (
      <>
        <ServiceAgreementForm initialValue={initialData.value} loading={initialDataLoading.value}>
          {{
            Button: ({
              formValue,
              handleValidate,
            }: {
              formValue: ServiceAgreementUIMap
              handleValidate: () => Promise<boolean>
            }) => (
              <NSpace>
                <NButton
                  onClick={() => handleClick(formValue, handleValidate)}
                  loading={submitRecord.isPending.value || submitSign.isPending.value}
                >
                  {$t('actions.submit')}
                </NButton>
                <NButton
                  onClick={() => {
                    handlePrint()
                  }}
                >
                  {$t('actions.print')}
                </NButton>
              </NSpace>
            ),
          }}
        </ServiceAgreementForm>
        {initialData.value && (
          <div id={'printable-approval-area'} class={printStyle['printable-approval-area']}>
            <ServiceAgreementPrint
              data={initialData.value}
              v-slots={{
                attachments: () =>
                  initialData.value && (
                    <ServiceAgreementAttachmentPrint
                      id={props.id as number}
                      data={{
                        billFiles: initialData.value?.billFiles,
                        contractScanFiles: initialData.value?.contractScanFiles,
                        supplementaryAttachmentFiles:
                          initialData.value?.supplementaryAttachmentFiles,
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
                  ),
              }}
            />
          </div>
        )}
      </>
    )
  },
})
