import { createRouter, createWebHistory } from 'vue-router'
import { setupGuards } from './guards/setup'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [],
})
setupGuards(router)
export default router
