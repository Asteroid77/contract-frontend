import { NSelect, NButton, selectProps, type SelectOption } from 'naive-ui'
import { computed, defineComponent, ref, type VNode } from 'vue'
import { useI18n } from 'vue-i18n'

export default defineComponent({
  name: 'CrudSelect',
  props: {
    ...selectProps,
    showAdd: { type: Boolean, default: false },
    showEdit: { type: Boolean, default: false },
    showDelete: { type: Boolean, default: false },
    showSearch: { type: Boolean, default: false },
  },
  emits: ['update:value', 'add', 'edit', 'delete'],
  setup(props, { emit, attrs, slots }) {
    const { t: $t } = useI18n()
    const hoveredOption = ref<string | number | null>(null)

    const handleAdd = (e: MouseEvent) => {
      e.stopPropagation()
      emit('add')
    }

    const handleEdit = (e: MouseEvent, value: string | number) => {
      e.stopPropagation()
      emit('edit', value)
    }

    const handleDelete = (e: MouseEvent, value: string | number) => {
      e.stopPropagation()
      emit('delete', value)
    }

    const hasInlineActions = computed(() => props.showEdit || props.showDelete)

    const renderOptionWithActions = ({
      node,
      option,
    }: {
      node: VNode
      option: SelectOption
      selected: boolean
    }) => {
      if (option.type === 'group' || option.disabled) return node

      const optionValue = option.value as string | number
      const isHovered = hoveredOption.value === optionValue

      return (
        <div
          style="display: flex; align-items: center; width: 100%"
          onMouseenter={() => {
            hoveredOption.value = optionValue
          }}
          onMouseleave={() => {
            hoveredOption.value = null
          }}
        >
          <div style="flex: 1; min-width: 0">{node}</div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '2px',
              flexShrink: 0,
              marginLeft: '8px',
              visibility: isHovered ? 'visible' : 'hidden',
            }}
          >
            {props.showEdit && (
              <NButton
                quaternary
                circle
                size="tiny"
                onClick={(e: MouseEvent) => handleEdit(e, optionValue)}
              >
                {{ icon: () => <span style="font-size: 12px">✎</span> }}
              </NButton>
            )}
            {props.showDelete && (
              <NButton
                quaternary
                circle
                size="tiny"
                onClick={(e: MouseEvent) => handleDelete(e, optionValue)}
              >
                {{ icon: () => <span style="font-size: 12px">✕</span> }}
              </NButton>
            )}
          </div>
        </div>
      )
    }

    return () => {
      const selectSlots: Record<string, unknown> = { ...slots }

      if (props.showAdd) {
        selectSlots.action = () => (
          <NButton quaternary block size="small" onClick={handleAdd} style="margin: 4px 0">
            {{ default: () => `+ ${$t('common.action.add')}` }}
          </NButton>
        )
      }

      return (
        <NSelect
          {...props}
          {...attrs}
          v-slots={selectSlots}
          filterable={props.showSearch || props.filterable}
          renderOption={hasInlineActions.value ? renderOptionWithActions : undefined}
          onUpdate:value={(val: string | number | Array<string | number> | null) =>
            emit('update:value', val)
          }
        />
      )
    }
  },
})
