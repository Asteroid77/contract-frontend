import { defineComponent } from 'vue'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/views/auth/DashboardView.vue', () => ({
  default: defineComponent({
    name: 'DashboardViewStub',
    setup: () => () => null,
  }),
}))

vi.mock('@/views/unauth/LoginView', () => ({
  default: defineComponent({
    name: 'LoginViewStub',
    setup: () => () => null,
  }),
}))

import { dashboardRoutes } from '@/router/modules/dashboard.routes'
import { approvalRoutes } from '@/router/modules/approval.routes'
import { manageRoutes } from '@/router/modules/manage.routes'
import { errorRoutes } from '@/router/modules/error.routes'
import { businessRoutes } from '@/router/modules/business.routes'
import { userRoutes } from '@/router/modules/user.routes'
import { unauthRoutes } from '@/router/modules/unauth.routes'
import * as routeModules from '@/router/modules'

describe('core route modules config', () => {
  it('dashboard routes keep auth layout metadata', () => {
    const dashboard = dashboardRoutes.find((route) => route.name === 'dashboard')
    const document = dashboardRoutes.find((route) => route.name === 'document')

    expect(dashboard?.path).toBe('/dashboard')
    expect(dashboard?.meta?.layout).toBe('auth')
    expect(dashboard?.meta?.icon).toBe('nav.dashboard')
    expect(document?.path).toBe('/document')
    expect(document?.meta?.layout).toBe('auth')
    expect(document?.meta?.icon).toBe('nav.docs')
  })

  it('approval routes keep root transition and hidden descendants chain', () => {
    const approvalRoot = approvalRoutes.find((route) => route.name === 'approval')
    const detailRoute = approvalRoutes.find((route) => route.name === 'approval-instance-detail')
    const nodeRoute = approvalRoutes.find((route) => route.name === 'approval-node-list')
    const taskRoute = approvalRoutes.find((route) => route.name === 'approval-task-list')

    expect(approvalRoot?.meta?.isTransition).toBe(true)
    expect(approvalRoot?.meta?.icon).toBe('nav.approval')
    expect(
      approvalRoutes.find((route) => route.name === 'approval-my-approval-instance-page')?.meta
        ?.icon,
    ).toBe('approval.instance')
    expect(approvalRoutes.find((route) => route.name === 'approval-my-task-list')?.meta?.icon).toBe(
      'approval.reviewing',
    )
    expect(approvalRoutes.find((route) => route.name === 'approval-process-list')?.meta?.icon).toBe(
      'approval.process',
    )
    expect(detailRoute?.meta?.parent).toBe('approval-my-approval-instance-page')
    expect(detailRoute?.meta?.icon).toBe('icon-shenpi')
    expect(detailRoute?.meta?.hideInMenu).toBe(true)
    expect(nodeRoute?.meta?.parent).toBe('approval-process-list')
    expect(nodeRoute?.meta?.icon).toBe('approval.nodes')
    expect(nodeRoute?.meta?.hideInMenu).toBe(true)
    expect(taskRoute?.meta?.parent).toBe('approval-node-list')
    expect(taskRoute?.meta?.icon).toBe('approval.tasks')
    expect(taskRoute?.meta?.hideInMenu).toBe(true)
  })

  it('manage routes preserve transition entry and nested child', () => {
    const manageRoot = manageRoutes.find((route) => route.name === 'manage')
    const manageUser = manageRoutes.find((route) => route.name === 'manage-user-list')
    const manageUserDetail = manageRoutes.find((route) => route.name === 'manage-user-detail')
    const manageUserEdit = manageRoutes.find((route) => route.name === 'manage-user-edit')

    expect(manageRoot?.meta?.isTransition).toBe(true)
    expect(manageRoot?.meta?.icon).toBe('nav.manage')
    expect(manageUser?.meta?.parent).toBe('manage')
    expect(manageUser?.meta?.icon).toBe('user.manage')
    expect(manageUser?.meta?.ability).toEqual({ action: 'read', subject: 'User' })
    expect(manageUserDetail?.meta?.parent).toBe('manage-user-list')
    expect(manageUserDetail?.meta?.hideInMenu).toBe(true)
    expect(manageUserEdit?.meta?.parent).toBe('manage-user-list')
    expect(manageUserEdit?.meta?.hideInMenu).toBe(true)
  })

  it('error routes include 404 fallback redirect', () => {
    const route403 = errorRoutes.find((route) => route.name === '403')
    const fallback = errorRoutes.find((route) => route.path === '/:pathMatch(.*)*')

    expect(route403?.meta?.requiresAuth).toBe(false)
    expect(route403?.meta?.hideInMenu).toBe(true)
    expect(fallback?.redirect).toEqual({ name: '404' })
  })

  it('router/modules index re-exports all route groups', () => {
    expect(routeModules.dashboardRoutes).toBe(dashboardRoutes)
    expect(routeModules.businessRoutes).toBe(businessRoutes)
    expect(routeModules.userRoutes).toBe(userRoutes)
    expect(routeModules.manageRoutes).toBe(manageRoutes)
    expect(routeModules.approvalRoutes).toBe(approvalRoutes)
    expect(routeModules.unauthRoutes).toBe(unauthRoutes)
    expect(routeModules.errorRoutes).toBe(errorRoutes)
  })
})
