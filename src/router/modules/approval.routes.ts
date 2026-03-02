import type { AppRouteRecord } from '../types'
import DashboardView from '@/views/auth/DashboardView.vue'

/**
 * 审批中心相关路由
 */
export const approvalRoutes: AppRouteRecord[] = [
  {
    path: '/approval',
    name: 'approval',
    component: DashboardView,
    meta: {
      name: 'layout.menu.approval',
      icon: 'ApprovalsApp16Regular',
      isTransition: true,
    },
  },
  {
    path: '/approval/my-approval-instance/page',
    name: 'approval-my-approval-instance-page',
    component: () => import('@/views/auth/ApprovalInstancePageView.vue'),
    meta: {
      name: 'layout.menu.allTasks',
      icon: 'ApprovalFilled',
      parent: 'approval',
    },
  },
  {
    path: '/approval/instance/detail',
    name: 'approval-instance-detail',
    component: () => import('@/views/auth/ApprovalDetailView.vue'),
    meta: {
      name: 'layout.menu.taskDetail',
      icon: 'icon-shenpi',
      parent: 'approval-my-approval-instance-page',
      hideInMenu: true,
    },
  },
  {
    path: '/approval/my-task/list',
    name: 'approval-my-task-list',
    component: DashboardView,
    meta: {
      name: 'layout.menu.reviewing',
      icon: 'TaskComplete',
      parent: 'approval',
    },
  },
  {
    path: '/approval/process/list',
    name: 'approval-process-list',
    component: DashboardView,
    meta: {
      name: 'layout.menu.process',
      icon: 'Fluid20Regular',
      parent: 'approval',
    },
  },
  {
    path: '/approval/node/list',
    name: 'approval-node-list',
    component: DashboardView,
    meta: {
      name: 'layout.menu.nodes',
      icon: 'NodeIndexOutlined',
      parent: 'approval-process-list',
      hideInMenu: true,
    },
  },
  {
    path: '/approval/task/list',
    name: 'approval-task-list',
    component: DashboardView,
    meta: {
      name: 'layout.menu.tasks',
      icon: 'FeaturedPlayListOutlined',
      parent: 'approval-node-list',
      hideInMenu: true,
    },
  },
]
