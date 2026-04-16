import { computed, onBeforeUnmount, onMounted, ref, type ComputedRef } from 'vue'

export type ViewportMode = 'desktop' | 'compact-desktop' | 'mobile'

export const resolveViewportMode = (width: number): ViewportMode => {
  if (width < 768) return 'mobile'
  if (width < 1200) return 'compact-desktop'
  return 'desktop'
}

export function useViewportMode(): ComputedRef<ViewportMode> {
  const viewportWidth = ref(window.innerWidth)

  const syncViewportWidth = () => {
    viewportWidth.value = window.innerWidth
  }

  onMounted(() => {
    syncViewportWidth()
    window.addEventListener('resize', syncViewportWidth)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('resize', syncViewportWidth)
  })

  return computed(() => resolveViewportMode(viewportWidth.value))
}
