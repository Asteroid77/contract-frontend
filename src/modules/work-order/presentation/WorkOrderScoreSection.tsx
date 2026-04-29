import { computed, defineComponent, ref, type PropType } from 'vue'
import { NRate, NButton, NSpace, NText } from 'naive-ui'
import { message } from '@/_utils/discrete_naive_api'
import { useI18n } from 'vue-i18n'
import { useScoreWorkOrder, useUpdateScore } from '../application/hooks/useWorkOrderService'

export default defineComponent({
  name: 'WorkOrderScoreSection',
  props: {
    workOrderId: { type: Number, required: true },
    currentScore: { type: Number as PropType<number | null>, default: null },
  },
  setup(props) {
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

    return () => (
      <NSpace vertical size={8}>
        <NText strong>{$t('domain.workOrder.label.scoreHint')}</NText>
        <NSpace align="center" size={12}>
          <NRate
            v-model:value={localScore.value}
            readonly={hasExistingScore.value && !isEditing.value}
            count={5}
          />
          {hasExistingScore.value && !isEditing.value ? (
            <NButton
              size="small"
              onClick={() => {
                isEditing.value = true
              }}
            >
              {$t('domain.workOrder.action.updateScore')}
            </NButton>
          ) : (
            <NButton
              size="small"
              type="primary"
              disabled={localScore.value <= 0}
              loading={isPending.value}
              onClick={handleSubmitScore}
            >
              {$t('domain.workOrder.action.score')}
            </NButton>
          )}
        </NSpace>
      </NSpace>
    )
  },
})
