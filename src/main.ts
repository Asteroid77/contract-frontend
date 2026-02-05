import { createApp } from 'vue'
import '@/app/presentation/theme/styles/token.css'
import { usePlugins } from '@/app/plugins/usePlugins.ts'
import { initObservability } from '@/app/observability'
import App from './App.vue'

const app = createApp(App)

// 初始化可观测性体系（需在 plugins 之前，尽早捕获错误）
initObservability(app, {
  observability: {
    // 可选：覆盖默认配置
    // otelEndpoint: import.meta.env.VITE_OTEL_ENDPOINT,
    // sampleRate: 0.1,
  },
  openReplay: {
    projectKey: import.meta.env.VITE_OPENREPLAY_PROJECT_KEY || '',
    ingestPoint: import.meta.env.VITE_OPENREPLAY_INGEST_POINT,
    enabled: !!import.meta.env.VITE_OPENREPLAY_PROJECT_KEY,
  },
})

usePlugins(app)

app.mount('#app')
