import { onMounted, ref, type Ref } from 'vue'

// 当 parser 是 'int' 或 'float' 时，返回 Ref<number | null>
export function useCssVar(varName: string, parser: 'int' | 'float'): Ref<number | null>

// 当 parser 是 'string' 或未提供时，返回 Ref<string | null>
export function useCssVar(varName: string, parser?: 'string'): Ref<string | null>

// 实现
export function useCssVar(
  varName: string,
  parser: 'int' | 'float' | 'string' = 'string',
): Ref<string | null> | Ref<number | null> {
  // 根据 parser 类型，为 ref 提供初始类型
  const value = parser === 'string' ? ref<string | null>(null) : ref<number | null>(null)

  onMounted(() => {
    // 确保在 DOM 渲染后执行
    if (typeof window === 'undefined') return

    const root = document.documentElement
    const computedStyle = window.getComputedStyle(root)
    const rawValue = computedStyle.getPropertyValue(varName)?.trim()

    if (rawValue) {
      if (parser === 'int') {
        value.value = parseInt(rawValue, 10)
      } else if (parser === 'float') {
        value.value = parseFloat(rawValue)
      } else {
        value.value = rawValue
      }
    }
  })

  return value
}
