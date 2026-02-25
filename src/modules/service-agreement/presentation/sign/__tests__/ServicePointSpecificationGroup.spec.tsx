import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'

type MockDataColumn = {
  key?: string
  render?: (row: unknown, rowIndex: number) => unknown
}

const { messageErrorSpy, motivateSpsSpy } = vi.hoisted(() => ({
  messageErrorSpy: vi.fn(),
  motivateSpsSpy: vi.fn(),
}))

vi.mock('@/_utils/i18n', () => ({
  $t: vi.fn((key: string) => key),
}))

vi.mock('@/_utils/discrete_naive_api', () => ({
  message: {
    error: messageErrorSpy,
  },
}))

vi.mock('@/modules/service-agreement/presentation/sign/ServicePointSpecification', () => ({
  motivateSPS: motivateSpsSpy,
}))

vi.mock('naive-ui', () => ({
  NButton: defineComponent({
    name: 'NButton',
    props: {
      type: {
        type: String,
        required: false,
      },
      size: {
        type: String,
        required: false,
      },
    },
    emits: ['click'],
    setup(props, { emit, slots }) {
      return () =>
        h(
          'button',
          {
            'data-test': 'n-button',
            'data-type': props.type ?? '',
            'data-size': props.size ?? '',
            onClick: () => emit('click'),
          },
          slots.default?.(),
        )
    },
  }),
  NFlex: defineComponent({
    name: 'NFlex',
    setup(_, { slots }) {
      return () => h('div', { 'data-test': 'n-flex' }, slots.default?.())
    },
  }),
  NDataTable: defineComponent({
    name: 'NDataTable',
    props: {
      data: {
        type: Array,
        required: false,
      },
      columns: {
        type: Array,
        required: false,
      },
    },
    setup(props) {
      return () => {
        const columns = (props.columns || []) as MockDataColumn[]
        return h(
          'div',
          { 'data-test': 'n-data-table' },
          (props.data || []).map((row, rowIndex) =>
            h(
              'div',
              {
                'data-test': 'n-data-row',
                'data-row-index': String(rowIndex),
              },
              columns.map((column, columnIndex) => {
                if (typeof column?.render === 'function') {
                  return h(
                    'div',
                    {
                      'data-test': 'n-data-render-cell',
                      'data-col-index': String(columnIndex),
                    },
                    [column.render(row, rowIndex) as never],
                  )
                }

                return h(
                  'div',
                  {
                    'data-test': 'n-data-cell',
                    'data-col-index': String(columnIndex),
                  },
                  String(
                    typeof column?.key === 'string'
                      ? (row as Record<string, unknown>)[column.key] ?? ''
                      : '',
                  ),
                )
              }),
            ),
          ),
        )
      }
    },
  }),
}))

import ServicePointSpecificationGroup from '@/modules/service-agreement/presentation/sign/ServicePointSpecificationGroup'
import { UsageCategoryEnum } from '@/modules/service-agreement/application/constants'
import type { ServicePointSpecification } from '@/modules/service-agreement/application/models'

const createSps = (serviceAccount: string): ServicePointSpecification => ({
  id: serviceAccount === 'A001' ? 1 : 2,
  agreementId: 100,
  serviceAccount,
  transformerCapacity: 100,
  electricityConsumptionType:
    UsageCategoryEnum.LargeIndustrial as ServicePointSpecification['electricityConsumptionType'],
  voltageClass: '10 kV',
})

describe('ServicePointSpecificationGroup', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('adds new service point when motivate callback returns unique account', async () => {
    const wrapper = mount(ServicePointSpecificationGroup, {
      props: {
        value: [createSps('A001')],
      },
    })

    const addBtn = wrapper
      .findAll('[data-test="n-button"]')
      .find((node) => node.text().includes('common.action.add'))
    expect(addBtn).toBeTruthy()

    await addBtn!.trigger('click')

    expect(motivateSpsSpy).toHaveBeenCalledTimes(1)
    const callback = motivateSpsSpy.mock.calls[0][0] as (formValue: ReturnType<typeof createSps>) => boolean

    const result = callback(createSps('A002'))
    expect(result).toBe(true)

    const emitted = wrapper.emitted('update:value') || []
    expect(emitted.length).toBe(1)

    const payload = emitted[0][0] as Array<Record<string, unknown>>
    expect(payload).toHaveLength(2)
    expect(payload[1].serviceAccount).toBe('A002')
    expect(messageErrorSpy).not.toHaveBeenCalled()
  })

  it('rejects duplicate service account and shows error', async () => {
    const wrapper = mount(ServicePointSpecificationGroup, {
      props: {
        value: [createSps('A001')],
      },
    })

    const addBtn = wrapper
      .findAll('[data-test="n-button"]')
      .find((node) => node.text().includes('common.action.add'))

    await addBtn!.trigger('click')

    const callback = motivateSpsSpy.mock.calls[0][0] as (formValue: ReturnType<typeof createSps>) => boolean
    const result = callback(createSps('A001'))

    expect(result).toBe(false)
    expect(messageErrorSpy).toHaveBeenCalledTimes(1)
    expect(messageErrorSpy).toHaveBeenCalledWith('domain.servicePoint.validation.duplicate')
    expect(wrapper.emitted('update:value')).toBeUndefined()
  })

  it('deletes row item when delete button is clicked', async () => {
    const wrapper = mount(ServicePointSpecificationGroup, {
      props: {
        value: [createSps('A001'), createSps('A002')],
      },
    })

    const deleteBtn = wrapper
      .findAll('[data-test="n-button"]')
      .find((node) => node.text().includes('common.action.delete'))
    expect(deleteBtn).toBeTruthy()

    await deleteBtn!.trigger('click')

    const emitted = wrapper.emitted('update:value') || []
    expect(emitted.length).toBe(1)

    const payload = emitted[0][0] as Array<Record<string, unknown>>
    expect(payload).toHaveLength(1)
    expect(payload[0].serviceAccount).toBe('A002')
  })
})
