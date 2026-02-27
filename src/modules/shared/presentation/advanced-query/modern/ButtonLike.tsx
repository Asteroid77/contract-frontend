import { NButton } from 'naive-ui'
import { defineComponent, type PropType } from 'vue'

type ButtonLikeSize = 'tiny' | 'small' | 'medium' | 'large'
type ButtonLikeType = 'default' | 'tertiary' | 'primary' | 'info' | 'success' | 'warning' | 'error'

export default defineComponent({
  name: 'AdvancedQueryButtonLike',
  props: {
    size: {
      type: String as PropType<ButtonLikeSize>,
      required: false,
      default: 'tiny',
    },
    type: {
      type: String as PropType<ButtonLikeType>,
      required: false,
      default: undefined,
    },
    loading: {
      type: Boolean,
      required: false,
      default: false,
    },
    disabled: {
      type: Boolean,
      required: false,
      default: false,
    },
    secondary: {
      type: Boolean,
      required: false,
      default: false,
    },
    onClick: {
      type: Function as PropType<() => void>,
      required: false,
      default: undefined,
    },
  },
  setup(props, { slots }) {
    return () => (
      <NButton
        size={props.size}
        type={props.type}
        loading={props.loading}
        disabled={props.disabled}
        secondary={props.secondary}
        onClick={props.onClick}
      >
        {slots.default?.()}
      </NButton>
    )
  },
})
