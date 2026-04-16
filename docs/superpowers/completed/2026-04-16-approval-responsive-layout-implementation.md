# Approval Responsive Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Status (2026-04-16):** 已完成。实现已提交为 `1b1f691 feat(approval): add responsive task table modes`；验证覆盖 `useViewportMode`、`AuthLayoutView`、`useResponsiveTableMode`、`ApprovalInstancePage` 四组回归测试与 `pnpm type-check`。

**Goal:** 为登录态布局增加 `compact-desktop` 视口模式，并为审批任务列表接入基于容器宽度的 `wide / compact / stacked` 三态表格表现。

**Architecture:** 先在 `app/presentation/hooks` 中新增可复用的视口模式 hook，用它驱动登录态布局的默认侧边栏状态与移动端渲染分支。再在 `shared/presentation/table` 中新增轻量的容器宽度模式 hook，让审批任务列表基于模式切换列定义，而不是做列宽/内容宽度推导。

**Tech Stack:** Vue 3 Composition API、TypeScript、Naive UI `NDataTable`、Vitest、Vue Test Utils、ResizeObserver

---

## File Structure

- Create: `src/app/presentation/hooks/useViewportMode.ts`
  - 负责把 `window.innerWidth` 映射为 `desktop / compact-desktop / mobile`
- Create: `src/app/presentation/hooks/__tests__/useViewportMode.spec.ts`
  - 验证断点映射、resize 响应与事件清理
- Modify: `src/views/auth/AuthLayoutView.tsx`
  - 接入视口模式，控制登录态布局默认侧边栏状态与桌面/移动内容分支
- Modify: `src/views/auth/__tests__/AuthLayoutViewTsx.spec.tsx`
  - 覆盖桌面、窄桌面、移动端三种模式及断点切换默认值重置
- Create: `src/modules/shared/presentation/table/useResponsiveTableMode.ts`
  - 使用 `ResizeObserver` 将容器宽度映射为 `wide / compact / stacked`
- Create: `src/modules/shared/presentation/table/__tests__/useResponsiveTableMode.spec.ts`
  - 验证宽度分桶、observer 绑定和 cleanup
- Modify: `src/modules/approval/presentation/approval/ApprovalInstancePage.vue`
  - 基于表格模式切换审批列表列结构和主列副标题内容
- Modify: `src/modules/approval/presentation/approval/__tests__/ApprovalInstancePage.spec.ts`
  - 覆盖 `wide / compact / stacked` 三态列定义和关键交互

### Task 1: Add Viewport Mode Hook

**Files:**
- Create: `src/app/presentation/hooks/useViewportMode.ts`
- Test: `src/app/presentation/hooks/__tests__/useViewportMode.spec.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import { useViewportMode } from '@/app/presentation/hooks/useViewportMode'

const setViewportWidth = (width: number) => {
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    writable: true,
    value: width,
  })
  window.dispatchEvent(new Event('resize'))
}

const mountHook = () =>
  mount(
    defineComponent({
      setup() {
        const mode = useViewportMode()
        return () => h('div', { 'data-test': 'viewport-mode' }, mode.value)
      },
    }),
  )

describe('useViewportMode', () => {
  const addEventListenerSpy = vi.spyOn(window, 'addEventListener')
  const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')

  beforeEach(() => {
    vi.clearAllMocks()
    setViewportWidth(1366)
  })

  afterEach(() => {
    addEventListenerSpy.mockClear()
    removeEventListenerSpy.mockClear()
  })

  it('maps viewport widths to desktop, compact-desktop and mobile', async () => {
    const wrapper = mountHook()
    await nextTick()

    expect(wrapper.get('[data-test="viewport-mode"]').text()).toBe('desktop')

    setViewportWidth(1024)
    await nextTick()
    expect(wrapper.get('[data-test="viewport-mode"]').text()).toBe('compact-desktop')

    setViewportWidth(375)
    await nextTick()
    expect(wrapper.get('[data-test="viewport-mode"]').text()).toBe('mobile')
  })

  it('registers and cleans up resize listeners', () => {
    const wrapper = mountHook()

    expect(addEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function))

    wrapper.unmount()

    expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function))
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
pnpm test:unit --run src/app/presentation/hooks/__tests__/useViewportMode.spec.ts
```

