import { $t } from '@/_utils/i18n'
import type { PreviewType } from '@/modules/service-agreement/application/models'
import AttachmentApprovalDiff from '@/modules/service-agreement/presentation/sign/AttachmentApprovalDiff'
import { PreviewTypeEnum } from '@/modules/service-agreement/application/constants'
import { usePreviewAttachments } from '@/modules/service-agreement/application/hooks/useSignService'
import { previewAttachmentsRule } from '@/modules/service-agreement/application/validation'
import AppFormItem from '@/modules/shared/presentation/widget/AppFormItem'
import clsx from 'clsx'
import { NButton, NForm, NInput, NResult, type FormInst } from 'naive-ui'
import { computed, ref, type PropType } from 'vue'
import { defineComponent } from 'vue'

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
        console.log('errors', errors)
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
      { title: $t('serviceAgreement.attachments.bills'), key: 'billFiles' },
      {
        title: $t('serviceAgreement.attachments.contractScans'),
        key: 'contractScanFiles',
      },
      {
        title: $t('serviceAgreement.attachments.supplementary'),
        key: 'supplementaryAttachmentFiles',
      },
    ]
    return () => (
      <>
        {!hasValue.value && (
          <NResult
            status="403"
            title="请输入访问码以继续访问"
            description="备案/签约内的联系人电话后四位"
            class={clsx('w-full', 'h-full', '  ')}
            v-slots={{
              footer: () => (
                <NForm model={formData.value} rules={previewAttachmentsRule} ref={formRef}>
                  <AppFormItem label={$t('serviceAgreement.attachments.print.code')} path={'code'}>
                    <NInput
                      value={formData.value.code}
                      onUpdateValue={(e) => (formData.value.code = e)}
                    ></NInput>
                  </AppFormItem>
                  <NButton onClick={access} loading={preview.isLoading.value}>
                    {'访问'}
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
