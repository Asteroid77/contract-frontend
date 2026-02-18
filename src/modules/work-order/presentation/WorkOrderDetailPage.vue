<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import {
  NSpace,
  NButton,
  NDivider,
  NText,
  NCard,
  NResult,
  NPopconfirm,
  NInput,
  NSpin,
} from 'naive-ui'
import { message } from '@/_utils/discrete_naive_api'
import { MdEditor, MdPreview } from 'md-editor-v3'
import 'md-editor-v3/lib/style.css'
import { useI18n } from 'vue-i18n'
import { useAccountStore } from '@/modules/user/application/stores/useAccountStore'
import {
  useWorkOrderDetail,
  useWorkOrderReplies,
  useAddReply,
  useCancelWorkOrder,
  useCompleteWorkOrder,
  useRejectHandler,
  useReopenWorkOrder,
  useHandlerDetail,
  useHandlerReplies,
  useHandlerAddReply,
  useClaimWorkOrder,
  useReleaseWorkOrder,
  useHandlerComplete,
} from '../application/hooks/useWorkOrderService'
import { useWorkOrderUpload } from '../application/hooks/useWorkOrderUpload'
import { WorkOrderStatus, WorkOrderUserType } from '../domain/enums'
import WorkOrderStatusBadge from './WorkOrderStatusBadge'
import WorkOrderScoreSection from './WorkOrderScoreSection.vue'
import { formatted } from '@/modules/shared/presentation/time'

const route = useRoute()
const { t: $t } = useI18n()
const accountStore = useAccountStore()
const { onUploadImg } = useWorkOrderUpload()

const workOrderId = computed(() => {
  const id = route.params.id
  if (typeof id === 'string') {
    const parsed = parseInt(id, 10)
    return isNaN(parsed) ? 0 : parsed
  }
  return 0
})

const isHandler = computed(() => accountStore.hasRole('work_order_handler'))

// Queries - use handler or user endpoints based on role
const userDetailQuery = useWorkOrderDetail(workOrderId)
const handlerDetailQuery = useHandlerDetail(workOrderId, { enabled: isHandler })
const detailQuery = computed(() => (isHandler.value ? handlerDetailQuery : userDetailQuery))

const userRepliesQuery = useWorkOrderReplies(workOrderId)
const handlerRepliesQuery = useHandlerReplies(workOrderId, { enabled: isHandler })
const repliesQuery = computed(() => (isHandler.value ? handlerRepliesQuery : userRepliesQuery))

const detail = computed(() => detailQuery.value.data.value)
const replies = computed(() => repliesQuery.value.data.value ?? [])

// Mutations
const userAddReply = useAddReply()
const handlerAddReplyMutation = useHandlerAddReply()
const cancelMutation = useCancelWorkOrder()
const completeMutation = useCompleteWorkOrder()
const rejectMutation = useRejectHandler()
const reopenMutation = useReopenWorkOrder()
const claimMutation = useClaimWorkOrder()
const releaseMutation = useReleaseWorkOrder()
const handlerCompleteMutation = useHandlerComplete()

// Reply editor state
const replyContent = ref('')
const rejectRemark = ref('')

// Permission checks
const isOwner = computed(() => detail.value && accountStore.isOwner(detail.value.userId))
const isCurrentHandler = computed(
  () => detail.value && detail.value.currentHandlerId === accountStore.account?.user?.id,
)

const canReply = computed(() => {
  if (!detail.value) return false
  const status = detail.value.status
  if (isHandler.value) {
    return isCurrentHandler.value && status === WorkOrderStatus.PROCESSING
  }
  return status !== WorkOrderStatus.COMPLETED && status !== WorkOrderStatus.CANCELLED
})