Expected: FAIL with `Cannot find module '@/app/presentation/hooks/useViewportMode'` or equivalent import error.

- [ ] **Step 3: Write minimal implementation**

```ts
import { computed, onBeforeUnmount, onMounted, ref, type ComputedRef } from 'vue'

export type ViewportMode = 'desktop' | 'compact-desktop' | 'mobile'

export const resolveViewportMode = (width: number): ViewportMode => {
  if (width < 768) return 'mobile'
  if (width < 1200) return 'compact-desktop'
  return 'desktop'
}

export function useViewportMode(): ComputedRef<ViewportMode> {
  const viewportWidth = ref(typeof window === 'undefined' ? 1200 : window.innerWidth)

  const syncViewportWidth = () => {
    if (typeof window === 'undefined') return
    viewportWidth.value = window.innerWidth
  }

  onMounted(() => {
    syncViewportWidth()
    if (typeof window === 'undefined') return
    window.addEventListener('resize', syncViewportWidth)
  })

  onBeforeUnmount(() => {
    if (typeof window === 'undefined') return
    window.removeEventListener('resize', syncViewportWidth)
  })

  return computed(() => resolveViewportMode(viewportWidth.value))
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
pnpm test:unit --run src/app/presentation/hooks/__tests__/useViewportMode.spec.ts
```

Expected: PASS with 2 tests passed.

- [ ] **Step 5: Commit**

```bash
git add src/app/presentation/hooks/useViewportMode.ts src/app/presentation/hooks/__tests__/useViewportMode.spec.ts
git commit -m "feat(layout): add viewport mode hook"
```

### Task 2: Apply Viewport Modes To Auth Layout

**Files:**
- Modify: `src/views/auth/AuthLayoutView.tsx`
- Test: `src/views/auth/__tests__/AuthLayoutViewTsx.spec.tsx`

- [ ] **Step 1: Write the failing test**

Add these tests to `src/views/auth/__tests__/AuthLayoutViewTsx.spec.tsx`:

```ts
const setViewportWidth = (width: number) => {
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    writable: true,
    value: width,
  })
  window.dispatchEvent(new Event('resize'))
}

it('defaults to expanded sidebar on desktop viewport and compact sidebar on compact-desktop viewport', async () => {
  setViewportWidth(1366)
  const desktopWrapper = mount(AuthLayoutView)
  await nextTick()

  expect(desktopWrapper.find('[data-test="icon-chevron-back"]').exists()).toBe(true)
  expect(desktopWrapper.find('[data-test="auth-mobile-active-tab"]').exists()).toBe(false)

  desktopWrapper.unmount()

  setViewportWidth(1024)
  const compactWrapper = mount(AuthLayoutView)
  await nextTick()

  expect(compactWrapper.find('[data-test="icon-chevron-forward"]').exists()).toBe(true)
  expect(compactWrapper.find('[data-test="auth-mobile-active-tab"]').exists()).toBe(false)
  expect(compactWrapper.find('[data-test="n-scrollbar"]').exists()).toBe(true)
})

it('resets sidebar default when re-entering compact-desktop viewport', async () => {
  setViewportWidth(1024)
  const wrapper = mount(AuthLayoutView)
  await nextTick()

  const toggleButton = wrapper
    .findAll('button')
    .find((buttonItem) => buttonItem.find('[data-test="icon-chevron-forward"]').exists())

  if (!toggleButton) {
    throw new Error('sidebar toggle button not found')
  }

  await toggleButton.trigger('click')
  expect(wrapper.find('[data-test="icon-chevron-back"]').exists()).toBe(true)

  setViewportWidth(1366)
  await nextTick()
  expect(wrapper.find('[data-test="icon-chevron-back"]').exists()).toBe(true)

  setViewportWidth(1024)
  await nextTick()
  expect(wrapper.find('[data-test="icon-chevron-forward"]').exists()).toBe(true)
})

it('renders mobile tab controls only on mobile viewport', async () => {
  setViewportWidth(375)
  const wrapper = mount(AuthLayoutView)
  await nextTick()

  expect(wrapper.find('[data-test="auth-mobile-active-tab"]').exists()).toBe(true)
  expect(wrapper.find('[data-test="auth-mobile-tabs-toggle"]').exists()).toBe(true)
  expect(wrapper.find('[data-test="n-scrollbar"]').exists()).toBe(false)
})
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
pnpm test:unit --run src/views/auth/__tests__/AuthLayoutViewTsx.spec.tsx
```

