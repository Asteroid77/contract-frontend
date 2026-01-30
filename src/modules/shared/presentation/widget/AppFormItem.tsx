import { defineComponent, cloneVNode, computed, type VNode } from 'vue'
import { NFormItem, formItemProps } from 'naive-ui'
import { $t } from '@/_utils/i18n'

export default defineComponent({
  name: 'AppFormItem',
  props: {
    ...formItemProps,
    // 允许在特殊情况下禁用自动 placeholder
    autoPlaceholder: {
      type: Boolean,
      default: true,
    },
  },
  setup(props, { slots }) {
    // 动态生成 placeholder
    const generatedPlaceholder = computed(() => {
      if (!props.autoPlaceholder || !props.label) {
        return undefined
      }
      const childNode = slots.default?.()?.[0]
      const componentName = (childNode?.type as { name: string })?.name
      const selectKeywords = ['select', 'picker', 'cascader', 'tree']
      if (componentName) {
        const isSelectLike = selectKeywords.some((keyword) =>
          componentName.toLocaleLowerCase().includes(keyword),
        )
        if (isSelectLike) {
          // 如果是选择类组件
          return $t('common.placeholder.select', { label: props.label })
        } else {
          return $t('common.placeholder.input', { label: props.label })
        }
      }
      return undefined
    })

    return () => {
      // 获取默认插槽的内容
      const defaultSlot = slots.default?.()
      if (!defaultSlot || defaultSlot.length === 0) {
        return <NFormItem {...props} v-slots={slots} />
      }

      // 只处理第一个子节点
      const childVNode: VNode = defaultSlot[0]
      let finalChildVNode = childVNode
      // 如果需要生成 placeholder 并且子组件还没有自己的 placeholder
      if (generatedPlaceholder.value && !childVNode.props?.placeholder) {
        // clone子节点的 VNode，注入生成的 placeholder
        finalChildVNode = cloneVNode(childVNode, {
          placeholder: generatedPlaceholder.value,
        })
      }

      return <NFormItem {...props} v-slots={{ ...slots, default: () => finalChildVNode }} />
    }
  },
})
