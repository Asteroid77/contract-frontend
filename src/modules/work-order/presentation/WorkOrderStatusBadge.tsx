import { defineComponent, type PropType } from 'vue'
import { NTag } from 'naive-ui'
import { WorkOrderStatus } from '../domain/enums'
import { useI18n } from 'vue-i18n'

const statusConfig: Record<
  WorkOrderStatus,
  { type: 'success' | 'warning' | 'info' | 'default'; bordered: boolean }
> = {
  [WorkOrderStatus.COMPLETED]: { type: 'success', bordered: true },
  [WorkOrderStatus.CANCELLED]: { type: 'warning', bordered: true },
  [WorkOrderStatus.PROCESSING]: { type: 'info', bordered: true },
  [WorkOrderStatus.PENDING]: { type: 'default', bordered: true },
}

export default defineComponent({
  name: 'WorkOrderStatusBadge',
  props: {
    status: {
      type: String as PropType<WorkOrderStatus>,
      required: true,
    },
  },
  setup(props) {
    const { t: $t } = useI18n()

    const statusLabelMap: Record<WorkOrderStatus, string> = {
      [WorkOrderStatus.PENDING]: 'domain.workOrder.status.pending',
      [WorkOrderStatus.PROCESSING]: 'domain.workOrder.status.processing',
      [WorkOrderStatus.COMPLETED]: 'domain.workOrder.status.completed',
      [WorkOrderStatus.CANCELLED]: 'domain.workOrder.status.cancelled',
    }

    return () => {
      const config = statusConfig[props.status] ?? statusConfig[WorkOrderStatus.PENDING]
      const label = statusLabelMap[props.status]
      return (
        <NTag size="small" type={config.type} bordered={config.bordered} round>
          {$t(label)}
        </NTag>
      )
    }
  },
})