Expected: FAIL because the current layout never reacts to `1200px` and still renders mobile-only sections through CSS classes only.

- [ ] **Step 3: Write minimal implementation**

Update `src/views/auth/AuthLayoutView.tsx` around state setup:

```tsx
import { useViewportMode } from '@/app/presentation/hooks/useViewportMode'

const viewportMode = useViewportMode()
const isMobileViewport = computed(() => viewportMode.value === 'mobile')

watch(
  viewportMode,
  (mode) => {
    mobileMenuOpen.value = false
    mobileTabsDrawerOpen.value = false

    if (mode === 'desktop') {
      siderCollapsed.value = false
      return
    }

    if (mode === 'compact-desktop') {
      siderCollapsed.value = true
      return
    }

    siderCollapsed.value = true
  },
  { immediate: true },
)
```

Then replace the render branches that currently depend only on CSS classes:

```tsx
{isMobileViewport.value && mobileMenuOpen.value && (
  <div
    class="fixed inset-0 bg-[var(--color-primitive-slate-950)]/45 z-40"
    onClick={() => {
      mobileMenuOpen.value = false
    }}
  />
)}
```

```tsx
{isMobileViewport.value ? (
  <div class="flex-1 min-w-0 flex items-center justify-end gap-2 overflow-hidden">
    <button
      class="min-w-0 max-w-full px-3 py-1.5 rounded-md text-sm font-medium text-[var(--color-text-main)] bg-[var(--color-border)]/70 truncate"
      onClick={() => {
        if (additionalTabCount.value > 0) {
          mobileTabsDrawerOpen.value = true
        }
      }}
      data-test="auth-mobile-active-tab"
    >
      {activeTabTitle.value}
    </button>
    {additionalTabCount.value > 0 && (
      <button
        class="px-2.5 py-1.5 rounded-md text-xs font-medium text-[var(--color-text-body)] bg-[var(--color-border)] hover:bg-[var(--color-border)]/80 transition-colors"
        onClick={() => {
          mobileTabsDrawerOpen.value = true
        }}
        data-test="auth-mobile-tabs-toggle"
      >
        {`+${additionalTabCount.value}`}
      </button>
    )}
  </div>
) : (
  <div class="flex-1 items-center gap-2 text-sm min-w-0 overflow-x-auto pl-[var(--spacing-sm)] hidden md:flex">
    {breadcrumbs.value.map((crumb, index) => (
      <div class="flex items-center gap-2 shrink-0" key={`${crumb.path}-${index}`}>
        {index > 0 && <span class="text-sm font-medium leading-none text-[var(--color-text-light)] shrink-0">{'>'}</span>}
        <span
          class={[
            'truncate',
            index === breadcrumbs.value.length - 1
              ? 'text-[var(--color-text-main)] font-medium'
              : 'text-[var(--color-text-light)]',
          ]}
        >
          {crumb.title}
        </span>
      </div>
    ))}
  </div>
)}
```

