import { defineComponent, Transition, type DefineComponent } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import clsx from 'clsx'
import MyLogo from '@/assets/logo.svg?component'
import { NIcon } from 'naive-ui'
export default defineComponent({
  name: 'unauth-layout-view',
  setup() {
    const route = useRoute()
    return () => (
      <>
        {/*
         * 未登录布局
         * 高度撑满屏幕: h-full, flex-1
         * 水平垂直居中: flex, justify-center, items-center
         */}
        <div class="h-full flex-1 flex flex-col justify-center items-center">
          <NIcon size={150} class={clsx('items-center')}>
            <MyLogo></MyLogo>
          </NIcon>
          <n-scrollbar class={clsx('flex-1', 'min-h-0')}>
            <RouterView
              v-slots={{
                default: ({ Component }: { Component: DefineComponent }) => (
                  <Transition
                    mode="out-in"
                    // 进场过程：持续 300ms，缓出曲线
                    enterActiveClass="transition-all duration-300 ease-out"
                    // 进场开始状态：透明度为0
                    enterFromClass="opacity-0"
                    // 进场结束状态：透明度100
                    enterToClass="opacity-100"
                    // 离场过程：持续 200ms，缓入曲线
                    leaveActiveClass="transition-all duration-200 ease-in"
                    // 离场开始状态：透明度100
                    leaveFromClass="opacity-100"
                  >
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
                        key={route.path}
                      />
                    )}
                  </Transition>
                ),
              }}
            />
          </n-scrollbar>
        </div>
      </>
    )
  },
})
