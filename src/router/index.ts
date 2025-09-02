import { createRouter, createWebHistory } from 'vue-router'
import { setupGuards } from './guards/setup'
import UnauthLayoutView from '@/views/unauth/UnauthLayoutView'
import LoginView from '@/views/unauth/LoginView'
import RegisterView from '@/views/unauth/RegisterView'
import PasswordRecoveryView from '@/views/unauth/PasswordRecoveryView'
import Oauth2CallbackView from '@/views/unauth/Oauth2CallbackView.vue'
import LayoutView from '@/views/LayoutView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'layout',
      component: LayoutView,
      children: [
        {
          name: 'unauth-layout-view',
          path: 'unauth',
          redirect: { name: 'login' },
          component: UnauthLayoutView,
          children: [
            {
              path: 'login',
              name: 'login',
              component: LoginView,
            },
            {
              path: 'register',
              name: 'register',
              component: RegisterView,
            },
            {
              path: 'password-recovery',
              name: 'password recovery',
              component: PasswordRecoveryView,
            },
            {
              path: 'oauth2/callback',
              name: 'oauth2-callback',
              component: Oauth2CallbackView,
            },
          ],
        },
      ],
    },
  ],
})
setupGuards(router)
export default router
