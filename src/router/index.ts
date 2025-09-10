import { $t } from '@/_utils/i18n'
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { setupGuards } from './guards/setup'
import UnauthLayoutView from '@/views/unauth/UnauthLayoutView'
import LoginView from '@/views/unauth/LoginView'
import RegisterView from '@/views/unauth/RegisterView'
import PasswordRecoveryView from '@/views/unauth/PasswordRecoveryView'
import Oauth2CallbackView from '@/views/unauth/Oauth2CallbackView.vue'
import LayoutView from '@/views/LayoutView.vue'
import AuthLayoutView from '@/views/auth/AuthLayoutView.vue'
import DashboardView from '@/views/auth/DashboardView.vue'
import UserAdditionalInfoView from '@/views/auth/UserAdditionalInfoView.vue'

export const authRoutes = [
  {
    path: 'dashboard',
    name: 'dashboard',
    component: DashboardView,
    meta: {
      name: $t('sign.route.home'),
      icon: 'MapsHomeWorkOutlined',
    },
  },
  {
    path: 'document',
    name: 'document',
    component: DashboardView,
    meta: {
      name: $t('sign.route.document'),
      icon: 'MenuBookTwotone',
    },
  },
  {
    path: 'business',
    name: 'business',
    component: DashboardView,
    meta: {
      name: $t('route.auth.business'),
      isTransition: true,
      icon: 'BusinessCenterOutlined',
    },
  },
  {
    path: 'invitation',
    name: 'invitation',
    component: DashboardView,
    meta: {
      name: $t('route.auth.invitation'),
      icon: 'InsertInvitationOutlined',
      parent: 'business',
    },
  },
  {
    path: 'sign',
    name: 'sign',
    component: DashboardView,
    meta: {
      name: $t('route.auth.sign'),
      icon: 'DesignServicesTwotone',
      parent: 'business',
    },
  },
  {
    path: 'user',
    name: 'user',
    component: DashboardView,
    meta: {
      name: $t('route.auth.user'),
      isTransition: true,
      icon: 'UserSwitchOutlined',
    },
  },
  {
    path: 'user/additional-info',
    name: 'user-additional-info',
    component: UserAdditionalInfoView,
    meta: {
      name: $t('route.auth.additional'),
      icon: 'UserData',
      parent: 'user',
    },
  },
  {
    path: 'user/agent/list',
    name: 'user-agent-list',
    component: DashboardView,
    meta: {
      name: $t('route.auth.agent-list'),
      icon: 'RealEstateAgentOutlined',
      parent: 'user',
    },
  },
  {
    path: 'sign/self/list',
    name: 'my-sign',
    component: DashboardView,
    meta: {
      name: $t('route.auth.my-sign'),
      icon: 'AssignmentIndOutlined',
      parent: 'user',
    },
  },
  {
    path: 'manage',
    name: 'manage',
    component: DashboardView,
    meta: {
      name: $t('route.auth.manage'),
      icon: 'ManageAccountsOutlined',
      isTransition: true,
    },
  },
  {
    path: 'manage/user/list',
    name: 'manage-user-list',
    component: DashboardView,
    meta: {
      name: $t('route.auth.manager-user-list'),
      icon: 'UserMultiple',
      parent: 'manage',
    },
  },
  {
    path: 'approval',
    name: 'approval',
    component: DashboardView,
    meta: {
      name: $t('route.auth.approval'),
      isTransition: true,
      icon: 'ApprovalsApp16Regular',
    },
  },
  {
    path: 'approval/my-approval-task/list',
    name: 'approval-my-approval-task-list',
    component: DashboardView,
    meta: {
      name: $t('route.auth.my-approval-task-list'),
      icon: 'ApprovalFilled',
      parent: 'approval',
    },
  },
  {
    path: 'approval/my-task/list',
    name: 'approval-my-task-list',
    component: DashboardView,
    meta: {
      name: $t('route.auth.approval-my-task-list'),
      icon: 'TaskComplete',
      parent: 'approval',
    },
  },
  {
    path: 'approval/process/list',
    name: 'approval-process-list',
    component: DashboardView,
    meta: {
      name: $t('route.auth.approval-process-list'),
      icon: 'Fluid20Regular',
      parent: 'approval',
    },
  },
  {
    path: 'approval/node/list',
    name: 'approval-node-list',
    component: DashboardView,
    meta: {
      name: $t('route.auth.approval-node-list'),
      icon: 'NodeIndexOutlined',
      parent: 'approval-proess-list',
      hideInMenu: true,
    },
  },
  {
    path: 'approval/task/list',
    name: 'approval-task-list',
    component: DashboardView,
    meta: {
      name: $t('route.auth.approval-task-list'),
      icon: 'FeaturedPlayListOutlined',
      parent: 'approval-node-list',
      hideInMenu: true,
    },
  },
]
export const routes = [
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
            meta: {
              name: $t('account.login.signIn'),
            },
          },
          {
            path: 'register',
            name: 'register',
            component: RegisterView,
            meta: {
              name: $t('account.register.text'),
            },
          },
          {
            path: 'password-recovery',
            name: 'password recovery',
            component: PasswordRecoveryView,
            meta: {
              name: $t('sign.route.password-recovery'),
            },
          },
          {
            path: 'oauth2/callback',
            name: 'oauth2-callback',
            component: Oauth2CallbackView,
            meta: {
              name: $t('account.login.oauth2.callback.title'),
            },
          },
        ],
      },
      {
        path: 'auth',
        redirect: { name: 'dashboard' },
        component: AuthLayoutView,
        children: authRoutes,
      },
    ],
  },
] as const satisfies readonly RouteRecordRaw[]
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})
setupGuards(router)
export default router
