import { $t } from '@/_utils/i18n'
import type {
  ServiceAgreementDetail,
  ServiceAgreementUIMap,
} from '@/modules/service-agreement/application/models'
import { PreviewTypeEnum, ServiceAgreementStatusEnum, ServiceAgreementStatusOption } from '@/modules/service-agreement/application/constants'
import { parseServiceAgreementPrefillQuery } from '@/modules/service-agreement/application/entry-search'
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
import { useTypedRoute, useTypedRouter } from '@/router/useTypedRouter'
import { usePrint } from '@/modules/approval/application/hooks/usePrint'
import UnifiedFormPrint from '@/modules/shared/presentation/diff-check/components/print/UnifiedFormPrint'
import {
  buildServiceAgreementDiffCheckFields,
  toServiceAgreementDetailDiffCheckForm,
} from '@/modules/service-agreement/presentation/diff-check/serviceAgreementDiffCheck'

export default defineComponent({
  name: 'ServiceAgreementDetail',
  props: {
    id: {
      type: Number,
    },
  },
  setup(props) {
    const router = useTypedRouter()
    const route = useTypedRoute()
    const { print } = usePrint()

    const { data: serviceAgreementData, isLoading: initialDataLoading } = useServiceAgreementDetail(
      computed(() => {
        return props.id ? props.id : null
      }),
    )

    const prefillInitialData = computed<Partial<ServiceAgreementDetail> | undefined>(() => {
      const prefill = parseServiceAgreementPrefillQuery(route.query as Record<string, unknown>)
      return Object.keys(prefill).length ? prefill : undefined
    })
    const detailData = computed(() => serviceAgreementData.value)
    const initialData = computed(() => detailData.value ?? prefillInitialData.value)

    const submitRecord = useSubmitRecordMutation((resp) => {
      router.push({
        name: 'sign-result',
        query: {
          id: String(resp.id),
          status: String(ServiceAgreementStatusEnum.Record),
        },
      })
    })

    const submitSign = useSubmitSignMutation((resp) => {
      router.push({
        name: 'sign-result',
        query: {
          id: String(resp.id),
          status: String(ServiceAgreementStatusEnum.Sign),
        },
      })
    })

    const handleClick = async (
      formValue: ServiceAgreementUIMap,
      handleValidate: () => Promise<boolean>,
    ) => {
      const isValid = await handleValidate()
      if (!isValid) return

      const payload = convertUIToRequestDTO(formValue)

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

    const previewUrl = computed(() => {
      const origin = window.location.origin
      const id = props.id ?? detailData.value?.id
      return `${origin}/sign/preview/attachments?id=${id}&type=${PreviewTypeEnum.FORM_VIEW}`
    })

    const printTitle = computed(() => {
      const detail = detailData.value
      if (!detail) return '表单'

      const statusLabel =
        ServiceAgreementStatusOption.find((option) => option.value === detail.status)?.label || '表单'

      return `${statusLabel}`
    })

    return () => {
      const detail = detailData.value

      return (
        <>
          <ServiceAgreementFormComponent initialValue={initialData.value} loading={initialDataLoading.value}>
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
          {detail && (
            <div style="display: none;">
              <div id={'printable-approval-area'}>
                <UnifiedFormPrint
                  title={printTitle.value}
                  docNo={String(props.id ?? detail.id ?? '')}
                  previewUrl={previewUrl.value}
                  fields={buildServiceAgreementDiffCheckFields()}
                  data={toServiceAgreementDetailDiffCheckForm(detail)}
                  oldData={null}
                />
              </div>
            </div>
          )}
        </>
      )
    }
  },
})
