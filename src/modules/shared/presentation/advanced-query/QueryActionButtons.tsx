import { $t } from '@/_utils/i18n'
import { NButton, NSpace, type ButtonProps } from 'naive-ui'
import { defineComponent, type PropType } from 'vue'

type ActionButtonSize = NonNullable<ButtonProps['size']>

export default defineComponent({
  name: 'AdvancedQueryActionButtons',
  props: {
    size: {
      type: String as PropType<ActionButtonSize>,
      default: 'tiny',
    },
    searchLoading: {
      type: Boolean,
      default: false,
    },
  },
  emits: {
    search: () => true,
    reset: () => true,
  },
  setup(props, { emit }) {
    return () => (
      <NSpace>
        <NButton
          size={props.size}
          type="primary"
          loading={props.searchLoading}
          onClick={() => emit('search')}
        >
          {$t('common.action.search')}
        </NButton>
        <NButton size={props.size} onClick={() => emit('reset')}>
          {$t('common.action.reset')}
        </NButton>
      </NSpace>
    )
  },
})
