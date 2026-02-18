<script setup lang="ts">
import { ref, computed } from 'vue'
import { NModal, NCard, NForm, NFormItem, NInput, NSelect, NButton, NSpace } from 'naive-ui'
import { message } from '@/_utils/discrete_naive_api'
import { MdEditor } from 'md-editor-v3'
import 'md-editor-v3/lib/style.css'
import { useI18n } from 'vue-i18n'
import { useCreateWorkOrder } from '../application/hooks/useWorkOrderService'
import { useWorkOrderUpload } from '../application/hooks/useWorkOrderUpload'
import type { WorkOrderCategoryVO } from '../domain/types'
import { useRouter } from 'vue-router'

const props = defineProps<{
  show: boolean
  categories: WorkOrderCategoryVO[]
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

const categoryOptions = computed(() =>
  props.categories.map((c) => ({ label: c.name, value: c.id })),
)

const canSubmit = computed(() => !!categoryId.value && !!title.value.trim() && !!content.value.trim())

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
      style="width: 720px; max-width: 90vw"
      closable
      @close="handleClose"
    >
      <n-form label-placement="top">
        <n-form-item :label="$t('domain.workOrder.field.category')">
          <n-select
            v-model:value="categoryId"
            :options="categoryOptions"
            :placeholder="$t('common.placeholder.select', { label: $t('domain.workOrder.field.category') })"
          />
        </n-form-item>
        <n-form-item :label="$t('domain.workOrder.field.title')">
          <n-input
            v-model:value="title"
            :placeholder="$t('common.placeholder.input', { label: $t('domain.workOrder.field.title') })"
            maxlength="100"
            show-count
          />
        </n-form-item>
        <n-form-item :label="$t('domain.workOrder.field.content')">
          <MdEditor
            v-model="content"
            :language="'zh-CN'"
            style="width: 100%"
            :preview="false"
            @on-upload-img="onUploadImg"
          />
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
