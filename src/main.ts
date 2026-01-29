import { createApp } from 'vue'
import '@/app/presentation/theme/styles/token.css'
import { usePlugins } from '@/app/plugins/usePlugins.ts'
import App from './App.vue'

const app = createApp(App)

usePlugins(app)

app.mount('#app')
