import { $t } from '@/_utils/i18n'
import { defineComponent, type PropType } from 'vue'
import ButtonLike from './modern/ButtonLike'

type ActionButtonSize = 'tiny' | 'small' | 'medium' | 'large'

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
      <div class="inline-flex items-center gap-2 pl-[var(--spacing-sm)]">
        <ButtonLike
          size={props.size}
          type="primary"
          loading={props.searchLoading}
          onClick={() => emit('search')}
        >
          {$t('common.action.search')}
        </ButtonLike>
        <ButtonLike size={props.size} secondary onClick={() => emit('reset')}>
          {$t('common.action.reset')}
        </ButtonLike>
      </div>
    )
  },
})
