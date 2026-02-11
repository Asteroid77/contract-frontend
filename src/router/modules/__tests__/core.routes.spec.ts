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
    expect(document?.path).toBe('/document')
    expect(document?.meta?.layout).toBe('auth')
  })

  it('approval routes keep root transition and hidden descendants chain', () => {
    const approvalRoot = approvalRoutes.find((route) => route.name === 'approval')
    const detailRoute = approvalRoutes.find((route) => route.name === 'approval-instance-detail')
    const nodeRoute = approvalRoutes.find((route) => route.name === 'approval-node-list')
    const taskRoute = approvalRoutes.find((route) => route.name === 'approval-task-list')

    expect(approvalRoot?.meta?.isTransition).toBe(true)
    expect(detailRoute?.meta?.parent).toBe('approval-my-approval-instance-page')
    expect(detailRoute?.meta?.hideInMenu).toBe(true)
    expect(nodeRoute?.meta?.parent).toBe('approval-process-list')
    expect(nodeRoute?.meta?.hideInMenu).toBe(true)
    expect(taskRoute?.meta?.parent).toBe('approval-node-list')
    expect(taskRoute?.meta?.hideInMenu).toBe(true)
  })

  it('manage routes preserve transition entry and nested child', () => {
    const manageRoot = manageRoutes.find((route) => route.name === 'manage')
    const manageUser = manageRoutes.find((route) => route.name === 'manage-user-list')

    expect(manageRoot?.meta?.isTransition).toBe(true)
    expect(manageUser?.meta?.parent).toBe('manage')
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
