import { defineComponent, type PropType, type VNodeChild } from 'vue'
import { NCard, NSpace, NText } from 'naive-ui'
import { useI18n } from 'vue-i18n'
import { WorkOrderUserType } from '../domain/enums'
import type { WorkOrderReplyVO } from '../domain/types'
import { formatted } from '@/modules/shared/presentation/time'

export default defineComponent({
  name: 'WorkOrderReplyList',
  props: {
    replies: {
      type: Array as PropType<WorkOrderReplyVO[]>,
      required: true,
    },
    replyAuthorName: {
      type: Function as PropType<(reply: WorkOrderReplyVO) => string>,
      required: true,
    },
    renderMarkdownPreview: {
      type: Function as PropType<(content: string) => VNodeChild>,
      required: true,
    },
  },
  setup(props) {
    const { t: $t } = useI18n()

    return () => (
      <NSpace vertical size={16}>
        <h3 class="m-0">
          {$t('domain.workOrder.action.reply')} ({props.replies.length})
        </h3>

        {props.replies.length === 0 && (
          <NText depth={3}>{$t('domain.workOrder.message.noReplies')}</NText>
        )}

        {props.replies.map((reply) => (
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
                  <NText strong>{props.replyAuthorName(reply)}</NText>
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
              default: () => props.renderMarkdownPreview(reply.content),
            }}
          />
        ))}
      </NSpace>
    )
  },
})
