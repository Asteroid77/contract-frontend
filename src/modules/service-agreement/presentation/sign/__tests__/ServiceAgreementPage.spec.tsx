import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import { mount } from '@vue/test-utils'

vi.mock('@/_utils/i18n', () => ({
  $t: vi.fn((key: string) => key),
}))

vi.mock('naive-ui', () => ({
  NDataTable: defineComponent({
    name: 'NDataTable',
    props: {
      columns: {
        type: Array,
        required: false,
      },
      data: {
        type: Array,
        required: false,
      },
      pagination: {
        type: Object,
        required: false,
      },
      loading: {
        type: Boolean,
        required: false,
      },
      bordered: {
        type: Boolean,
        required: false,
      },
    },
    setup(props, { slots }) {
      return () => {
        const columns = (props.columns || []) as Array<Record<string, unknown>>
        const rows = (props.data || []) as Array<Record<string, unknown>>
        const firstRow = rows[0]

        const areaColumn = columns.find((col) => col.key === 'companyArea') as
          | { render?: (row: Record<string, unknown>) => unknown }
          | undefined
        const statusColumn = columns.find((col) => col.key === 'status') as
          | { render?: (row: Record<string, unknown>) => unknown }
          | undefined
        const operateColumn = columns.find((col) => col.key === 'operate') as
          | { render?: (row: Record<string, unknown>) => unknown }
          | undefined

        const area = firstRow && areaColumn?.render ? String(areaColumn.render(firstRow)) : ''
        const status = firstRow && statusColumn?.render ? String(statusColumn.render(firstRow)) : ''

        return h(
          'div',
          {
            'data-test': 'n-data-table',
            'data-columns-len': String(columns.length),
            'data-loading': String(Boolean(props.loading)),
            'data-area': area,
            'data-status': status,
            'data-bordered': String(Boolean(props.bordered)),
            'data-page': String((props.pagination as { page?: number } | undefined)?.page ?? ''),
          },
          [
            rows.length === 0 ? slots.empty?.() : null,
            operateColumn?.render && firstRow
              ? h('div', { 'data-test': 'operate-cell' }, [operateColumn.render(firstRow) as never])
              : null,
          ],
        )
      }
    },
  }),
}))

import ServiceAgreementPage from '@/modules/service-agreement/presentation/sign/ServiceAgreementPage'
import { ServiceAgreementStatusEnum } from '@/modules/service-agreement/application/constants'

const rows = [
  {
    id: 1,
    companyName: 'Acme',
    companyArea: '110000',
    status: ServiceAgreementStatusEnum.Record,
    yearUsableCharge: 120,
    expirationTime: '2026-12-31 00:00:00',
  },
]

const setViewportWidth = (width: number) => {
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    writable: true,
    value: width,
  })
  window.dispatchEvent(new Event('resize'))
}

describe('ServiceAgreementPage', () => {
  beforeEach(() => {
    setViewportWidth(1280)
  })

  it('builds default columns and renders lookup values', () => {
    const wrapper = mount(ServiceAgreementPage, {
      props: {
        data: rows,
        pagination: {
          page: 3,
        },
        loading: true,
      },
    })

    const table = wrapper.get('[data-test="n-data-table"]')
    expect(table.attributes('data-columns-len')).toBe('5')
    expect(table.attributes('data-loading')).toBe('true')
    expect(table.attributes('data-page')).toBe('3')

    expect(table.attributes('data-area')).toBe('北京市')
    expect(table.attributes('data-status')).toBe('domain.agreement.status.filing')
    expect(wrapper.find('[data-test="operate-cell"]').exists()).toBe(false)
  })

  it('adds operate column when actions slot exists', () => {
    const wrapper = mount(ServiceAgreementPage, {
      props: {
        data: rows,
      },
      slots: {
        actions: (row) =>
          h('span', { 'data-test': 'action-slot' }, String((row as { id: number }).id)),
      },
    })

    const table = wrapper.get('[data-test="n-data-table"]')
    expect(table.attributes('data-columns-len')).toBe('6')

    const action = wrapper.get('[data-test="action-slot"]')
    expect(action.text()).toBe('1')
  })

  it('forwards empty slot into data table when no rows', () => {
    const wrapper = mount(ServiceAgreementPage, {
      props: {
        data: [],
      },
      slots: {
        empty: () => h('div', { 'data-test': 'empty-slot' }, 'empty'),
      },
    })

    expect(wrapper.get('[data-test="empty-slot"]').text()).toBe('empty')
  })

  it('uses compact columns on mobile viewport', async () => {
    setViewportWidth(375)

    const wrapper = mount(ServiceAgreementPage, {
      props: {
        data: rows,
      },
      slots: {
        actions: (row) =>
          h('span', { 'data-test': 'action-slot' }, String((row as { id: number }).id)),
      },
    })

    await nextTick()

    const table = wrapper.get('[data-test="n-data-table"]')
    expect(table.attributes('data-columns-len')).toBe('3')
    expect(table.attributes('data-area')).toBe('')
  })
})
