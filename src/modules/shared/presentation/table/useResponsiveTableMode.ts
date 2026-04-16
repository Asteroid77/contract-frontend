import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref,
  shallowRef,
  watch,
  type ComputedRef,
  type ShallowRef,
} from 'vue'

export type ResponsiveTableMode = 'wide' | 'compact' | 'stacked'

type ResponsiveTableModeOptions = {
  wideMin?: number
  compactMin?: number
}

const DEFAULT_WIDE_MIN = 56 * 16
const DEFAULT_COMPACT_MIN = 40 * 16

export const resolveResponsiveTableMode = (
  width: number,
  options: ResponsiveTableModeOptions = {},
): ResponsiveTableMode => {
  const wideMin = options.wideMin ?? DEFAULT_WIDE_MIN
  const compactMin = options.compactMin ?? DEFAULT_COMPACT_MIN

  if (width >= wideMin) return 'wide'
  if (width >= compactMin) return 'compact'
  return 'stacked'
}

export function useResponsiveTableMode(options: ResponsiveTableModeOptions = {}): {
  containerRef: ShallowRef<HTMLElement | null>
  mode: ComputedRef<ResponsiveTableMode>
} {
  const containerRef = shallowRef<HTMLElement | null>(null)
  const containerWidth = ref(options.wideMin ?? DEFAULT_WIDE_MIN)
  let observer: ResizeObserver | null = null

  const observeElement = (element: HTMLElement | null) => {
    if (!observer || !element) return
    observer.observe(element)
  }

  const unobserveElement = (element: HTMLElement | null) => {
    if (!observer || !element) return
    observer.unobserve(element)
  }

  onMounted(() => {
    if (typeof ResizeObserver === 'undefined') return

    observer = new ResizeObserver((entries) => {
      const nextWidth = entries[0]?.contentRect.width
      if (typeof nextWidth === 'number') {
        containerWidth.value = nextWidth
      }
    })

    observeElement(containerRef.value)
  })

  watch(containerRef, (element, previous) => {
    unobserveElement(previous)
    observeElement(element)
  })

  onBeforeUnmount(() => {
    observer?.disconnect()
  })

  return {
    containerRef,
    mode: computed(() => resolveResponsiveTableMode(containerWidth.value, options)),
  }
}
