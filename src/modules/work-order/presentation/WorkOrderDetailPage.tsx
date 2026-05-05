import { computed, defineAsyncComponent, defineComponent, h, ref, Suspense } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { NSpace, NButton, NDivider, NCard, NResult, NSpin } from 'naive-ui'
import { message } from '@/_utils/discrete_naive_api'
import { useI18n } from 'vue-i18n'
import { useAccountStore } from '@/modules/user/application/stores/useAccountStore'
import {
  useAddReply,
  useCancelWorkOrder,
  useCompleteWorkOrder,
  useRejectHandler,
  useReopenWorkOrder,
  useHandlerAddReply,
  useClaimWorkOrder,
  useReleaseWorkOrder,
  useHandlerComplete,
} from '../application/hooks/useWorkOrderService'
import { useWorkOrderDetailState } from '../application/hooks/useWorkOrderDetailState'
import { useWorkOrderUpload } from '../application/hooks/useWorkOrderUpload'
import WorkOrderDetailActions from './WorkOrderDetailActions'
import WorkOrderDetailHeader from './WorkOrderDetailHeader'
import WorkOrderReplyEditor from './WorkOrderReplyEditor'
import WorkOrderReplyList from './WorkOrderReplyList'
import WorkOrderScoreSection from './WorkOrderScoreSection'
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

    const {
      detailQuery,
      detail,
      replies,
      canReplyAsHandler,
      canReply,
      canCancel,
      canComplete,
      canReopen,
      canReject,
      canClaim,
      canRelease,
      canScore,
      initiatorName,
      claimerName,
      replyAuthorName,
    } = useWorkOrderDetailState({
      workOrderId,
      isHandler,
      currentUserId,
      currentUserDisplayName,
      isOwner: accountStore.isOwner,
    })

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
              <WorkOrderDetailHeader
                detail={currentDetail}
                initiatorName={initiatorName.value}
                claimerName={claimerName.value}
                canCancel={canCancel.value}
                onCancel={handleCancel}
              />

              <WorkOrderDetailActions
                canClaim={canClaim.value}
                canRelease={canRelease.value}
                canComplete={canComplete.value}
                canReopen={canReopen.value}
                canReject={canReject.value}
                claimLoading={claimMutation.isPending.value}
                releaseLoading={releaseMutation.isPending.value}
                rejectRemark={rejectRemark.value}
                onUpdate:rejectRemark={(value: string) => {
                  rejectRemark.value = value
                }}
                onClaim={handleClaim}
                onRelease={handleRelease}
                onComplete={handleComplete}
                onReopen={handleReopen}
                onReject={handleReject}
              />

              <NCard bordered={false}>{renderMarkdownPreview(currentDetail.content)}</NCard>

              <NDivider />

              {canScore.value && (
                <WorkOrderScoreSection
                  workOrderId={workOrderId.value}
                  currentScore={currentDetail.score}
                />
              )}

              <WorkOrderReplyList
                replies={replies.value}
                replyAuthorName={replyAuthorName}
                renderMarkdownPreview={renderMarkdownPreview}
              />

              {canReply.value && (
                <WorkOrderReplyEditor
                  editorComponent={AsyncMdEditor}
                  modelValue={replyContent.value}
                  onUpdate:modelValue={(value: string) => {
                    replyContent.value = value
                  }}
                  onUploadImg={onUploadImg}
                />
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