And gate the desktop tab strip:

```tsx
{!isMobileViewport.value && (
  <div class="h-10 bg-[var(--color-bg-card)] border-b border-[var(--color-border)] px-2 shrink-0">
    <NScrollbar xScrollable trigger="hover" size={3} class="h-full" contentClass="h-full">
      {/* existing tab body */}
    </NScrollbar>
  </div>
)}
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
pnpm test:unit --run src/views/auth/__tests__/AuthLayoutViewTsx.spec.tsx
```

Expected: PASS with the new viewport-mode tests plus the existing navigation/dropdown tests.

- [ ] **Step 5: Commit**

```bash
git add src/views/auth/AuthLayoutView.tsx src/views/auth/__tests__/AuthLayoutViewTsx.spec.tsx
git commit -m "feat(layout): add compact desktop auth mode"
```

### Task 3: Add Responsive Table Mode Hook

**Files:**
- Create: `src/modules/shared/presentation/table/useResponsiveTableMode.ts`
- Test: `src/modules/shared/presentation/table/__tests__/useResponsiveTableMode.spec.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import {
  resolveResponsiveTableMode,
  useResponsiveTableMode,
} from '@/modules/shared/presentation/table/useResponsiveTableMode'

class ResizeObserverMock {
  static callback: ResizeObserverCallback | null = null
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()

  constructor(callback: ResizeObserverCallback) {
    ResizeObserverMock.callback = callback
  }
}

const triggerResize = (width: number) => {
  ResizeObserverMock.callback?.(
    [
      {
        contentRect: {
          width,
        },
      } as ResizeObserverEntry,
    ],
    {} as ResizeObserver,
  )
}

describe('useResponsiveTableMode', () => {
  beforeEach(() => {
    vi.stubGlobal('ResizeObserver', ResizeObserverMock)
  })

  it('maps widths into wide, compact and stacked buckets', () => {
    expect(resolveResponsiveTableMode(960)).toBe('wide')
    expect(resolveResponsiveTableMode(760)).toBe('compact')
    expect(resolveResponsiveTableMode(520)).toBe('stacked')
  })

  it('updates mode from observed container width', async () => {
    const wrapper = mount(
      defineComponent({
        setup() {
          const { containerRef, mode } = useResponsiveTableMode()
          return () => h('div', [h('div', { ref: containerRef, 'data-test': 'table-shell' }), h('span', { 'data-test': 'table-mode' }, mode.value)])
        },
      }),
    )

    await nextTick()
    triggerResize(720)
    await nextTick()
    expect(wrapper.get('[data-test="table-mode"]').text()).toBe('compact')

    triggerResize(560)
    await nextTick()
    expect(wrapper.get('[data-test="table-mode"]').text()).toBe('stacked')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
pnpm test:unit --run src/modules/shared/presentation/table/__tests__/useResponsiveTableMode.spec.ts
```

Expected: FAIL with missing module error for `useResponsiveTableMode`.

- [ ] **Step 3: Write minimal implementation**

