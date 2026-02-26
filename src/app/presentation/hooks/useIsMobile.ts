import { onBeforeUnmount, onMounted, ref, type Ref } from 'vue'

export function useIsMobile(breakpoint = 768): Ref<boolean> {
  const isMobile = ref(false)

  const syncViewportMode = () => {
    if (typeof window === 'undefined') return
    isMobile.value = window.innerWidth < breakpoint
  }

  onMounted(() => {
    syncViewportMode()
    if (typeof window === 'undefined') return
    window.addEventListener('resize', syncViewportMode)
  })

  onBeforeUnmount(() => {
    if (typeof window === 'undefined') return
    window.removeEventListener('resize', syncViewportMode)
  })

  return isMobile
}
