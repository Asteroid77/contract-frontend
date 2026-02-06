import { $t } from '@/_utils/i18n'
import type { AppRouteRecord } from '../types'

/**
 * 审批中心相关路由
 */
export const approvalRoutes: AppRouteRecord[] = [
  {
    path: '/approval',
    name: 'approval',
    component: () => import('@/views/auth/DashboardView.vue'),
    meta: {
      name: $t('layout.menu.approval'),
      icon: 'ApprovalsApp16Regular',
      isTransition: true,
    },
  },
  {
    path: '/approval/my-approval-instance/page',
    name: 'approval-my-approval-instance-page',
    component: () => import('@/views/auth/ApprovalInstancePageView.vue'),
    meta: {
      name: $t('layout.menu.allTasks'),
      icon: 'ApprovalFilled',
      parent: 'approval',
    },
  },
  {
    path: '/approval/instance/detail',
    name: 'approval-instance-detail',
    component: () => import('@/views/auth/ApprovalDetailView.vue'),
    meta: {
      name: $t('layout.menu.taskDetail'),
      icon: 'icon-shenpi',
      parent: 'approval-my-approval-instance-page',
      hideInMenu: true,
    },
  },
  {
    path: '/approval/my-task/list',
    name: 'approval-my-task-list',
    component: () => import('@/views/auth/DashboardView.vue'),
    meta: {
      name: $t('layout.menu.reviewing'),
      icon: 'TaskComplete',
      parent: 'approval',
    },
  },
  {
    path: '/approval/process/list',
    name: 'approval-process-list',
    component: () => import('@/views/auth/DashboardView.vue'),
    meta: {
      name: $t('layout.menu.process'),
      icon: 'Fluid20Regular',
      parent: 'approval',
    },
  },
  {
    path: '/approval/node/list',
    name: 'approval-node-list',
    component: () => import('@/views/auth/DashboardView.vue'),
    meta: {
      name: $t('layout.menu.nodes'),
      icon: 'NodeIndexOutlined',
      parent: 'approval-process-list',
      hideInMenu: true,
    },
  },
  {
    path: '/approval/task/list',
    name: 'approval-task-list',
    component: () => import('@/views/auth/DashboardView.vue'),
    meta: {
      name: $t('layout.menu.tasks'),
      icon: 'FeaturedPlayListOutlined',
      parent: 'approval-node-list',
      hideInMenu: true,
    },
  },
]