```ts
import { computed, onBeforeUnmount, onMounted, ref, shallowRef, watch, type ComputedRef, type ShallowRef } from 'vue'

export type ResponsiveTableMode = 'wide' | 'compact' | 'stacked'

type ResponsiveTableModeOptions = {
  wideMin?: number
  compactMin?: number
}

const DEFAULT_WIDE_MIN = 56 * 16
const DEFAULT_COMPACT_MIN = 40 * 16

export const resolveResponsiveTableMode = (
  width: number,
  options: ResponsiveTableModeOptions = {},
): ResponsiveTableMode => {
  const wideMin = options.wideMin ?? DEFAULT_WIDE_MIN
  const compactMin = options.compactMin ?? DEFAULT_COMPACT_MIN

  if (width >= wideMin) return 'wide'
  if (width >= compactMin) return 'compact'
  return 'stacked'
}

export function useResponsiveTableMode(
  options: ResponsiveTableModeOptions = {},
): {
  containerRef: ShallowRef<HTMLElement | null>
  mode: ComputedRef<ResponsiveTableMode>
} {
  const containerRef = shallowRef<HTMLElement | null>(null)
  const containerWidth = ref(options.wideMin ?? DEFAULT_WIDE_MIN)
  let observer: ResizeObserver | null = null

  const observeElement = (element: HTMLElement | null) => {
    if (!observer || !element) return
    observer.observe(element)
  }

  const unobserveElement = (element: HTMLElement | null) => {
    if (!observer || !element) return
    observer.unobserve(element)
  }

  onMounted(() => {
    if (typeof ResizeObserver === 'undefined') return

    observer = new ResizeObserver((entries) => {
      const nextWidth = entries[0]?.contentRect.width
      if (typeof nextWidth === 'number') {
        containerWidth.value = nextWidth
      }
    })

    observeElement(containerRef.value)
  })

  watch(containerRef, (element, previous) => {
    unobserveElement(previous)
    observeElement(element)
  })

  onBeforeUnmount(() => {
    observer?.disconnect()
  })

  return {
    containerRef,
    mode: computed(() => resolveResponsiveTableMode(containerWidth.value, options)),
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
pnpm test:unit --run src/modules/shared/presentation/table/__tests__/useResponsiveTableMode.spec.ts
```

Expected: PASS with 2 tests passed.

- [ ] **Step 5: Commit**

```bash
git add src/modules/shared/presentation/table/useResponsiveTableMode.ts src/modules/shared/presentation/table/__tests__/useResponsiveTableMode.spec.ts
git commit -m "feat(shared): add responsive table mode hook"
```

### Task 4: Apply Responsive Table Modes To Approval Instance Page

**Files:**
- Modify: `src/modules/approval/presentation/approval/ApprovalInstancePage.vue`
- Test: `src/modules/approval/presentation/approval/__tests__/ApprovalInstancePage.spec.ts`

- [ ] **Step 1: Write the failing test**

Update `src/modules/approval/presentation/approval/__tests__/ApprovalInstancePage.spec.ts` with a table-mode mock and the three mode assertions:

```ts
const { tableModeRef } = vi.hoisted(() => ({
  tableModeRef: {
    value: 'wide' as 'wide' | 'compact' | 'stacked',
  },
}))

vi.mock('@/modules/shared/presentation/table/useResponsiveTableMode', () => ({
  useResponsiveTableMode: () => ({
    containerRef: { value: null },
    mode: tableModeRef,
  }),
}))

vi.mock('@/modules/shared/presentation/widget/MobilePrimarySecondaryText', () => ({
  default: defineComponent({
    name: 'MobilePrimarySecondaryText',
    props: {
      primary: {
        type: String,
        required: false,
      },
      secondary: {
        type: Array,
        required: false,
      },
    },
    setup(props) {
      return () =>
        h('div', {
          'data-test': 'mobile-primary-secondary',
          'data-primary': props.primary ?? '',
          'data-secondary': JSON.stringify(props.secondary ?? []),
        })
    },
  }),
}))
```

Replace the `NDataTable` mock body with one that exposes column keys and rendered cells:

```ts
return h('div', {
  'data-test': 'n-data-table',
  'data-loading': String(Boolean(props.loading)),
  'data-column-keys': columns.map((column) => String(column.key ?? '')).join(','),
}, [
  processColumn?.render ? h('div', { 'data-test': 'process-cell' }, [processColumn.render(rows[0]) as never]) : null,
  statusColumn?.render ? h('div', { 'data-test': 'status-cell' }, [statusColumn.render(rows[0]) as never]) : null,
  operateColumn?.render ? h('div', { 'data-test': 'operate-cell' }, [operateColumn.render(rows[0]) as never]) : null,
])
```

Add these tests:

