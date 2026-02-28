<script setup lang="ts">
import { ref, computed, defineAsyncComponent } from 'vue'
import { NModal, NCard, NForm, NFormItem, NInput, NButton, NSpace, NSpin } from 'naive-ui'
import { message } from '@/_utils/discrete_naive_api'
import { useI18n } from 'vue-i18n'
import { useCreateWorkOrder } from '../application/hooks/useWorkOrderService'
import { useWorkOrderUpload } from '../application/hooks/useWorkOrderUpload'
import { useRouter } from 'vue-router'
import WorkOrderCategorySelect from './WorkOrderCategorySelect'

const AsyncMdEditor = defineAsyncComponent(async () => {
  const [{ MdEditor }] = await Promise.all([
    import('md-editor-v3'),
    import('md-editor-v3/lib/style.css'),
  ])

  return MdEditor
})

defineProps<{
  show: boolean
}>()

const emit = defineEmits<{
  'update:show': [value: boolean]
  success: []
}>()

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
</script>
<template>
  <n-modal :show="show" @update:show="(v) => emit('update:show', v)">
    <n-card
      :title="$t('domain.workOrder.action.create')"
      :bordered="false"
      class="work-order-create-modal-card"
      closable
      @close="handleClose"
    >
      <n-form class="work-order-create-form-grid">
        <n-form-item :label="$t('domain.workOrder.field.category')">
          <WorkOrderCategorySelect
            v-model:value="categoryId"
            :showSearch="true"
            :showEdit="true"
            :showDelete="true"
            :showAdd="true"
          />
        </n-form-item>
        <n-form-item :label="$t('domain.workOrder.field.title')">
          <n-input
            v-model:value="title"
            :placeholder="
              $t('common.placeholder.input', { label: $t('domain.workOrder.field.title') })
            "
            maxlength="100"
            show-count
          />
        </n-form-item>
        <n-form-item :label="$t('domain.workOrder.field.content')">
          <Suspense>
            <component
              :is="AsyncMdEditor"
              v-model="content"
              :language="'zh-CN'"
              style="width: 100%"
              :preview="false"
              @on-upload-img="onUploadImg"
            />
            <template #fallback>
              <n-spin :show="true" class="editor-loading-shell">
                <div class="editor-loading-placeholder" />
              </n-spin>
            </template>
          </Suspense>
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="handleClose">{{ $t('common.action.cancel') }}</n-button>
          <n-button
            type="primary"
            :disabled="!canSubmit"
            :loading="createMutation.isPending.value"
            @click="handleSubmit"
          >
            {{ $t('common.action.submit') }}
          </n-button>
        </n-space>
      </template>
    </n-card>
  </n-modal>
</template>

<style scoped>
.work-order-create-modal-card {
  inline-size: 45rem;
  max-inline-size: 90vw;
}

.work-order-create-form-grid {
  container-name: work-order-create-form-grid;
  container-type: inline-size;
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  column-gap: var(--spacing-16);
  row-gap: var(--spacing-16);
}

.work-order-create-form-grid :deep(.n-form-item) {
  grid-column: 1 / -1;
  display: grid;
  grid-template-columns: subgrid;
  column-gap: var(--spacing-16);
  margin-bottom: 0;
}

.work-order-create-form-grid :deep(.n-form-item .n-form-item-label) {
  grid-column: span 4;
  margin-bottom: 0;
}

.work-order-create-form-grid :deep(.n-form-item .n-form-item-blank) {
  grid-column: span 8;
  min-width: 0;
}

.editor-loading-shell {
  inline-size: 100%;
}

.editor-loading-placeholder {
  inline-size: 100%;
  block-size: 18rem;
  border-radius: var(--borderRadius-8);
  background: var(--colorFillQuaternary);
}

@container work-order-create-form-grid (max-width: 48rem) {
  .work-order-create-form-grid :deep(.n-form-item .n-form-item-label),
  .work-order-create-form-grid :deep(.n-form-item .n-form-item-blank) {
    grid-column: 1 / -1;
  }
}
</style>