const canCancel = computed(
  () => isOwner.value && detail.value?.status !== WorkOrderStatus.CANCELLED && detail.value?.status !== WorkOrderStatus.COMPLETED,
)
const canComplete = computed(
  () =>
    (isOwner.value || isCurrentHandler.value) &&
    detail.value?.status === WorkOrderStatus.PROCESSING,
)
const canReopen = computed(
  () => isOwner.value && detail.value?.status === WorkOrderStatus.CANCELLED,
)
const canReject = computed(
  () =>
    isOwner.value &&
    detail.value?.status === WorkOrderStatus.PROCESSING &&
    detail.value?.currentHandlerId != null,
)
const canClaim = computed(
  () => isHandler.value && detail.value?.status === WorkOrderStatus.PENDING,
)
const canRelease = computed(
  () => isHandler.value && isCurrentHandler.value && detail.value?.status === WorkOrderStatus.PROCESSING,
)
const canScore = computed(
  () => isOwner.value && detail.value?.status === WorkOrderStatus.COMPLETED,
)

const handleReply = () => {
  if (!replyContent.value.trim() || !workOrderId.value) return
  const dto = { content: replyContent.value.trim() }
  const mutation = isHandler.value ? handlerAddReplyMutation : userAddReply

  mutation.mutate(
    { workOrderId: workOrderId.value, dto },
    {
      onSuccess: () => {
        message.success($t('domain.workOrder.message.replySuccess'))
        replyContent.value = ''
      },
    },
  )
}

const handleCancel = () => {
  cancelMutation.mutate(workOrderId.value, {
    onSuccess: () => message.success($t('domain.workOrder.message.cancelSuccess')),
  })
}

const handleComplete = () => {
  const mutation = isHandler.value ? handlerCompleteMutation : completeMutation
  mutation.mutate(workOrderId.value, {
    onSuccess: () => message.success($t('domain.workOrder.message.completeSuccess')),
  })
}

const handleReopen = () => {
  reopenMutation.mutate(workOrderId.value, {
    onSuccess: () => message.success($t('domain.workOrder.message.reopenSuccess')),
  })
}

const handleReject = () => {
  rejectMutation.mutate(
    { id: workOrderId.value, remark: rejectRemark.value || undefined },
    {
      onSuccess: () => {
        message.success($t('domain.workOrder.message.rejectSuccess'))
        rejectRemark.value = ''
      },
    },
  )
}

const handleClaim = () => {
  claimMutation.mutate(workOrderId.value, {
    onSuccess: () => message.success($t('domain.workOrder.message.claimSuccess')),
  })
}