```ts
it('keeps full columns in wide mode', () => {
  tableModeRef.value = 'wide'
  const wrapper = mount(ApprovalInstancePage)

  expect(wrapper.get('[data-test="n-data-table"]').attributes('data-column-keys')).toBe(
    'processName,nodeName,status,taskStatus,assigneeName,applicantName,createdTime,operate',
  )
})

it('uses compact columns and merges secondary fields into the primary cell', () => {
  tableModeRef.value = 'compact'
  const wrapper = mount(ApprovalInstancePage)

  expect(wrapper.get('[data-test="n-data-table"]').attributes('data-column-keys')).toBe(
    'processName,status,operate',
  )
  expect(wrapper.get('[data-test="mobile-primary-secondary"]').attributes('data-secondary')).toBe(
    JSON.stringify(['节点A', '申请人A', 'fmt:2026-01-01T10:00:00+08:00']),
  )
})

it('uses stacked columns and keeps the existing mobile summary grouping', () => {
  tableModeRef.value = 'stacked'
  const wrapper = mount(ApprovalInstancePage)

  expect(wrapper.get('[data-test="n-data-table"]').attributes('data-column-keys')).toBe(
    'processName,status,operate',
  )
  expect(wrapper.get('[data-test="mobile-primary-secondary"]').attributes('data-secondary')).toBe(
    JSON.stringify(['节点A · 申请人A', 'fmt:2026-01-01T10:00:00+08:00']),
  )
})
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
pnpm test:unit --run src/modules/approval/presentation/approval/__tests__/ApprovalInstancePage.spec.ts
```

Expected: FAIL because the page still uses `useIsMobile(768)` and has no `compact` mode.

- [ ] **Step 3: Write minimal implementation**

Update `src/modules/approval/presentation/approval/ApprovalInstancePage.vue`:

```ts
import { computed, h } from 'vue'
import { useResponsiveTableMode } from '@/modules/shared/presentation/table/useResponsiveTableMode'

const { containerRef: tableContainerRef, mode: tableMode } = useResponsiveTableMode()

const renderProcessSummary = (row: Row, mode: 'compact' | 'stacked') =>
  h(MobilePrimarySecondaryText, {
    primary: row.processName,
    secondary:
      mode === 'compact'
        ? [
            row.nodeName,
            formatApprovalUserName(row.applicantName),
            formatted(row.createdTime).standard,
          ]
        : [
            `${row.nodeName} · ${formatApprovalUserName(row.applicantName)}`,
            formatted(row.createdTime).standard,
          ],
  })

const renderStatusSummary = (row: Row) =>
  h('div', { class: 'min-w-0 flex flex-col gap-1.5' }, [
    h('div', { class: 'text-xs text-[var(--color-text-main)] truncate leading-5' }, [
      h(StatusTag(row.status, 'Instance')),
    ]),
    h('div', { class: 'text-xs text-[var(--color-text-light)] truncate leading-5' }, [
      h(StatusTag(row.taskStatus, 'Task', isApprovalFinish(row.status))),
    ]),
  ])

const wideColumns: DataTableColumns<Row> = [
  { title: $t('domain.approval.field.process'), key: 'processName' },
  { title: $t('domain.approval.field.nodeName'), key: 'nodeName' },
  { title: $t('common.label.status'), key: 'status', render: (row: Row) => h(StatusTag(row.status, 'Instance')) },
  { title: $t('common.label.status'), key: 'taskStatus', render: (row: Row) => h(StatusTag(row.taskStatus, 'Task', isApprovalFinish(row.status))) },
  { title: $t('domain.approval.field.approver'), key: 'assigneeName', render: (row: Row) => formatApprovalUserName(row.assigneeName) },
  { title: $t('domain.approval.field.applicant'), key: 'applicantName', render: (row: Row) => formatApprovalUserName(row.applicantName) },
  { title: $t('common.time.created'), key: 'createdTime', render: (row: Row) => formatted(row.createdTime).standard },
]

const compactColumns: DataTableColumns<Row> = [
  {
    title: $t('domain.approval.field.process'),
    key: 'processName',
    render: (row: Row) => renderProcessSummary(row, 'compact'),
  },
  {
    title: $t('common.label.status'),
    key: 'status',
    render: (row: Row) => renderStatusSummary(row),
  },
]

const stackedColumns: DataTableColumns<Row> = [
  {
    title: $t('domain.approval.field.process'),
    key: 'processName',
    render: (row: Row) => renderProcessSummary(row, 'stacked'),
  },
  {
    title: $t('common.label.status'),
    key: 'status',
    render: (row: Row) => renderStatusSummary(row),
  },
]

const columns = computed<DataTableColumns<Row>>(() => [
  ...(tableMode.value === 'wide'
    ? wideColumns
    : tableMode.value === 'compact'
      ? compactColumns
      : stackedColumns),
  {
    title: $t('common.action.operate'),
    key: 'operate',
    render: (row) => renderOperate(row),
  },
])
```

