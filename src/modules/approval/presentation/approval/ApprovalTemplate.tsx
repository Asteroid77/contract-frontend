import type { ApprovalProcessName } from '@/modules/approval/application/models'
import { NButton, NCheckbox, NFlex, NResult, NSkeleton } from 'naive-ui'
import { computed, defineComponent, ref, type PropType } from 'vue'
import TemplateActions from './TemplateActions'
import { $t } from '@/_utils/i18n'
import DiffCheckScope from '@/modules/shared/presentation/diff-check/DiffCheckScope'
import ApprovalBaseInfoDiffCheck from '@/modules/approval/presentation/approval/diff-check/ApprovalBaseInfoDiffCheck'
import ApprovalContentDiffCheck from '@/modules/approval/presentation/approval/diff-check/ApprovalContentDiffCheck'
import ApprovalHistoryDiffCheck from '@/modules/approval/presentation/approval/diff-check/ApprovalHistoryDiffCheck'
import ApprovalPrintDiffCheck from '@/modules/approval/presentation/approval/diff-check/ApprovalPrintDiffCheck'
import {
  useApprovalHistoryQuery,
  useApprovalInstanceDetail,
} from '@/modules/approval/application/hooks/useApprovalService'
import { useRouter } from 'vue-router'

export default defineComponent({
  name: 'ApprovalTemplate',
  props: {
    instanceId: {
      type: Number,
      required: true,
    },
    template: {
      type: String as PropType<ApprovalProcessName[keyof ApprovalProcessName]>,
      required: true,
    },
  },
  setup(props) {
    const router = useRouter()
    const detail = useApprovalInstanceDetail(computed(() => props.instanceId))
    const showOnlyChanged = ref(false)
    const isDiffMode = computed(() => !!detail.data.value?.sourceData)
    const contentTitle = computed(() => {
      if (!detail.data.value) return ''
      return detail.data.value.sourceData
        ? `：${$t('common.action.modify')}`
        : `：${$t('common.action.add')}`
    })

    const { data: historyData } = useApprovalHistoryQuery(computed(() => props.instanceId))
    const historyList = computed(() => {
      if (!historyData.value) return []
      const result = [...historyData.value]
      if (result.length) {
        // 处理第一条和撤回逻辑（沿用项目A现有规则）
        result[result.length - 1].nodeName = $t('domain.approval.history.submit')
        if (result[0].action === 'cancel') {
          result[0].nodeName = $t('domain.approval.history.withdraw')
        }
      }
      return result
    })
    return () => (
      <div>
        {/* loading */}
        {(detail.isLoading.value || detail.data.value === undefined) && (
          <NFlex>
            <NSkeleton height={'2.5rem'} width={'90%'}></NSkeleton>
            <NSkeleton height={'6.875rem'} width={'90%'}></NSkeleton>
            <NSkeleton height={'2.5rem'} width={'90%'}></NSkeleton>
            <NSkeleton height={'37.5rem'} width={'90%'}></NSkeleton>
            <NSkeleton height={'2.5rem'} width={'90%'}></NSkeleton>
            <NSkeleton height={'15rem'} width={'90%'}></NSkeleton>
            <NSkeleton height={'2.5rem'} width={'90%'}></NSkeleton>
            <NSkeleton height={'2.5rem'} width={'90%'}></NSkeleton>
          </NFlex>
        )}
        {/* loading failure result*/}
        {!detail.isLoading.value && detail.data.value === undefined && (
          <NResult
            status="500"
            title={$t('common.error.pageLoad')}
            description={$t('common.error.server')}
            v-slots={{
              footer: () => (
                <NButton
                  onClick={() => {
                    router.go(-1)
                  }}
                >
                  {$t('common.action.back')}
                </NButton>
              ),
            }}
          ></NResult>
        )}
        {detail.data.value !== undefined && (
          <>
            {/* 屏幕展示：完全使用 diff-check 的 UI 风格 */}
            <DiffCheckScope>
              <div class="mx-auto w-full max-w-[var(--layout-content-max-width)] px-[var(--spacing-md)] py-[var(--spacing-lg)]">
                <div class="theme-card mb-[var(--spacing-md)]">
                  <div class="flex items-start justify-between gap-[var(--spacing-md)] flex-wrap">
                    <div>
                      <div class="text-[1.25rem] font-bold text-[var(--color-text-main)]">
                        {$t('common.action.view')}：{detail.data.value.processName}
                      </div>
                      <div class="text-[0.875rem] text-[var(--color-text-light)] mt-[var(--spacing-xs)]">
                        {$t('domain.approval.section.content')}
                        {contentTitle.value}
                      </div>
                    </div>

                    {isDiffMode.value && (
                      <NCheckbox
                        checked={showOnlyChanged.value}
                        onUpdateChecked={(v) => (showOnlyChanged.value = v)}
                      >
                        {$t('common.diffCheck.action.showOnlyChanged')}
                      </NCheckbox>
                    )}
                  </div>
                </div>

                <div class="theme-card mb-[var(--spacing-md)]">
                  <div class="font-semibold mb-[var(--spacing-sm)] text-[var(--color-text-main)]">
                    {$t('domain.approval.section.baseInfo')}
                  </div>
                  <ApprovalBaseInfoDiffCheck data={detail.data.value} />
                </div>

                <div class="theme-card mb-[var(--spacing-md)]">
                  <div class="font-semibold mb-[var(--spacing-sm)] text-[var(--color-text-main)]">
                    {$t('domain.approval.section.content')}
                    {contentTitle.value}
                  </div>
                  <ApprovalContentDiffCheck
                    data={detail.data.value}
                    showOnlyChanged={showOnlyChanged.value}
                  />
                </div>

                <div class="theme-card mb-[var(--spacing-md)]">
                  <div class="font-semibold mb-[var(--spacing-sm)] text-[var(--color-text-main)]">
                    {$t('domain.approval.section.history')}
                  </div>
                  <ApprovalHistoryDiffCheck list={historyList.value} />
                </div>

                <div class="theme-card">
                  <div class="font-semibold mb-[var(--spacing-sm)] text-[var(--color-text-main)]">
                    {$t('common.action.operate')}
                  </div>
                  <TemplateActions data={detail.data.value} />
                </div>
              </div>
            </DiffCheckScope>

            {/* 打印专用 DOM：与屏幕 DOM 解耦，避免样式杂交 */}
            <div class="hidden">
              <div id={'printable-approval-area'}>
                <ApprovalPrintDiffCheck data={detail.data.value} historyList={historyList.value} />
              </div>
            </div>
          </>
        )}
      </div>
    )
  },
})
