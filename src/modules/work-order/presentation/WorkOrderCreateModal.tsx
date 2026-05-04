import {
  computed,
  defineAsyncComponent,
  defineComponent,
  h,
  ref,
  Suspense,
  type PropType,
} from 'vue'
import { NModal, NCard, NForm, NFormItem, NInput, NButton, NSpace, NSpin } from 'naive-ui'
import { message } from '@/_utils/discrete_naive_api'
import { useI18n } from 'vue-i18n'
import { useCreateWorkOrder } from '../application/hooks/useWorkOrderService'
import { useWorkOrderUpload } from '../application/hooks/useWorkOrderUpload'
import { useRouter } from 'vue-router'
import WorkOrderCategorySelect from './WorkOrderCategorySelect'
import { loadMdEditor } from './md-editor-loader'
import './styles/WorkOrderCreateModal.css'

const AsyncMdEditor = defineAsyncComponent(loadMdEditor)

export default defineComponent({
  name: 'WorkOrderCreateModal',
  props: {
    show: { type: Boolean, required: true },
    categories: { type: Array as PropType<unknown[]>, default: () => [] },
  },
  emits: {
    'update:show': (_value: boolean) => true,
    success: () => true,
  },
  setup(props, { emit }) {
    const { t: $t } = useI18n()
    const router = useRouter()
    const createMutation = useCreateWorkOrder()
    const { onUploadImg } = useWorkOrderUpload()

    const categoryId = ref<number | undefined>(undefined)
    const title = ref('')
    const content = ref('')

    const canSubmit = computed(
      () => !!categoryId.value && !!title.value.trim() && !!content.value.trim(),
    )

    const handleClose = () => {
      emit('update:show', false)
    }

    const handleSubmit = () => {
      if (!categoryId.value || !title.value.trim() || !content.value.trim()) return

      createMutation.mutate(
        {
          categoryId: categoryId.value,
          title: title.value.trim(),
          content: content.value.trim(),
        },
        {
          onSuccess: (data) => {
            message.success($t('domain.workOrder.message.createSuccess'))
            categoryId.value = undefined
            title.value = ''
            content.value = ''
            emit('success')
            router.push({ name: 'work-order-detail', params: { id: data.id } })
          },
        },
      )
    }

    return () => (
      <NModal show={props.show} onUpdateShow={(value: boolean) => emit('update:show', value)}>
        <NCard
          title={$t('domain.workOrder.action.create')}
          bordered={false}
          class="work-order-create-modal-card"
          closable
          onClose={handleClose}
          v-slots={{
            default: () => (
              <NForm class="work-order-create-form-grid">
                <NFormItem label={$t('domain.workOrder.field.category')}>
                  <WorkOrderCategorySelect
                    value={categoryId.value ?? null}
                    showSearch={true}
                    showEdit={true}
                    showDelete={true}
                    showAdd={true}
                    onUpdate:value={(value: number | null) => {
                      categoryId.value = value ?? undefined
                    }}
                  />
                </NFormItem>
                <NFormItem label={$t('domain.workOrder.field.title')}>
                  <NInput
                    v-model:value={title.value}
                    placeholder={$t('common.placeholder.input', {
                      label: $t('domain.workOrder.field.title'),
                    })}
                    maxlength={100}
                    showCount
                  />
                </NFormItem>
                <NFormItem label={$t('domain.workOrder.field.content')}>
                  <Suspense
                    v-slots={{
                      default: () =>
                        h(AsyncMdEditor, {
                          modelValue: content.value,
                          'onUpdate:modelValue': (value: string) => {
                            content.value = value
                          },
                          language: 'zh-CN',
                          style: 'width: 100%',
                          preview: false,
                          onOnUploadImg: onUploadImg,
                        }),
                      fallback: () => (
                        <NSpin show={true} class="editor-loading-shell">
                          <div class="editor-loading-placeholder" />
                        </NSpin>
                      ),
                    }}
                  />
                </NFormItem>
              </NForm>
            ),
            footer: () => (
              <NSpace justify="end">
                <NButton onClick={handleClose}>{$t('common.action.cancel')}</NButton>
                <NButton
                  type="primary"
                  disabled={!canSubmit.value}
                  loading={createMutation.isPending.value}
                  onClick={handleSubmit}
                >
                  {$t('common.action.submit')}
                </NButton>
              </NSpace>
            ),
          }}
        />
      </NModal>
    )
  },
})
