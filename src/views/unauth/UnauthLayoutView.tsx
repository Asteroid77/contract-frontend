import { defineComponent, Transition } from 'vue'
import { RouterView } from 'vue-router'
import ErrorBoundary from '@/app/observability/components/ErrorBoundary'

export default defineComponent({
  name: 'unauth-layout-view-vdts',
  setup() {
    return () => (
      <div class="min-h-screen bg-[var(--color-bg-body)] flex items-center justify-center p-4 md:p-8">
        <div class="w-full max-w-[30rem]">
          <ErrorBoundary>
            <RouterView
              v-slots={{
                default: ({ Component }: { Component: any }) =>
                  Component && (
                    <Transition name="page" mode="out-in">
                      <Component />
                    </Transition>
                  ),
              }}
            />
          </ErrorBoundary>
        </div>
      </div>
    )
  },
})
