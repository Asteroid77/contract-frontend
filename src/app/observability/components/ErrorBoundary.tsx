/**
 * 错误边界组件
 * 使用 errorCaptured 钩子捕获子组件错误并显示降级 UI
 */
import { defineComponent, ref, onErrorCaptured } from 'vue'
import { captureVueError } from '@/app/observability/collectors/error-collector'
import { $t } from '@/_utils/i18n'
import './ErrorBoundary.css'

export default defineComponent({
  name: 'ErrorBoundary',
  props: {
    /** 是否停止错误传播 */
    stopPropagation: {
      type: Boolean,
      default: true,
    },
    /** 自定义错误标题 */
    errorTitle: {
      type: String,
      default: undefined,
    },
    /** 自定义错误描述 */
    errorDescription: {
      type: String,
      default: undefined,
    },
  },
  emits: {
    error: (_error: Error, _info: string) => true,
    reset: () => true,
  },
  setup(props, { emit, slots }) {
    const hasError = ref(false)
    const errorMessage = ref('')
    const errorInfo = ref('')

    onErrorCaptured((err: Error, instance, info: string) => {
      hasError.value = true
      errorMessage.value = err.message
      errorInfo.value = info

      // 记录到可观测性系统
      captureVueError(err, instance, info)

      // 触发事件
      emit('error', err, info)

      // 返回 false 阻止错误继续传播
      return !props.stopPropagation
    })

    const handleReset = (): void => {
      hasError.value = false
      errorMessage.value = ''
      errorInfo.value = ''
      emit('reset')
    }

    const handleRefresh = (): void => {
      window.location.reload()
    }

    return () => {
      // 如果没有错误，渲染默认插槽
      if (!hasError.value) {
        return slots.default?.()
      }

      // 如果有自定义 fallback 插槽，使用它
      if (slots.fallback) {
        return slots.fallback({
          error: errorMessage.value,
          info: errorInfo.value,
          reset: handleReset,
        })
      }

      // 否则渲染默认错误 UI
      const title = props.errorTitle || $t('observability.errorBoundary.title')
      const description = props.errorDescription || $t('observability.errorBoundary.description')

      return (
        <div class="error-boundary">
          <div class="error-boundary__content">
            <div class="error-boundary__icon">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h3 class="error-boundary__title">{title}</h3>
            <p class="error-boundary__description">{description}</p>
            {import.meta.env.DEV && (
              <p class="error-boundary__details">{errorMessage.value}</p>
            )}
            <div class="error-boundary__actions">
              <button
                class="error-boundary__btn error-boundary__btn--primary"
                onClick={handleReset}
              >
                {$t('observability.errorBoundary.retry')}
              </button>
              <button class="error-boundary__btn" onClick={handleRefresh}>
                {$t('observability.errorBoundary.refresh')}
              </button>
            </div>
          </div>
        </div>
      )
    }
  },
})
