<script setup lang="ts">
/**
 * 错误边界组件
 * 使用 errorCaptured 钩子捕获子组件错误并显示降级 UI
 */
import { ref, onErrorCaptured } from 'vue'
import { captureVueError } from '@/app/observability/collectors/error-collector'

interface Props {
  /** 是否停止错误传播 */
  stopPropagation?: boolean
  /** 自定义错误标题 */
  errorTitle?: string
  /** 自定义错误描述 */
  errorDescription?: string
}

const props = withDefaults(defineProps<Props>(), {
  stopPropagation: true,
  errorTitle: '出错了',
  errorDescription: '该区域发生了错误，请尝试刷新页面',
})

const emit = defineEmits<{
  (e: 'error', error: Error, info: string): void
  (e: 'reset'): void
}>()

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

function handleReset(): void {
  hasError.value = false
  errorMessage.value = ''
  errorInfo.value = ''
  emit('reset')
}

function handleRefresh(): void {
  window.location.reload()
}
</script>

<template>
  <slot v-if="!hasError" />
  <div v-else class="error-boundary">
    <slot name="fallback" :error="errorMessage" :info="errorInfo" :reset="handleReset">
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
        <h3 class="error-boundary__title">{{ errorTitle }}</h3>
        <p class="error-boundary__description">{{ errorDescription }}</p>
        <p v-if="import.meta.env.DEV" class="error-boundary__details">
          {{ errorMessage }}
        </p>
        <div class="error-boundary__actions">
          <button class="error-boundary__btn error-boundary__btn--primary" @click="handleReset">
            重试
          </button>
          <button class="error-boundary__btn" @click="handleRefresh">刷新页面</button>
        </div>
      </div>
    </slot>
  </div>
</template>

<style scoped>
.error-boundary {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  padding: 24px;
}

.error-boundary__content {
  text-align: center;
  max-width: 400px;
}

.error-boundary__icon {
  color: #f5222d;
  margin-bottom: 16px;
}

.error-boundary__title {
  font-size: 18px;
  font-weight: 600;
  color: #262626;
  margin: 0 0 8px;
}

.error-boundary__description {
  font-size: 14px;
  color: #8c8c8c;
  margin: 0 0 16px;
}

.error-boundary__details {
  font-size: 12px;
  color: #ff4d4f;
  background: #fff2f0;
  padding: 8px 12px;
  border-radius: 4px;
  margin: 0 0 16px;
  word-break: break-all;
}

.error-boundary__actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.error-boundary__btn {
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  border: 1px solid #d9d9d9;
  background: #fff;
  color: #262626;
  transition: all 0.2s;
}

.error-boundary__btn:hover {
  border-color: #1890ff;
  color: #1890ff;
}

.error-boundary__btn--primary {
  background: #1890ff;
  border-color: #1890ff;
  color: #fff;
}

.error-boundary__btn--primary:hover {
  background: #40a9ff;
  border-color: #40a9ff;
}
</style>
