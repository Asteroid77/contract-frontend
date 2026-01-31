import { $t } from '@/_utils/i18n'
import type { ServiceAgreementUIMap } from '@/modules/service-agreement/application/models'
import { ServiceAgreementStatusEnum } from '@/modules/service-agreement/application/constants'
import { convertUIToRequestDTO } from '@/modules/service-agreement/application/ui-mappers'
import ServiceAgreementFormComponent from '@/modules/service-agreement/presentation/sign/ServiceAgreementForm'
import {
  useServiceAgreementDetail,
  useSubmitRecordMutation,
  useSubmitSignMutation,
} from '@/modules/service-agreement/application/hooks/useSignService'
import { NButton, NSpace } from 'naive-ui'
import { match } from 'ts-pattern'
import { computed, defineComponent } from 'vue'
import { useRouter } from 'vue-router'
import ServiceAgreementPrint from '@/modules/service-agreement/presentation/print/ServiceAgreementPrint'
import ServiceAgreementAttachmentPrint from '@/modules/service-agreement/presentation/print/ServiceAgreementAttachmentPrint'
import { usePrint } from '@/modules/approval/application/hooks/usePrint'
import printStyle from '@/modules/service-agreement/presentation/print/styles/FormPrintCSS.module.css'
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
          id: String(resp.id),
          status: String(ServiceAgreementStatusEnum.Record),
        },
      })
    })

    // 签约提交
    const submitSign = useSubmitSignMutation((resp) => {
      router.push({
        path: '/auth/sign/result',
        query: {
          id: String(resp.id),
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
      const payload = converter

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
        <ServiceAgreementFormComponent
          initialValue={initialData.value}
          loading={initialDataLoading.value}
        >
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
                  {$t('common.action.submit')}
                </NButton>
                <NButton
                  onClick={() => {
                    handlePrint()
                  }}
                >
                  {$t('common.action.print')}
                </NButton>
              </NSpace>
            ),
          }}
        </ServiceAgreementFormComponent>
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
                  ),
              }}
            />
          </div>
        )}
      </>
    )
  },
})
