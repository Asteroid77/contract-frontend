import { defineComponent, type PropType } from 'vue'
import { NSpace, NText, NTag, NPopconfirm } from 'naive-ui'
import { useI18n } from 'vue-i18n'
import type { WorkOrderDetailVO } from '../domain/types'
import WorkOrderStatusBadge from './WorkOrderStatusBadge'
import { formatted } from '@/modules/shared/presentation/time'

export default defineComponent({
  name: 'WorkOrderDetailHeader',
  props: {
    detail: {
      type: Object as PropType<WorkOrderDetailVO>,
      required: true,
    },
    initiatorName: {
      type: String,
      required: true,
    },
    claimerName: {
      type: String as PropType<string | null>,
      default: null,
    },
    canCancel: {
      type: Boolean,
      default: false,
    },
  },
  emits: {
    cancel: () => true,
  },
  setup(props, { emit }) {
    const { t: $t } = useI18n()

    return () => (
      <NSpace vertical size={8}>
        <NSpace align="center" size={12}>
          <h2 class="m-0">{props.detail.title}</h2>
          <WorkOrderStatusBadge status={props.detail.status} />
          {props.canCancel && (
            <NPopconfirm
              onPositiveClick={() => emit('cancel')}
              v-slots={{
                trigger: () => (
                  <NTag size="small" type="warning" round class="cursor-pointer">
                    {$t('domain.workOrder.action.cancel')}
                  </NTag>
                ),
                default: () => $t('domain.workOrder.message.cancelConfirm'),
              }}
            />
          )}
        </NSpace>
        <NSpace size={16}>
          <NText depth={3}>{props.detail.categoryName}</NText>
          <NText depth={3}>{formatted(props.detail.createdTime).standard}</NText>
          {props.detail.completedAt && (
            <NText depth={3}>
              {$t('domain.workOrder.label.completedAt')}:{' '}
              {formatted(props.detail.completedAt).standard}
            </NText>
          )}
        </NSpace>
        <NSpace size={16}>
          <NText depth={3}>
            {$t('domain.workOrder.label.initiator')}: {props.initiatorName}
          </NText>
          {props.claimerName && (
            <NText depth={3}>
              {$t('domain.workOrder.label.claimer')}: {props.claimerName}
            </NText>
          )}
        </NSpace>
      </NSpace>
    )
  },
})