Wrap the table in the template:

```vue
<div ref="tableContainerRef">
  <n-data-table
    :bordered="false"
    :single-line="false"
    :columns="columns"
    :data="instanceQuery.data.value?.records || []"
    :pagination="pagination"
    :loading="instanceQuery.isLoading.value"
  />
</div>
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
pnpm test:unit --run src/modules/approval/presentation/approval/__tests__/ApprovalInstancePage.spec.ts
```

Expected: PASS with wide/compact/stacked mode assertions plus the existing search/approve/claim coverage.

- [ ] **Step 5: Commit**

```bash
git add src/modules/approval/presentation/approval/ApprovalInstancePage.vue src/modules/approval/presentation/approval/__tests__/ApprovalInstancePage.spec.ts
git commit -m "feat(approval): add responsive task table modes"
```

### Task 5: Run Integrated Verification

**Files:**
- Modify: none
- Test: `src/app/presentation/hooks/__tests__/useViewportMode.spec.ts`
- Test: `src/views/auth/__tests__/AuthLayoutViewTsx.spec.tsx`
- Test: `src/modules/shared/presentation/table/__tests__/useResponsiveTableMode.spec.ts`
- Test: `src/modules/approval/presentation/approval/__tests__/ApprovalInstancePage.spec.ts`

- [ ] **Step 1: Run focused unit tests**

Run:

```bash
pnpm test:unit --run \
  src/app/presentation/hooks/__tests__/useViewportMode.spec.ts \
  src/views/auth/__tests__/AuthLayoutViewTsx.spec.tsx \
  src/modules/shared/presentation/table/__tests__/useResponsiveTableMode.spec.ts \
  src/modules/approval/presentation/approval/__tests__/ApprovalInstancePage.spec.ts
```

Expected: PASS with all targeted tests green.

- [ ] **Step 2: Run repository check if focused tests pass cleanly**

Run:

```bash
pnpm check
```

Expected: PASS with formatting, lint and type-check all green. If `pnpm check` is too expensive during iteration, defer it to the final verification checkpoint but do not claim completion before it passes.

- [ ] **Step 3: Commit the verified implementation batch**

```bash
git add \
  src/app/presentation/hooks/useViewportMode.ts \
  src/app/presentation/hooks/__tests__/useViewportMode.spec.ts \
  src/views/auth/AuthLayoutView.tsx \
  src/views/auth/__tests__/AuthLayoutViewTsx.spec.tsx \
  src/modules/shared/presentation/table/useResponsiveTableMode.ts \
  src/modules/shared/presentation/table/__tests__/useResponsiveTableMode.spec.ts \
  src/modules/approval/presentation/approval/ApprovalInstancePage.vue \
  src/modules/approval/presentation/approval/__tests__/ApprovalInstancePage.spec.ts
git commit -m "feat(layout): add responsive approval table behavior"
```
