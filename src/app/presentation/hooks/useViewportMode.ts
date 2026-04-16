import { computed, onBeforeUnmount, onMounted, ref, type ComputedRef } from 'vue'

export type ViewportMode = 'desktop' | 'compact-desktop' | 'mobile'

export const resolveViewportMode = (width: number): ViewportMode => {
  if (width < 768) return 'mobile'
  if (width < 1200) return 'compact-desktop'
  return 'desktop'
}

export function useViewportMode(): ComputedRef<ViewportMode> {
  const viewportWidth = ref(typeof window === 'undefined' ? 1200 : window.innerWidth)

  const syncViewportWidth = () => {
    if (typeof window === 'undefined') return
    viewportWidth.value = window.innerWidth
  }

  onMounted(() => {
    syncViewportWidth()
    if (typeof window === 'undefined') return
    window.addEventListener('resize', syncViewportWidth)
  })

  onBeforeUnmount(() => {
    if (typeof window === 'undefined') return
    window.removeEventListener('resize', syncViewportWidth)
  })

  return computed(() => resolveViewportMode(viewportWidth.value))
}
