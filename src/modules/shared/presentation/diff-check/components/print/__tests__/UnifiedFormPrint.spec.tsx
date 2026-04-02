import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'
import UnifiedFormPrint from '@/modules/shared/presentation/diff-check/components/print/UnifiedFormPrint'
import type {
  FieldDefinition,
  FormData,
} from '@/modules/shared/presentation/diff-check/domain/types/field'

vi.mock('@/_utils/i18n', () => ({
  $t: (key: string) => `t:${key}`,
}))

vi.mock('naive-ui', () => ({
  NQrCode: defineComponent({
    name: 'MockNQrCode',
    props: {
      value: { type: String, required: true },
      size: { type: Number, required: false },
      padding: { type: Number, required: false },
      type: { type: String, required: false },
    },
    setup(props) {
      return () =>
        h('div', {
          'data-test': 'NQrCode',
          'data-value': props.value,
          'data-size': String(props.size ?? ''),
          'data-padding': String(props.padding ?? ''),
          'data-type': props.type,
        })
    },
  }),
}))

vi.mock('@/modules/shared/presentation/diff-check/components/unified/UnifiedFormTable', () => ({
  default: defineComponent({
    name: 'MockUnifiedFormTable',
    props: {
      variant: { type: String, required: false },
      fields: { type: Array, required: true },
      data: { type: Object, required: true },
      oldData: { type: Object, required: false, default: null },
      showOnlyChanged: { type: Boolean, required: false },
      columnCount: { type: Number, required: false },
      expandAllLists: { type: Boolean, required: false },
      disableListToggle: { type: Boolean, required: false },
    },
    setup() {
      return () => h('div', { 'data-test': 'UnifiedFormTable' })
    },
  }),
}))

describe('UnifiedFormPrint', () => {
  const fields: FieldDefinition[] = [{ key: 'name', label: '姓名' }]
  const data: FormData = { name: 'Alice' }
  const oldData: FormData = { name: 'Bob' }

  it('renders title, docNo, legend and qrcode with preview url', () => {
    const wrapper = mount(UnifiedFormPrint, {
      props: {
        title: '审批单打印',
        docNo: 'DOC-001',
        previewUrl: 'https://example.com/preview/1',
        fields,
        data,
        oldData,
      },
    })

    expect(wrapper.text()).toContain('审批单打印')
    expect(wrapper.text()).toContain('DOC-001')
    expect(wrapper.text()).toContain('t:common.diffCheck.print.docNo')
    expect(wrapper.text()).toContain('t:common.diffCheck.print.generatedAt')
    expect(wrapper.text()).toContain('t:common.diffCheck.print.legend.title')
    expect(wrapper.text()).toContain('t:common.diffCheck.print.legend.addedItem')
    expect(wrapper.text()).toContain('t:common.diffCheck.print.legend.removedItem')

    const qr = wrapper.find('[data-test="NQrCode"]')
    expect(qr.exists()).toBe(true)
    expect(qr.attributes('data-value')).toBe('https://example.com/preview/1')
    expect(qr.attributes('data-size')).toBe('60')
    expect(qr.attributes('data-padding')).toBe('0')
    expect(qr.attributes('data-type')).toBe('svg')

    const table = wrapper.findComponent({ name: 'MockUnifiedFormTable' })
    expect(table.exists()).toBe(true)
    expect(table.props('variant')).toBe('print')
    expect(table.props('fields')).toEqual(fields)
    expect(table.props('data')).toEqual(data)
    expect(table.props('oldData')).toEqual(oldData)
    expect(table.props('showOnlyChanged')).toBe(false)
    expect(table.props('columnCount')).toBe(2)
    expect(table.props('expandAllLists')).toBe(true)
    expect(table.props('disableListToggle')).toBe(true)
  })

  it('uses dash when docNo is empty and oldData defaults to null', () => {
    const wrapper = mount(UnifiedFormPrint, {
      props: {
        title: '审批单打印',
        previewUrl: 'https://example.com/preview/2',
        fields,
        data,
      },
    })

    expect(wrapper.text()).toContain('—')

    const table = wrapper.findComponent({ name: 'MockUnifiedFormTable' })
    expect(table.exists()).toBe(true)
    expect(table.props('oldData')).toBe(null)
  })
})
