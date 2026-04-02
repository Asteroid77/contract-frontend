import { $t } from '@/_utils/i18n'
import type { PreviewType } from '@/modules/service-agreement/application/models'
import AttachmentApprovalDiff from '@/modules/service-agreement/presentation/sign/AttachmentApprovalDiff'
import { PreviewTypeEnum } from '@/modules/service-agreement/application/constants'
import { usePreviewAttachments } from '@/modules/service-agreement/application/hooks/useSignService'
import { previewAttachmentsRule } from '@/modules/service-agreement/application/validation'
import AppFormItem from '@/modules/shared/presentation/widget/AppFormItem'
import clsx from 'clsx'
import { NButton, NForm, NInput, NResult, type FormInst } from 'naive-ui'
import { computed, defineComponent, ref, type PropType } from 'vue'
import './styles/PreviewAttachments.css'

export default defineComponent({
  props: {
    type: { type: Number as PropType<PreviewType>, required: true },
    id: { type: Number, required: true },
  },
  setup(props) {
    const formData = ref<FormInput<{ code: string }>>({})
    const formRef = ref<FormInst | null>(null)
    const requestParameters = computed(() => {
      return {
        id: props.id,
        type: props.type,
        code: formData.value.code as string,
      }
    })
    const enableQuery = ref<boolean>(false)
    const preview = usePreviewAttachments(requestParameters, enableQuery)
    const access = () => {
      formRef.value?.validate((errors) => {
        if (!errors || !errors?.length) {
          enableQuery.value = true
        }
      })
    }
    const hasValue = computed(() => !!preview.data.value)
    const filesMap = computed(() => {
      return {
        new: preview.data.value?.newFiles ?? null,
        old: preview.data.value?.oldFiles
          ? preview.data.value.oldFiles
          : props.type === PreviewTypeEnum.FORM_VIEW
            ? undefined
            : null,
      }
    })
    const rules = [
      { title: $t('domain.agreement.file.bill'), key: 'billFiles' },
      {
        title: $t('domain.agreement.file.contract'),
        key: 'contractScanFiles',
      },
      {
        title: $t('domain.agreement.file.other'),
        key: 'supplementaryAttachmentFiles',
      },
    ]
    return () => (
      <>
        {!hasValue.value && (
          <NResult
            status="403"
            title={$t('domain.agreement.preview.accessTitle')}
            description={$t('domain.agreement.preview.accessDesc')}
            class={clsx('w-full', 'h-full', '  ')}
            v-slots={{
              footer: () => (
                <NForm
                  model={formData.value}
                  rules={previewAttachmentsRule}
                  ref={formRef}
                  class="preview-attachments-form-grid"
                >
                  <AppFormItem label={$t('domain.agreement.print.code')} path={'code'}>
                    <NInput
                      value={formData.value.code}
                      onUpdateValue={(e) => (formData.value.code = e)}
                    ></NInput>
                  </AppFormItem>
                  <NButton
                    onClick={access}
                    loading={preview.isLoading.value}
                    class="preview-attachments-form-grid__submit"
                  >
                    {$t('domain.agreement.preview.accessAction')}
                  </NButton>
                </NForm>
              ),
            }}
          ></NResult>
        )}
        {hasValue.value && (
          <AttachmentApprovalDiff filesMap={filesMap.value} rules={rules}></AttachmentApprovalDiff>
        )}
      </>
    )
  },
})
