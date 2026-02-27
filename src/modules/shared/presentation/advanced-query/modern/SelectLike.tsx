import { NSelect, type SelectOption } from 'naive-ui'
import { defineComponent, type PropType } from 'vue'

type SelectLikeValue = string | number | Array<string | number> | null | undefined
type SelectLikeSize = 'tiny' | 'small' | 'medium' | 'large'
type SelectLikeMaxTagCount = number | 'responsive'

export type SelectLikeOption = {
  label: string
  value: string | number
  disabled?: boolean
}

export default defineComponent({
  name: 'AdvancedQuerySelectLike',
  props: {
    value: {
      type: [String, Number, Array] as PropType<SelectLikeValue>,
      required: false,
      default: undefined,
    },
    options: {
      type: Array as PropType<SelectLikeOption[]>,
      required: true,
    },
    multiple: {
      type: Boolean,
      required: false,
      default: false,
    },
    clearable: {
      type: Boolean,
      required: false,
      default: false,
    },
    filterable: {
      type: Boolean,
      required: false,
      default: false,
    },
    maxTagCount: {
      type: [Number, String] as PropType<SelectLikeMaxTagCount>,
      required: false,
      default: undefined,
    },
    size: {
      type: String as PropType<SelectLikeSize>,
      required: false,
      default: 'small',
    },
    onUpdateValue: {
      type: Function as PropType<(value: SelectLikeValue) => void>,
      required: false,
      default: undefined,
    },
  },
  setup(props) {
    return () => (
      <NSelect
        value={props.value}
        options={props.options as SelectOption[]}
        multiple={props.multiple}
        clearable={props.clearable}
        filterable={props.filterable}
        maxTagCount={props.maxTagCount}
        size={props.size}
        to={false}
        class="w-full min-w-0"
        onUpdateValue={(value) => {
          props.onUpdateValue?.(value as SelectLikeValue)
        }}
      />
    )
  },
})
