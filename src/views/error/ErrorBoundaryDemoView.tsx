/**
 * ErrorBoundary 演示页面
 * 展示不同类型的错误场景
 */
import { defineComponent, ref } from 'vue'
import { NButton, NCard, NSpace, NAlert, NDivider } from 'naive-ui'

// 故意抛出错误的子组件
const BrokenComponent = defineComponent({
  name: 'BrokenComponent',
  setup() {
    // 在渲染时抛出错误
    throw new Error('这是一个故意抛出的渲染错误！')
  },
  render() {
    return <div>这段内容永远不会显示</div>
  },
})

// 在生命周期中抛出错误的组件
const LifecycleErrorComponent = defineComponent({
  name: 'LifecycleErrorComponent',
  mounted() {
    throw new Error('这是一个在 mounted 生命周期中抛出的错误！')
  },
  render() {
    return <div>组件已挂载</div>
  },
})

// 在事件处理中抛出错误的组件
const EventErrorComponent = defineComponent({
  name: 'EventErrorComponent',
  setup() {
    const handleClick = () => {
      throw new Error('这是一个在点击事件中抛出的错误！')
    }

    return () => (
      <NButton type="error" onClick={handleClick}>
        点击触发事件错误
      </NButton>
    )
  },
})

// 异步错误组件
const AsyncErrorComponent = defineComponent({
  name: 'AsyncErrorComponent',
  setup() {
    const handleAsyncError = async () => {
      await new Promise((resolve) => setTimeout(resolve, 500))
      throw new Error('这是一个异步操作中抛出的错误！')
    }

    return () => (
      <NButton type="warning" onClick={handleAsyncError}>
        点击触发异步错误
      </NButton>
    )
  },
})

export default defineComponent({
  name: 'ErrorBoundaryDemoView',
  setup() {
    const showRenderError = ref(false)
    const showLifecycleError = ref(false)

    const triggerRenderError = () => {
      showRenderError.value = true
    }

    const triggerLifecycleError = () => {
      showLifecycleError.value = true
    }

    const resetErrors = () => {
      showRenderError.value = false
      showLifecycleError.value = false
    }

    return () => (
      <div class="p-6 max-w-4xl mx-auto">
        <NCard title="ErrorBoundary 演示页面" class="mb-6">
          <NAlert type="info" class="mb-4">
            这个页面用于演示 ErrorBoundary 组件如何捕获和显示不同类型的错误。
            每个错误场景都被独立的 ErrorBoundary 包裹，互不影响。
          </NAlert>

          <NSpace vertical size="large">
            {/* 场景 1: 渲染错误 */}
            <div>
              <h3 class="text-lg font-semibold mb-2">场景 1: 渲染时错误</h3>
              <p class="text-sm text-gray-600 mb-3">
                组件在渲染过程中抛出错误，ErrorBoundary 会捕获并显示降级 UI
              </p>
              <NSpace>
                <NButton type="primary" onClick={triggerRenderError}>
                  触发渲染错误
                </NButton>
                <NButton onClick={resetErrors}>重置所有错误</NButton>
              </NSpace>
              <NDivider />
              <div class="border border-gray-200 rounded p-4 min-h-[200px]">
                {showRenderError.value ? <BrokenComponent /> : <p>正常内容显示中...</p>}
              </div>
            </div>

            {/* 场景 2: 生命周期错误 */}
            <div>
              <h3 class="text-lg font-semibold mb-2">场景 2: 生命周期错误</h3>
              <p class="text-sm text-gray-600 mb-3">
                组件在 mounted 生命周期钩子中抛出错误
              </p>
              <NButton type="primary" onClick={triggerLifecycleError}>
                触发生命周期错误
              </NButton>
              <NDivider />
              <div class="border border-gray-200 rounded p-4 min-h-[200px]">
                {showLifecycleError.value ? (
                  <LifecycleErrorComponent />
                ) : (
                  <p>正常内容显示中...</p>
                )}
              </div>
            </div>

            {/* 场景 3: 事件处理错误 */}
            <div>
              <h3 class="text-lg font-semibold mb-2">场景 3: 事件处理错误</h3>
              <p class="text-sm text-gray-600 mb-3">
                ⚠️ 注意：事件处理器中的错误不会被 ErrorBoundary 捕获（这是 Vue 的设计）
              </p>
              <NDivider />
              <div class="border border-gray-200 rounded p-4">
                <EventErrorComponent />
                <p class="text-xs text-gray-500 mt-2">
                  点击按钮会在控制台看到错误，但不会触发 ErrorBoundary
                </p>
              </div>
            </div>

            {/* 场景 4: 异步错误 */}
            <div>
              <h3 class="text-lg font-semibold mb-2">场景 4: 异步错误</h3>
              <p class="text-sm text-gray-600 mb-3">
                ⚠️ 注意：异步操作中的错误也不会被 ErrorBoundary 捕获
              </p>
              <NDivider />
              <div class="border border-gray-200 rounded p-4">
                <AsyncErrorComponent />
                <p class="text-xs text-gray-500 mt-2">
                  异步错误需要使用 try-catch 或全局错误处理
                </p>
              </div>
            </div>
          </NSpace>
        </NCard>

        <NCard title="ErrorBoundary 使用说明" class="mt-6">
          <div class="space-y-4 text-sm">
            <div>
              <h4 class="font-semibold mb-2">✅ ErrorBoundary 可以捕获：</h4>
              <ul class="list-disc list-inside space-y-1 text-gray-700">
                <li>组件渲染过程中的错误</li>
                <li>生命周期钩子中的错误（setup, mounted, updated 等）</li>
                <li>子组件树中的错误</li>
              </ul>
            </div>

            <div>
              <h4 class="font-semibold mb-2">❌ ErrorBoundary 无法捕获：</h4>
              <ul class="list-disc list-inside space-y-1 text-gray-700">
                <li>事件处理器中的错误（需要使用 try-catch）</li>
                <li>异步代码中的错误（setTimeout, Promise 等）</li>
                <li>服务端渲染 (SSR) 的错误</li>
                <li>ErrorBoundary 组件自身的错误</li>
              </ul>
            </div>

            <div>
              <h4 class="font-semibold mb-2">💡 最佳实践：</h4>
              <ul class="list-disc list-inside space-y-1 text-gray-700">
                <li>在应用的顶层使用 ErrorBoundary 作为全局错误捕获</li>
                <li>在关键功能模块使用 ErrorBoundary 实现局部降级</li>
                <li>为 ErrorBoundary 提供有意义的 errorTitle 和 errorDescription</li>
                <li>使用 fallback 插槽自定义错误 UI</li>
                <li>监听 @error 事件进行错误上报</li>
              </ul>
            </div>
          </div>
        </NCard>
      </div>
    )
  },
})
