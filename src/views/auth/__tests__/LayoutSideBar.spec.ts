import { defineComponent, h, nextTick, reactive } from 'vue'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  convertRoutesSpy,
  menuShowOptionSpy,
  cssVarSpy,
  mockAuthRoutes,
  routeState,
} = vi.hoisted(() => ({
  convertRoutesSpy: vi.fn(),
  menuShowOptionSpy: vi.fn(),
  cssVarSpy: vi.fn(),
  mockAuthRoutes: [{ name: 'dashboard', path: '/dashboard' }],
  routeState: {
    name: 'dashboard',
  } as Record<string, unknown>,
}))

const reactiveRoute = reactive(routeState)

vi.mock('vue-router', () => ({
  useRoute: () => reactiveRoute,
}))

vi.mock('@/router', () => ({
  authRoutes: mockAuthRoutes,
}))

vi.mock('@/app/presentation/layout/utils/MenuBuilder', () => ({
  convertRoutesToMenuItems: (routes: unknown) => convertRoutesSpy(routes),
}))

vi.mock('@/app/presentation/theme/hooks/useCssVar', () => ({
  useCssVar: (varName: string) => cssVarSpy(varName),
}))

vi.mock('@/assets/logo.png', () => ({
  default: 'logo-mock-url',
}))

vi.mock('@/modules/shared/presentation/widget/ZwIcon.vue', () => ({
  default: defineComponent({
    name: 'ZwIcon',
    props: {
      name: {
        type: String,
        required: true,
      },
      size: {
        type: Number,
        required: false,
      },
    },
    setup(props) {
      return () =>
        h('i', {
          'data-test': 'zw-icon',
          'data-name': props.name,
          'data-size': String(props.size ?? ''),
        })
    },
  }),
}))

vi.mock('naive-ui', () => ({
  NButton: defineComponent({
    name: 'NButton',
    props: {
      onClick: {
        type: Function,
        required: false,
      },
      style: {
        type: [String, Object],
        required: false,
      },
    },
    setup(props, { slots }) {
      return () =>
        h(
          'button',
          {
            'data-test': 'n-button',
            style: props.style,
            onClick: props.onClick,
          },
          [slots.icon?.(), slots.default?.()],
        )
    },
  }),
  NMenu: defineComponent({
    name: 'NMenu',
    props: {
      collapsed: {
        type: Boolean,
        required: false,
      },
      options: {
        type: Array,
        required: false,
      },
      value: {
        type: String,
        required: false,
      },
      collapsedWidth: {
        type: Number,
        required: false,
      },
      collapsedIconSize: {
        type: Number,
        required: false,
      },
    },
    emits: ['update:value'],
    setup(props, { expose }) {
      expose({
        showOption: menuShowOptionSpy,
      })

      return () =>
        h('div', {
          'data-test': 'n-menu',
          'data-collapsed': String(Boolean(props.collapsed)),
          'data-value': props.value ?? '',
          'data-options-len': String((props.options || []).length),
          'data-collapsed-width': String(props.collapsedWidth ?? ''),
          'data-collapsed-icon-size': String(props.collapsedIconSize ?? ''),
        })
    },
  }),
}))

import LayoutSideBar from '@/views/auth/LayoutSideBar.vue'

describe('LayoutSideBar', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    reactiveRoute.name = 'dashboard'

    cssVarSpy.mockImplementation((varName: string) => {
      if (varName === '--sidebar-collapsed-width') {
        return { value: '64' }
      }
      if (varName === '--sidebar-expanded-width') {
        return { value: '220' }
      }
      return { value: '0' }
    })

    convertRoutesSpy.mockReturnValue([
      {
        key: 'dashboard',
        label: 'Dashboard',
      },
    ])
  })

  it('converts auth routes to menu options and binds initial menu state', () => {
    const wrapper = mount(LayoutSideBar)

    expect(convertRoutesSpy).toHaveBeenCalledWith(mockAuthRoutes)
    expect(wrapper.get('[data-test="n-menu"]').attributes('data-options-len')).toBe('1')
    expect(wrapper.get('[data-test="n-menu"]').attributes('data-value')).toBe('dashboard')
    expect(wrapper.get('[data-test="n-menu"]').attributes('data-collapsed')).toBe('false')
    expect(wrapper.get('[data-test="n-menu"]').attributes('data-collapsed-width')).toBe('64')
    expect(wrapper.get('[data-test="n-menu"]').attributes('data-collapsed-icon-size')).toBe('22')
    expect(wrapper.get('button[data-test="n-button"]').attributes('style')).toContain('left: 220px')
    expect(wrapper.get('[data-test="zw-icon"]').attributes('data-name')).toBe('icon-expanded')
  })

  it('toggles collapsed status, width style and icon when toggle button clicked', async () => {
    const wrapper = mount(LayoutSideBar)

    await wrapper.get('button[data-test="n-button"]').trigger('click')

    expect(wrapper.get('[data-test="n-menu"]').attributes('data-collapsed')).toBe('true')
    expect(wrapper.get('button[data-test="n-button"]').attributes('style')).toContain('left: 64px')
    expect(wrapper.get('[data-test="zw-icon"]').attributes('data-name')).toBe('icon-menu_collasped')
  })

  it('updates selection and expands option when route name changes', async () => {
    const wrapper = mount(LayoutSideBar)

    reactiveRoute.name = 'approval-detail'
    await nextTick()

    expect(wrapper.get('[data-test="n-menu"]').attributes('data-value')).toBe('approval-detail')
    expect(menuShowOptionSpy).toHaveBeenCalledWith('approval-detail')
  })
})