const handleRelease = () => {
  releaseMutation.mutate(workOrderId.value, {
    onSuccess: () => message.success($t('domain.workOrder.message.releaseSuccess')),
  })
}
</script>
<template>
  <n-result
    v-if="!workOrderId"
    status="418"
    :title="$t('common.error.pageLoad')"
    :description="$t('common.error.pageLoadMeta')"
  >
    <template #footer>
      <n-button @click="$router.back()">{{ $t('common.action.back') }}</n-button>
    </template>
  </n-result>

  <n-spin v-else :show="detailQuery.isLoading.value">
    <n-space v-if="detail" vertical :size="20" style="max-width: 960px; margin: 0 auto">
      <!-- Header -->
      <n-space vertical :size="8">
        <n-space align="center" :size="12">
          <h2 style="margin: 0">{{ detail.title }}</h2>
          <WorkOrderStatusBadge :status="detail.status" />
        </n-space>
        <n-space :size="16">
          <n-text depth="3">{{ detail.categoryName }}</n-text>
          <n-text depth="3">{{ formatted(detail.createdTime).standard }}</n-text>
          <n-text v-if="detail.completedAt" depth="3">
            {{ $t('domain.workOrder.label.completedAt') }}: {{ formatted(detail.completedAt).standard }}
          </n-text>
        </n-space>
      </n-space>

      <!-- Action buttons -->
      <n-space :size="8">
        <n-popconfirm v-if="canClaim" @positive-click="handleClaim">
          <template #trigger>
            <n-button size="small" type="primary" :loading="claimMutation.isPending.value">
              {{ $t('domain.workOrder.action.claim') }}
            </n-button>
          </template>
          {{ $t('domain.workOrder.message.claimConfirm') }}
        </n-popconfirm>

        <n-popconfirm v-if="canRelease" @positive-click="handleRelease">
          <template #trigger>
            <n-button size="small" :loading="releaseMutation.isPending.value">
              {{ $t('domain.workOrder.action.release') }}
            </n-button>
          </template>
          {{ $t('domain.workOrder.message.releaseConfirm') }}
        </n-popconfirm>

        <n-popconfirm v-if="canComplete" @positive-click="handleComplete">
          <template #trigger>
            <n-button size="small" type="success">
              {{ $t('domain.workOrder.action.complete') }}
            </n-button>
          </template>
          {{ $t('domain.workOrder.message.completeConfirm') }}
        </n-popconfirm>

        <n-popconfirm v-if="canCancel" @positive-click="handleCancel">
          <template #trigger>
            <n-button size="small" type="warning">
              {{ $t('domain.workOrder.action.cancel') }}
            </n-button>
          </template>
          {{ $t('domain.workOrder.message.cancelConfirm') }}
        </n-popconfirm>

        <n-popconfirm v-if="canReopen" @positive-click="handleReopen">
          <template #trigger>
            <n-button size="small">
              {{ $t('domain.workOrder.action.reopen') }}
            </n-button>
          </template>
          {{ $t('domain.workOrder.message.reopenConfirm') }}
        </n-popconfirm>

        <n-popconfirm v-if="canReject" @positive-click="handleReject">
          <template #trigger>
            <n-button size="small" type="error">
              {{ $t('domain.workOrder.action.reject') }}
            </n-button>
          </template>
          <n-space vertical :size="8">
            <span>{{ $t('domain.workOrder.message.rejectConfirm') }}</span>
            <n-input
              v-model:value="rejectRemark"
              size="small"
              :placeholder="$t('domain.workOrder.label.rejectRemark')"
            />
          </n-space>
        </n-popconfirm>
      </n-space>

      <!-- Content -->
      <n-card :bordered="false">
        <MdPreview :model-value="detail.content" />
      </n-card>

      <n-divider />

      <!-- Score section (only for owner + completed) -->
      <WorkOrderScoreSection
        v-if="canScore"
        :work-order-id="workOrderId"
        :current-score="detail.score"
      />

      <!-- Replies -->
      <n-space vertical :size="16">
        <h3 style="margin: 0">{{ $t('domain.workOrder.action.reply') }} ({{ replies.length }})</h3>

        <n-text v-if="replies.length === 0" depth="3">
          {{ $t('domain.workOrder.message.noReplies') }}
        </n-text>

        <n-card
          v-for="reply in replies"
          :key="reply.id"
          :bordered="true"
          size="small"
          :style="{
            borderLeft: reply.userType === 'HANDLER' ? '3px solid var(--n-color-target)' : '3px solid var(--n-border-color)',
          }"
        >
          <template #header>
            <n-space align="center" :size="8">
              <n-text strong>
                {{ reply.userType === WorkOrderUserType.HANDLER
                  ? $t('domain.workOrder.label.handlerReply')
                  : $t('domain.workOrder.label.userReply') }}
              </n-text>
              <n-text depth="3" style="font-size: 12px">
                {{ formatted(reply.createdTime).standard }}
              </n-text>
            </n-space>
          </template>
          <MdPreview :model-value="reply.content" />
        </n-card>
      </n-space>

      <!-- Reply editor -->
      <n-card v-if="canReply" :bordered="false">
        <n-space vertical :size="12">
          <MdEditor
            v-model="replyContent"
            :language="'zh-CN'"
            style="width: 100%"
            :preview="false"
            @on-upload-img="onUploadImg"
          />
          <n-space justify="end">
            <n-button
              type="primary"
              :disabled="!replyContent.trim()"
              :loading="userAddReply.isPending.value || handlerAddReplyMutation.isPending.value"
              @click="handleReply"
            >
              {{ $t('domain.workOrder.action.reply') }}
            </n-button>
          </n-space>
        </n-space>
      </n-card>
    </n-space>
  </n-spin>
</template>
