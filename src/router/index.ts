import { $t } from '@/_utils/i18n'
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { setupGuards } from './guards/setup'
import type { RouteLocation } from 'vue-router'

// ============================================================
//  直接导入（首屏必需，不需要懒加载）
// ============================================================
import LayoutView from '@/views/LayoutView.vue'
import UnauthLayoutView from '@/views/unauth/UnauthLayoutView'
import AuthLayoutView from '@/views/auth/AuthLayoutView.vue'
import LoginView from '@/views/unauth/LoginView'
import DashboardView from '@/views/auth/DashboardView.vue'

// ============================================================
// 工具函数
// ============================================================
const toNumberOrNull = (val: unknown): number | null => {
  if (val === null || val === undefined || val === '') return null
  const num = Number(val)
  return isNaN(num) ? null : num
}

// ============================================================
// 路由定义
// ============================================================

export const authRoutes = [
  // ==================== Dashboard ====================
  {
    path: 'dashboard',
    name: 'dashboard',
    component: DashboardView,
    meta: {
      name: $t('sign.route.home'),
      icon: 'MapsHomeWorkOutlined',
    },
  },

  // ==================== 文档 ====================
  {
    path: 'document',
    name: 'document',
    component: () => import('@/views/auth/DashboardView.vue'),
    meta: {
      name: $t('sign.route.document'),
      icon: 'MenuBookTwotone',
    },
  },

  // ==================== 业务管理 ====================
  {
    path: 'business',
    name: 'business',
    component: () => import('@/views/auth/DashboardView.vue'),
    meta: {
      name: $t('route.auth.business'),
      icon: 'BusinessCenterOutlined',
      isTransition: true,
    },
  },
  {
    path: 'invitation',
    name: 'invitation',
    component: () => import('@/views/auth/InvitationPageView.vue'),
    meta: {
      name: $t('route.auth.invitation'),
      icon: 'InsertInvitationOutlined',
      parent: 'business',
    },
  },
  {
    path: 'sign',
    name: 'sign',
    component: () => import('@/views/auth/ServiceAgreementDetailView'),
    meta: {
      name: $t('route.auth.sign'),
      icon: 'icon-qianyue',
      parent: 'sign-page',
    },
    props: (route: RouteLocation) => ({
      id: toNumberOrNull(route.query.id),
    }),
  },
  {
    path: 'sign/page',
    name: 'sign-page',
    component: () => import('@/views/auth/ServiceAgreementPageView'),
    meta: {
      name: $t('route.auth.sign-page'),
      icon: 'icon-qianyueliebiao',
      parent: 'business',
    },
  },
  {
    path: 'sign/result',
    name: 'sign-result',
    component: () => import('@/views/auth/SignResultView'),
    meta: {
      name: $t('route.auth.sign-result'),
      icon: 'icon-qianyueliebiao',
      parent: 'sign',
      hideInMenu: true,
    },
    props: (route: RouteLocation) => ({
      status: toNumberOrNull(route.query.status),
      id: toNumberOrNull(route.query.id),
    }),
  },

  // ==================== 用户中心 ====================
  {
    path: 'user',
    name: 'user',
    component: () => import('@/views/auth/DashboardView.vue'),
    meta: {
      name: $t('route.auth.user'),
      icon: 'UserSwitchOutlined',
      isTransition: true,
    },
  },
  {
    path: 'user/additional-info',
    name: 'user-additional-info',
    component: () => import('@/views/auth/UserAdditionalInfoView.vue'),
    meta: {
      name: $t('route.auth.additional'),
      icon: 'UserData',
      parent: 'user',
    },
  },
  {
    path: 'user/agent/list',
    name: 'user-agent-list',
    component: () => import('@/views/auth/DashboardView.vue'),
    meta: {
      name: $t('route.auth.agent-list'),
      icon: 'RealEstateAgentOutlined',
      parent: 'user',
    },
  },
  {
    path: 'sign/self/list',
    name: 'my-sign',
    component: () => import('@/views/auth/DashboardView.vue'),
    meta: {
      name: $t('route.auth.my-sign'),
      icon: 'AssignmentIndOutlined',
      parent: 'user',
    },
  },

  // ==================== 管理中心 ====================
  {
    path: 'manage',
    name: 'manage',
    component: () => import('@/views/auth/DashboardView.vue'),
    meta: {
      name: $t('route.auth.manage'),
      icon: 'ManageAccountsOutlined',
      isTransition: true,
    },
  },
  {
    path: 'manage/user/list',
    name: 'manage-user-list',
    component: () => import('@/views/auth/DashboardView.vue'),
    meta: {
      name: $t('route.auth.manager-user-list'),
      icon: 'UserMultiple',
      parent: 'manage',
    },
  },

  // ==================== 审批中心 ====================
  {
    path: 'approval',
    name: 'approval',
    component: () => import('@/views/auth/DashboardView.vue'),
    meta: {
      name: $t('route.auth.approval'),
      icon: 'ApprovalsApp16Regular',
      isTransition: true,
    },
  },
  {
    path: 'approval/my-approval-instance/page',
    name: 'approval-my-approval-instance-page',
    component: () => import('@/views/auth/ApprovalInstancePageView.vue'),
    meta: {
      name: $t('route.auth.my-approval-instance-page'),
      icon: 'ApprovalFilled',
      parent: 'approval',
    },
  },
  {
    path: 'approval/instance/detail',
    name: 'approval-instance-detail',
    component: () => import('@/views/auth/ApprovalDetailView.vue'),
    meta: {
      name: $t('route.auth.approval-instance-detail'),
      icon: 'icon-shenpi',
      parent: 'approval-my-approval-instance-page',
      hideInMenu: true,
    },
  },
  {
    path: 'approval/my-task/list',
    name: 'approval-my-task-list',
    component: () => import('@/views/auth/DashboardView.vue'),
    meta: {
      name: $t('route.auth.approval-my-task-list'),
      icon: 'TaskComplete',
      parent: 'approval',
    },
  },
  {
    path: 'approval/process/list',
    name: 'approval-process-list',
    component: () => import('@/views/auth/DashboardView.vue'),
    meta: {
      name: $t('route.auth.approval-process-list'),
      icon: 'Fluid20Regular',
      parent: 'approval',
    },
  },
  {
    path: 'approval/node/list',
    name: 'approval-node-list',
    component: () => import('@/views/auth/DashboardView.vue'),
    meta: {
      name: $t('route.auth.approval-node-list'),
      icon: 'NodeIndexOutlined',
      parent: 'approval-process-list',
      hideInMenu: true,
    },
  },
  {
    path: 'approval/task/list',
    name: 'approval-task-list',
    component: () => import('@/views/auth/DashboardView.vue'),
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
            component: () => import('@/views/unauth/RegisterView'),
            meta: {
              name: $t('account.register.text'),
            },
          },
          {
            path: 'password-recovery',
            name: 'password-recovery',
            component: () => import('@/views/unauth/PasswordRecoveryView'),
            meta: {
              name: $t('sign.route.password-recovery'),
            },
          },
          {
            path: 'oauth2/callback',
            name: 'oauth2-callback',
            component: () => import('@/views/unauth/Oauth2CallbackView.vue'),
            meta: {
              name: $t('account.login.oauth2.callback.title'),
            },
          },
          {
            path: 'sign/preview/attachments',
            name: 'approval-preview-attachments',
            component: () => import('@/views/unauth/PreviewAttachments.tsx'),
            props: (route: RouteLocation) => ({
              type: toNumberOrNull(route.query.type),
              id: toNumberOrNull(route.query.id),
            }),
          },
        ],
      },
      {
        path: 'auth',
        name: 'auth',
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
