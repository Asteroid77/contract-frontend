import { createApp } from 'vue'
import { usePlugins } from '@/app/plugins/usePlugins.ts'
import App from './App.vue'

const app = createApp(App)

usePlugins(app)

app.mount('#app')
