import { defineComponent } from 'vue'
import { NButton, NInput, NPopconfirm, NSpace } from 'naive-ui'
import { useI18n } from 'vue-i18n'

export default defineComponent({
  name: 'WorkOrderDetailActions',
  props: {
    canClaim: {
      type: Boolean,
      default: false,
    },
    canRelease: {
      type: Boolean,
      default: false,
    },
    canComplete: {
      type: Boolean,
      default: false,
    },
    canReopen: {
      type: Boolean,
      default: false,
    },
    canReject: {
      type: Boolean,
      default: false,
    },
    claimLoading: {
      type: Boolean,
      default: false,
    },
    releaseLoading: {
      type: Boolean,
      default: false,
    },
    rejectRemark: {
      type: String,
      default: '',
    },
  },
  emits: {
    claim: () => true,
    release: () => true,
    complete: () => true,
    reopen: () => true,
    reject: () => true,
    'update:rejectRemark': (_value: string) => true,
  },
  setup(props, { emit }) {
    const { t: $t } = useI18n()

    return () => (
      <NSpace size={8}>
        {props.canClaim && (
          <NPopconfirm
            onPositiveClick={() => emit('claim')}
            v-slots={{
              trigger: () => (
                <NButton size="small" type="primary" loading={props.claimLoading}>
                  {$t('domain.workOrder.action.claim')}
                </NButton>
              ),
              default: () => $t('domain.workOrder.message.claimConfirm'),
            }}
          />
        )}

        {props.canRelease && (
          <NPopconfirm
            onPositiveClick={() => emit('release')}
            v-slots={{
              trigger: () => (
                <NButton size="small" loading={props.releaseLoading}>
                  {$t('domain.workOrder.action.release')}
                </NButton>
              ),
              default: () => $t('domain.workOrder.message.releaseConfirm'),
            }}
          />
        )}

        {props.canComplete && (
          <NPopconfirm
            onPositiveClick={() => emit('complete')}
            v-slots={{
              trigger: () => (
                <NButton size="small" type="success">
                  {$t('domain.workOrder.action.complete')}
                </NButton>
              ),
              default: () => $t('domain.workOrder.message.completeConfirm'),
            }}
          />
        )}

        {props.canReopen && (
          <NPopconfirm
            onPositiveClick={() => emit('reopen')}
            v-slots={{
              trigger: () => <NButton size="small">{$t('domain.workOrder.action.reopen')}</NButton>,
              default: () => $t('domain.workOrder.message.reopenConfirm'),
            }}
          />
        )}

        {props.canReject && (
          <NPopconfirm
            onPositiveClick={() => emit('reject')}
            v-slots={{
              trigger: () => (
                <NButton size="small" type="error">
                  {$t('domain.workOrder.action.reject')}
                </NButton>
              ),
              default: () => (
                <NSpace vertical size={8}>
                  <span>{$t('domain.workOrder.message.rejectConfirm')}</span>
                  <NInput
                    value={props.rejectRemark}
                    onUpdate:value={(value: string) => emit('update:rejectRemark', value)}
                    size="small"
                    placeholder={$t('domain.workOrder.label.rejectRemark')}
                  />
                </NSpace>
              ),
            }}
          />
        )}
      </NSpace>
    )
  },
})
