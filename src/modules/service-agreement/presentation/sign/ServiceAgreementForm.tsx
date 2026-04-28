import type {
  ServiceAgreementUIMap,
  ServiceAgreementDetail,
} from '@/modules/service-agreement/application/models'
import { NCollapse, NCollapseItem, NForm, NIcon, NPopover, NText, type FormInst } from 'naive-ui'
import { defineComponent, computed, ref, type PropType, watch } from 'vue'
import CustomerInfoSection from './CustomerInfoSection'
import SignInfoSection from './SignInfoSection'
import AttachmentSection from './AttachmentSection'
import { ServiceAgreementStatusEnum } from '@/modules/service-agreement/application/constants'
import { $t } from '@/_utils/i18n'
import { createServiceAgreementModel } from '@/modules/service-agreement/application/ui-mappers'
import { WarningOutlined } from '@vicons/antd'
import type { ValidateError } from '@/types/vendor/naive-ui'
import { createServiceAgreementRules } from '@/modules/service-agreement/application/validation'
import FormSkeleton from '@/modules/shared/presentation/widget/FormSkeleton'
import './styles/SignFormGrid.css'

export default defineComponent({
  props: {
    initialValue: {
      type: Object as PropType<Partial<ServiceAgreementDetail>>,
      default: null,
    },
    loading: {
      type: Boolean,
      default: false,
    },
  },
  setup(props, { slots }) {
    const isSign = computed(() => {
      return formValue.value.customerInfo?.status === ServiceAgreementStatusEnum.Sign
    })
    const formValue = ref(createServiceAgreementModel(props.initialValue))
    const updateModel = (updatedFields: Partial<ServiceAgreementUIMap>) => {
      Object.assign(formValue.value, updatedFields)
    }
    watch(
      () => props.initialValue,
      (val) => {
        if (val) {
          formValue.value = createServiceAgreementModel(val)
        }
      },
    )
    const formRef = ref<FormInst | null>(null)
    const validationErrors = ref<ValidateError[][] | null>(null)
    const checkHasError = (prefix: string) => {
      if (!validationErrors.value) return false
      return validationErrors.value.some((errorGroup) => {
        return errorGroup.some((errorItem) => {
          return errorItem.field.startsWith(prefix)
        })
      })
    }

    const handleValidate = async () => {
      return new Promise((resolve) => {
        formRef.value?.validate((errors) => {
          if (errors && errors.length) {
            validationErrors.value = errors as ValidateError[][]
            resolve(false)
            return
          }
          validationErrors.value = null
          resolve(true)
        })
      })
    }
    const renderErrorIcon = (hasError: boolean) => {
      if (!hasError) return null
      return (
        <NPopover
          trigger="click"
          v-slots={{
            trigger: () => (
              <NText type="error">
                <NIcon size="18" style={{ verticalAlign: 'middle', marginLeft: '8px' }}>
                  <WarningOutlined />
                </NIcon>
              </NText>
            ),
            default: () => $t('common.error.validation'),
          }}
        ></NPopover>
      )
    }
    const formRule = computed(() => createServiceAgreementRules(formValue))
    return () => (
      <>
        <NForm model={formValue.value} ref={formRef} rules={formRule.value}>
          <NCollapse defaultExpandedNames={['baseInfo', 'signingDetails', 'attachments']}>
            <NCollapseItem
              title={$t('domain.agreement.tab.base')}
              name="baseInfo"
              v-slots={{
                header: () => (
                  <span>
                    {$t('domain.agreement.tab.base')}
                    {renderErrorIcon(checkHasError('customerInfo'))}
                  </span>
                ),
              }}
            >
              {props.loading ? (
                <FormSkeleton cols="1 s:2" rows={3} />
              ) : (
                <CustomerInfoSection
                  modelValue={formValue.value.customerInfo}
                  onUpdate:modelValue={(val) => updateModel({ customerInfo: val })}
                ></CustomerInfoSection>
              )}
            </NCollapseItem>
            {isSign.value && (
              <NCollapseItem
                title={$t('domain.agreement.tab.details')}
                name="signingDetails"
                v-slots={{
                  header: () => (
                    <span>
                      {$t('domain.agreement.tab.details')}
                      {renderErrorIcon(checkHasError('signInfo'))}
                    </span>
                  ),
                }}
              >
                {props.loading ? (
                  <FormSkeleton cols="1 s:2" rows={3} />
                ) : (
                  <SignInfoSection
                    modelValue={formValue.value.signInfo}
                    onUpdate:modelValue={(val) => updateModel({ signInfo: val })}
                  ></SignInfoSection>
                )}
              </NCollapseItem>
            )}
            {isSign.value && (
              <NCollapseItem
                title={$t('domain.agreement.tab.files')}
                name="attachments"
                v-slots={{
                  header: () => (
                    <span>
                      {$t('domain.agreement.tab.files')}
                      {renderErrorIcon(checkHasError('attachmentInfo'))}
                    </span>
                  ),
                }}
              >
                {props.loading ? (
                  <FormSkeleton cols="1 s:2" rows={3} count={3} type="upload" />
                ) : (
                  <AttachmentSection
                    modelValue={formValue.value.attachmentInfo}
                    onUpdate:modelValue={(val) => updateModel({ attachmentInfo: val })}
                    initialValue={{
                      contractScanFiles: props.initialValue?.contractScanFiles ?? [],
                      billFiles: props.initialValue?.billFiles ?? [],
                      supplementaryAttachmentFiles:
                        props.initialValue?.supplementaryAttachmentFiles ?? [],
                    }}
                  ></AttachmentSection>
                )}
              </NCollapseItem>
            )}
          </NCollapse>
        </NForm>
        {slots.Button ? slots.Button({ formValue: formValue.value, handleValidate }) : <></>}
      </>
    )
  },
})
