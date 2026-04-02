<script setup lang="ts">
import { ref, computed } from 'vue'
import { NRate, NButton, NSpace, NText } from 'naive-ui'
import { message } from '@/_utils/discrete_naive_api'
import { useI18n } from 'vue-i18n'
import { useScoreWorkOrder, useUpdateScore } from '../application/hooks/useWorkOrderService'

const props = defineProps<{
  workOrderId: number
  currentScore: number | null
}>()

const { t: $t } = useI18n()
const scoreMutation = useScoreWorkOrder()
const updateScoreMutation = useUpdateScore()

const localScore = ref(props.currentScore ?? 0)
const isEditing = ref(false)

const hasExistingScore = computed(() => props.currentScore != null && props.currentScore > 0)
const isPending = computed(
  () => scoreMutation.isPending.value || updateScoreMutation.isPending.value,
)

const handleSubmitScore = () => {
  if (localScore.value <= 0) return

  if (hasExistingScore.value) {
    updateScoreMutation.mutate(
      { id: props.workOrderId, dto: { score: localScore.value } },
      {
        onSuccess: () => {
          message.success($t('domain.workOrder.message.scoreSuccess'))
          isEditing.value = false
        },
      },
    )
  } else {
    scoreMutation.mutate(
      { id: props.workOrderId, dto: { score: localScore.value } },
      {
        onSuccess: () => {
          message.success($t('domain.workOrder.message.scoreSuccess'))
          isEditing.value = false
        },
      },
    )
  }
}
</script>
<template>
  <n-space vertical :size="8">
    <n-text strong>{{ $t('domain.workOrder.label.scoreHint') }}</n-text>
    <n-space align="center" :size="12">
      <n-rate v-model:value="localScore" :readonly="hasExistingScore && !isEditing" :count="5" />
      <template v-if="hasExistingScore && !isEditing">
        <n-button size="small" @click="isEditing = true">
          {{ $t('domain.workOrder.action.updateScore') }}
        </n-button>
      </template>
      <template v-else>
        <n-button
          size="small"
          type="primary"
          :disabled="localScore <= 0"
          :loading="isPending"
          @click="handleSubmitScore"
        >
          {{ $t('domain.workOrder.action.score') }}
        </n-button>
      </template>
    </n-space>
  </n-space>
</template>
