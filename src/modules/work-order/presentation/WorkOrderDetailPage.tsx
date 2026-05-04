import { computed, defineAsyncComponent, defineComponent, h, ref, Suspense } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  NSpace,
  NButton,
  NDivider,
  NText,
  NTag,
  NCard,
  NResult,
  NPopconfirm,
  NInput,
  NSpin,
} from 'naive-ui'
import { message } from '@/_utils/discrete_naive_api'
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
import type { WorkOrderReplyVO } from '../domain/types'
import WorkOrderStatusBadge from './WorkOrderStatusBadge'
import WorkOrderScoreSection from './WorkOrderScoreSection'
import { formatted } from '@/modules/shared/presentation/time'
import { resolveUserDisplayName } from '@/modules/user/application/utils/displayName'
import { loadMdEditor, loadMdPreview } from './md-editor-loader'
import './styles/WorkOrderDetailPage.css'

const AsyncMdPreview = defineAsyncComponent(loadMdPreview)
const AsyncMdEditor = defineAsyncComponent(loadMdEditor)

export default defineComponent({
  name: 'WorkOrderDetailPage',
  setup() {
    const route = useRoute()
    const router = useRouter()
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
    const currentUserId = computed(() => accountStore.account?.user?.id ?? accountStore.user.id)
    const currentUserDisplayName = computed(() =>
      resolveUserDisplayName({ name: accountStore.user.name }),
    )

    const userDetailQuery = useWorkOrderDetail(workOrderId, {
      enabled: computed(() => !isHandler.value),
    })
    const handlerDetailQuery = useHandlerDetail(workOrderId, { enabled: isHandler })
    const detailQuery = computed(() => (isHandler.value ? handlerDetailQuery : userDetailQuery))

    const detail = computed(() => detailQuery.value.data.value)

    const userAddReply = useAddReply()
    const handlerAddReplyMutation = useHandlerAddReply()
    const cancelMutation = useCancelWorkOrder()
    const completeMutation = useCompleteWorkOrder()
    const rejectMutation = useRejectHandler()
    const reopenMutation = useReopenWorkOrder()
    const claimMutation = useClaimWorkOrder()
    const releaseMutation = useReleaseWorkOrder()
    const handlerCompleteMutation = useHandlerComplete()

    const replyContent = ref('')
    const rejectRemark = ref('')

    const isOwner = computed(() => detail.value && accountStore.isOwner(detail.value.userId))
    const isCurrentHandler = computed(
      () => detail.value && detail.value.currentHandlerId === currentUserId.value,
    )

    const canReplyAsHandler = computed(() => {
      if (!detail.value) return false
      return (
        isHandler.value &&
        isCurrentHandler.value &&
        detail.value.status === WorkOrderStatus.PROCESSING
      )
    })

    const canReplyAsUser = computed(() => {
      if (!detail.value) return false
      const status = detail.value.status
      if (status === WorkOrderStatus.COMPLETED || status === WorkOrderStatus.CANCELLED) {
        return false
      }
      return !isHandler.value || isOwner.value
    })

    const replyApiMode = computed<'user' | 'handler' | null>(() => {
      if (!workOrderId.value) return null
      if (!isHandler.value) return 'user'
      if (!detail.value) return null

      if (canReplyAsHandler.value || !isOwner.value) {
        return 'handler'
      }

      return 'user'
    })

    const userRepliesQuery = useWorkOrderReplies(workOrderId, {
      enabled: computed(() => replyApiMode.value === 'user'),
    })
    const handlerRepliesQuery = useHandlerReplies(workOrderId, {
      enabled: computed(() => replyApiMode.value === 'handler'),
    })
    const repliesQuery = computed(() =>
      replyApiMode.value === 'handler' ? handlerRepliesQuery : userRepliesQuery,
    )
    const replies = computed(() => repliesQuery.value.data.value ?? [])

    const canReply = computed(() => {
      return canReplyAsHandler.value || canReplyAsUser.value
    })

    const canCancel = computed(
      () =>
        isOwner.value &&
        detail.value?.status !== WorkOrderStatus.CANCELLED &&
        detail.value?.status !== WorkOrderStatus.COMPLETED,
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
      () =>
        isHandler.value &&
        isCurrentHandler.value &&
        detail.value?.status === WorkOrderStatus.PROCESSING,
    )
    const canScore = computed(
      () => isOwner.value && detail.value?.status === WorkOrderStatus.COMPLETED,
    )

    const initiatorName = computed(() => {
      if (!detail.value) return '-'
      const detailUserDisplayName = resolveUserDisplayName({ name: detail.value.userName })
      if (detailUserDisplayName) return detailUserDisplayName
      if (accountStore.isOwner(detail.value.userId) && currentUserDisplayName.value) {
        return currentUserDisplayName.value
      }
      return `#${detail.value.userId}`
    })

    const claimerName = computed(() => {
      if (!detail.value || detail.value.currentHandlerId == null) return null
      const handlerDisplayName = resolveUserDisplayName({ name: detail.value.currentHandlerName })
      if (handlerDisplayName) return handlerDisplayName
      if (detail.value.currentHandlerId === currentUserId.value && currentUserDisplayName.value) {
        return currentUserDisplayName.value
      }
      return `#${detail.value.currentHandlerId}`
    })

    const replyAuthorName = (reply: WorkOrderReplyVO) => {
      const replyUserDisplayName = resolveUserDisplayName({ name: reply.userName })
      if (replyUserDisplayName) return replyUserDisplayName
      if (reply.userId === currentUserId.value && currentUserDisplayName.value) {
        return currentUserDisplayName.value
      }
      return `#${reply.userId}`
    }

    const handleReply = () => {
      if (!replyContent.value.trim() || !workOrderId.value) return
      const dto = { content: replyContent.value.trim() }
      const mutation = canReplyAsHandler.value ? handlerAddReplyMutation : userAddReply

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

    const renderMarkdownPreview = (content: string) => (
      <Suspense
        v-slots={{
          default: () => h(AsyncMdPreview, { modelValue: content }),
          fallback: () => (
            <NSpin show={true} class="markdown-loading-shell">
              <div class="markdown-preview-loading-placeholder" />
            </NSpin>
          ),
        }}
      />
    )

    const renderReplyEditor = () => (
      <Suspense
        v-slots={{
          default: () =>
            h(AsyncMdEditor, {
              modelValue: replyContent.value,
              'onUpdate:modelValue': (value: string) => {
                replyContent.value = value
              },
              language: 'zh-CN',
              class: 'w-full',
              preview: false,
              onOnUploadImg: onUploadImg,
            }),
          fallback: () => (
            <NSpin show={true} class="markdown-loading-shell">
              <div class="markdown-editor-loading-placeholder" />
            </NSpin>
          ),
        }}
      />
    )

    return () => {
      const currentDetail = detail.value

      if (!workOrderId.value) {
        return (
          <NResult
            status="418"
            title={$t('common.error.pageLoad')}
            description={$t('common.error.pageLoadMeta')}
            v-slots={{
              footer: () => (
                <NButton onClick={() => router.back()}>{$t('common.action.back')}</NButton>
              ),
            }}
          />
        )
      }

      return (
        <NSpin show={detailQuery.value.isLoading.value}>
          {currentDetail ? (
            <NSpace class="work-order-detail-page" vertical size={24}>
              <NSpace vertical size={8}>
                <NSpace align="center" size={12}>
                  <h2 class="m-0">{currentDetail.title}</h2>
                  <WorkOrderStatusBadge status={currentDetail.status} />
                  {canCancel.value && (
                    <NPopconfirm
                      onPositiveClick={handleCancel}
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
                  <NText depth={3}>{currentDetail.categoryName}</NText>
                  <NText depth={3}>{formatted(currentDetail.createdTime).standard}</NText>
                  {currentDetail.completedAt && (
                    <NText depth={3}>
                      {$t('domain.workOrder.label.completedAt')}:{' '}
                      {formatted(currentDetail.completedAt).standard}
                    </NText>
                  )}
                </NSpace>
                <NSpace size={16}>
                  <NText depth={3}>
                    {$t('domain.workOrder.label.initiator')}: {initiatorName.value}
                  </NText>
                  {claimerName.value && (
                    <NText depth={3}>
                      {$t('domain.workOrder.label.claimer')}: {claimerName.value}
                    </NText>
                  )}
                </NSpace>
              </NSpace>

              <NSpace size={8}>
                {canClaim.value && (
                  <NPopconfirm
                    onPositiveClick={handleClaim}
                    v-slots={{
                      trigger: () => (
                        <NButton
                          size="small"
                          type="primary"
                          loading={claimMutation.isPending.value}
                        >
                          {$t('domain.workOrder.action.claim')}
                        </NButton>
                      ),
                      default: () => $t('domain.workOrder.message.claimConfirm'),
                    }}
                  />
                )}

                {canRelease.value && (
                  <NPopconfirm
                    onPositiveClick={handleRelease}
                    v-slots={{
                      trigger: () => (
                        <NButton size="small" loading={releaseMutation.isPending.value}>
                          {$t('domain.workOrder.action.release')}
                        </NButton>
                      ),
                      default: () => $t('domain.workOrder.message.releaseConfirm'),
                    }}
                  />
                )}

                {canComplete.value && (
                  <NPopconfirm
                    onPositiveClick={handleComplete}
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

                {canReopen.value && (
                  <NPopconfirm
                    onPositiveClick={handleReopen}
                    v-slots={{
                      trigger: () => (
                        <NButton size="small">{$t('domain.workOrder.action.reopen')}</NButton>
                      ),
                      default: () => $t('domain.workOrder.message.reopenConfirm'),
                    }}
                  />
                )}

                {canReject.value && (
                  <NPopconfirm
                    onPositiveClick={handleReject}
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
                            v-model:value={rejectRemark.value}
                            size="small"
                            placeholder={$t('domain.workOrder.label.rejectRemark')}
                          />
                        </NSpace>
                      ),
                    }}
                  />
                )}
              </NSpace>

              <NCard bordered={false}>{renderMarkdownPreview(currentDetail.content)}</NCard>

              <NDivider />

              {canScore.value && (
                <WorkOrderScoreSection
                  workOrderId={workOrderId.value}
                  currentScore={currentDetail.score}
                />
              )}

              <NSpace vertical size={16}>
                <h3 class="m-0">
                  {$t('domain.workOrder.action.reply')} ({replies.value.length})
                </h3>

                {replies.value.length === 0 && (
                  <NText depth={3}>{$t('domain.workOrder.message.noReplies')}</NText>
                )}

                {replies.value.map((reply) => (
                  <NCard
                    key={reply.id}
                    bordered={true}
                    size="small"
                    style={{
                      borderLeft:
                        reply.userType === WorkOrderUserType.HANDLER
                          ? '0.25rem solid var(--n-color-target)'
                          : '0.25rem solid var(--n-border-color)',
                    }}
                    v-slots={{
                      header: () => (
                        <NSpace align="center" size={8}>
                          <NText strong>{replyAuthorName(reply)}</NText>
                          <NText depth={3} class="text-[0.75rem]">
                            {reply.userType === WorkOrderUserType.HANDLER
                              ? $t('domain.workOrder.label.handlerReply')
                              : $t('domain.workOrder.label.userReply')}
                          </NText>
                          <NText depth={3} class="text-[0.75rem]">
                            {formatted(reply.createdTime).standard}
                          </NText>
                        </NSpace>
                      ),
                      default: () => renderMarkdownPreview(reply.content),
                    }}
                  />
                ))}
              </NSpace>

              {canReply.value && (
                <NCard bordered={false}>
                  <NSpace vertical size={12}>
                    {renderReplyEditor()}
                  </NSpace>
                </NCard>
              )}

              <NSpace justify="end">
                <NButton onClick={() => router.back()}>{$t('common.action.back')}</NButton>
                {canReply.value && (
                  <NButton
                    type="primary"
                    disabled={!replyContent.value.trim()}
                    loading={
                      userAddReply.isPending.value || handlerAddReplyMutation.isPending.value
                    }
                    onClick={handleReply}
                  >
                    {$t('domain.workOrder.action.reply')}
                  </NButton>
                )}
              </NSpace>
            </NSpace>
          ) : null}
        </NSpin>
      )
    }
  },
})
