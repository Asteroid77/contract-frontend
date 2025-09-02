import { defineComponent, Transition, type DefineComponent } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import clsx from 'clsx'

export default defineComponent({
  name: 'unauth-layout-view',
  setup() {
    const route = useRoute()
    return () => (
      <div class="h-full flex-1 overflow-auto bg-[url(@/assert/login-bg-image.jpg)]">
        <RouterView
          key={route.path}
          v-slots={{
            default: ({ Component }: { Component: DefineComponent }) => (
              <Transition name="fade" mode="out-in">
                {Component && (
                  <Component
                    class={clsx(
                      'h-full',
                      'w-full',
                      'sm:max-w-[30rem]',
                      'min-w-[22rem]',
                      'mx-auto',
                      'flex',
                      'justify-center',
                      'items-center',
                    )}
                  />
                )}
              </Transition>
            ),
          }}
        />
      </div>
    )
  },
})
