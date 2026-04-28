import { createApp } from 'vue'
import '@/app/presentation/theme/styles/token.css'
import { mountIconfontSprite } from '@/app/plugins/iconfont-sprite'
import { usePlugins } from '@/app/plugins/usePlugins.ts'
import { enablePostLoginEnhancements } from '@/app/plugins/post-login-enhancements'
import { initObservabilityDeferred } from '@/app/observability/lazy'
import {
  getStoredAccessToken,
  initAuthTokenLifecycle,
} from '@/modules/access/application/token-manager'
import App from './App.vue'

const app = createApp(App)

mountIconfontSprite()

// 初始化可观测性体系（需在 plugins 之前，尽早捕获错误）
initObservabilityDeferred(app, {
  observability: {
    // 可选：覆盖默认配置
    // otelEndpoint: import.meta.env.VITE_OTEL_ENDPOINT,
    // sampleRate: 0.1,
  },
  openReplay: {
    projectKey: import.meta.env.VITE_OPENREPLAY_PROJECT_KEY || '',
    ingestPoint: import.meta.env.VITE_OPENREPLAY_INGEST_POINT,
    // 使用独立的开关控制，而不是依赖 projectKey 是否存在
    enabled: import.meta.env.VITE_OPENREPLAY_ENABLED === 'true',
  },
})

usePlugins(app)
initAuthTokenLifecycle()

if (getStoredAccessToken()) {
  void enablePostLoginEnhancements().catch(() => undefined)
}

app.mount('#app')
