import { ref, watch, toValue, type Ref, computed } from 'vue'
import { cloneDeep } from 'lodash'

/**
 * 创建一个 prop 数据的可编辑、响应式副本。
 *
 * @param source - 一个 ref，通常是 props.initialValue 的 ref 形式。
 * @returns - { formValue }
 */
export function useSubscribeForm<T extends object>(
  source: Ref<T | undefined>,
  isReadOnly?: boolean,
) {
  // 1. 本地可编辑的表单数据
  const emptyValue = () => cloneDeep(toValue(source.value ?? ({} as T)))
  const formValue = isReadOnly ? computed<T>(() => source.value ?? ({} as T)) : ref<T>(emptyValue())

  // 2. 监听外部源数据的变化
  if (!isReadOnly) {
    watch(
      source,
      (newSourceValue) => {
        ;(formValue as Ref<T>).value = cloneDeep(toValue(newSourceValue ?? ({} as T)))
      },
      { immediate: true, deep: true },
    )
  }

  return {
    formValue,
  }
}
