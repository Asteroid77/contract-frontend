import type { ApprovalProcessName } from '@/components/approval/api/approval'
import { NButton, NFlex, NResult, NSkeleton } from 'naive-ui'
import { computed, defineComponent, type PropType } from 'vue'
import TemplateActions from './TemplateActions'
import { $t } from '@/_utils/i18n'
import TemplateNode from './TemplateNode'
import TemplateRecord from './TemplateRecord.tsx'
import { templateSwitch } from './template/TemplateSwitch'
import { h } from 'vue'
import { useApprovalInstanceDetail } from '@/hooks/approval/useApprovalService'
import { useRouter } from 'vue-router'
import clsx from 'clsx'

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
    const contentTitle = detail.data.value
      ? detail.data.value.sourceData
        ? `：${$t('actions.modify')}`
        : `：${$t('actions.add')}`
      : ''
    return () => (
      <div>
        {/* loading */}
        {(detail.isLoading.value || detail.data.value === undefined) && (
          <NFlex>
            <NSkeleton height={'40px'} width={'90%'}></NSkeleton>
            <NSkeleton height={'110px'} width={'90%'}></NSkeleton>
            <NSkeleton height={'40px'} width={'90%'}></NSkeleton>
            <NSkeleton height={'600px'} width={'90%'}></NSkeleton>
            <NSkeleton height={'40px'} width={'90%'}></NSkeleton>
            <NSkeleton height={'240px'} width={'90%'}></NSkeleton>
            <NSkeleton height={'40px'} width={'90%'}></NSkeleton>
            <NSkeleton height={'40px'} width={'90%'}></NSkeleton>
          </NFlex>
        )}
        {/* loading failure result*/}
        {!detail.isLoading.value && detail.data.value === undefined && (
          <NResult
            status="500"
            title={$t('common.pageLoadError')}
            description={$t('common.pageLoad500Error')}
            v-slots={{
              footer: () => (
                <NButton
                  onClick={() => {
                    router.go(-1)
                  }}
                >
                  {$t('actions.return')}
                </NButton>
              ),
            }}
          ></NResult>
        )}
        {detail.data.value !== undefined && (
          <>
            <div class={'printable-approval-area'} id={'printable-approval-area'}>
              {/* current node information */}
              <div>
                <div class="section-title">{$t('approval.handleTask.collapse.base')}</div>
                {<TemplateNode data={detail.data.value}></TemplateNode>}
              </div>
              {/* content */}
              <div>
                <div class="section-title">{`${$t('approval.handleTask.collapse.content')}${contentTitle}`}</div>
                {h(templateSwitch, {
                  data: detail.data.value,
                  name: detail.data.value.processName,
                })}
              </div>
              {/* record */}
              <div>
                <div class="section-title">{$t('approval.handleTask.collapse.record')}</div>
                {<TemplateRecord data={detail.data.value}></TemplateRecord>}
              </div>
              {/* actions(approve,reject,transfer,cancel,print) */}
              {
                <div class={clsx('screen-only')}>
                  <div class="section-title">{$t('approval.handleTask.action')}</div>
                  {
                    <TemplateActions
                      class={clsx('mb-content')}
                      data={detail.data.value}
                    ></TemplateActions>
                  }
                </div>
              }
            </div>
          </>
        )}
      </div>
    )
  },
})
