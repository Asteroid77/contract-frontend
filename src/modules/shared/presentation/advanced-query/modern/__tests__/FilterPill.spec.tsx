import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import FilterPill from '@/modules/shared/presentation/advanced-query/modern/FilterPill'
import { FieldType } from '@/modules/shared/domain/advanced-query'
import { FilterOp } from '@/modules/shared/domain/query'

vi.mock('@/_utils/i18n', () => ({
  $t: (key: string) => `t:${key}`,
  $te: () => false,
}))

vi.mock('@/modules/shared/presentation/widget/PCACascader', () => ({
  default: defineComponent({
    name: 'PCACascader',
    props: {
      value: { type: String, required: false },
    },
    setup(props, { attrs }) {
      return () =>
        h(
          'button',
          {
            'data-test': 'mock-pca-cascader',
            onClick: () => {
              const handler = attrs['onUpdate:value'] as ((value: string) => void) | undefined
              handler?.('330100')
            },
          },
          props.value ?? 'empty',
        )
    },
  }),
}))

const baseFields = [
  { key: 'name', labelKey: 'field.name', type: FieldType.STRING },
  { key: 'age', labelKey: 'field.age', type: FieldType.NUMBER },
  { key: 'enabled', labelKey: 'field.enabled', type: FieldType.BOOLEAN },
  {
    key: 'status',
    labelKey: 'field.status',
    type: FieldType.ENUM,
    options: [
      { label: 'option.active', value: 'active' },
      { label: 'option.inactive', value: 'inactive' },
    ],
  },
  {
    key: 'companyArea',
    labelKey: 'field.companyArea',
    type: FieldType.PCA,
    operators: [FilterOp.EQ],
  },
]

const restrictedFields = [
  {
    key: 'name',
    labelKey: 'field.name',
    type: FieldType.STRING,
    operators: [FilterOp.EQ, FilterOp.LIKE],
  },
  {
    key: 'age',
    labelKey: 'field.age',
    type: FieldType.NUMBER,
    operators: [FilterOp.GE],
  },
]

describe('FilterPill', () => {
  it('renders translated field/operator and value text', () => {
    const wrapper = mount(FilterPill, {
      props: {
        condition: {
          field: 'name',
          op: FilterOp.EQ,
          value: 'Alice',
        },
        fields: baseFields,
        onUpdate: vi.fn(),
        onRemove: vi.fn(),
      },
    })

    expect(wrapper.text()).toContain('t:field.name')
    expect(wrapper.text()).toContain('t:common.advancedQuery.operator.eq')
    expect(wrapper.text()).toContain('Alice')
  })

  it('hides value button when operator does not require value', () => {
    const wrapper = mount(FilterPill, {
      props: {
        condition: {
          field: 'name',
          op: FilterOp.IS_NULL,
          value: 'ignored',
        },
        fields: baseFields,
        onUpdate: vi.fn(),
        onRemove: vi.fn(),
      },
    })

    expect(wrapper.find('[data-test="filter-pill-value-button"]').exists()).toBe(false)
  })

  it('calls onUpdate with undefined value when field changes', async () => {
    const onUpdate = vi.fn()
    const wrapper = mount(FilterPill, {
      props: {
        condition: {
          field: 'name',
          op: FilterOp.EQ,
          value: 'Alice',
        },
        fields: baseFields,
        onUpdate,
        onRemove: vi.fn(),
      },
    })

    await wrapper.findAll('button')[0]?.trigger('click')
    await wrapper
      .findAll('button')
      .find((button) => button.text() === 't:field.age')
      ?.trigger('click')

    expect(onUpdate).toHaveBeenCalledWith({
      field: 'age',
      op: FilterOp.EQ,
      value: undefined,
    })
  })

  it('resets value shape when operator switches to BETWEEN', async () => {
    const onUpdate = vi.fn()
    const wrapper = mount(FilterPill, {
      props: {
        condition: {
          field: 'age',
          op: FilterOp.EQ,
          value: 18,
        },
        fields: baseFields,
        onUpdate,
        onRemove: vi.fn(),
      },
    })

    await wrapper.findAll('button')[1]?.trigger('click')
    await wrapper
      .findAll('button')
      .find((button) => button.text() === 't:common.advancedQuery.operator.between')
      ?.trigger('click')

    expect(onUpdate).toHaveBeenCalledWith({
      field: 'age',
      op: FilterOp.BETWEEN,
      value: [undefined, undefined],
    })
  })

  it('calls onRemove when delete button is clicked', async () => {
    const onRemove = vi.fn()
    const wrapper = mount(FilterPill, {
      props: {
        condition: {
          field: 'name',
          op: FilterOp.EQ,
          value: 'Alice',
        },
        fields: baseFields,
        onUpdate: vi.fn(),
        onRemove,
      },
    })

    await wrapper.get('button[aria-label="t:common.action.delete"]').trigger('click')

    expect(onRemove).toHaveBeenCalledTimes(1)
  })

  it('shows only field configured operators in operator menu', async () => {
    const wrapper = mount(FilterPill, {
      props: {
        condition: {
          field: 'name',
          op: FilterOp.EQ,
          value: 'Alice',
        },
        fields: restrictedFields,
        onUpdate: vi.fn(),
        onRemove: vi.fn(),
      },
    })

    await wrapper.findAll('button')[1]?.trigger('click')

    const buttons = wrapper.findAll('button')
    expect(buttons.some((button) => button.text() === 't:common.advancedQuery.operator.eq')).toBe(
      true,
    )
    expect(buttons.some((button) => button.text() === 't:common.advancedQuery.operator.like')).toBe(
      true,
    )
    expect(
      buttons.some((button) => button.text() === 't:common.advancedQuery.operator.notLike'),
    ).toBe(false)
  })

  it('switches to first allowed operator when current operator is not allowed by next field', async () => {
    const onUpdate = vi.fn()
    const wrapper = mount(FilterPill, {
      props: {
        condition: {
          field: 'name',
          op: FilterOp.LIKE,
          value: 'Alice',
        },
        fields: restrictedFields,
        onUpdate,
        onRemove: vi.fn(),
      },
    })

    await wrapper.findAll('button')[0]?.trigger('click')
    await wrapper
      .findAll('button')
      .find((button) => button.text() === 't:field.age')
      ?.trigger('click')

    expect(onUpdate).toHaveBeenCalledWith({
      field: 'age',
      op: FilterOp.GE,
      value: undefined,
    })
  })

  it('renders NSelect for ENUM single-value operator', async () => {
    const wrapper = mount(FilterPill, {
      props: {
        condition: {
          field: 'status',
          op: FilterOp.EQ,
          value: 'active',
        },
        fields: baseFields,
        onUpdate: vi.fn(),
        onRemove: vi.fn(),
      },
    })

    await wrapper.get('[data-test="filter-pill-value-button"]').trigger('click')

    expect(wrapper.find('.n-base-selection').exists()).toBe(true)
    expect(wrapper.find('.max-h-32.overflow-y-auto').exists()).toBe(false)
  })

  it('renders NSelect in multiple mode for ENUM IN operator', async () => {
    const wrapper = mount(FilterPill, {
      props: {
        condition: {
          field: 'status',
          op: FilterOp.IN,
          value: ['active'],
        },
        fields: baseFields,
        onUpdate: vi.fn(),
        onRemove: vi.fn(),
      },
    })

    await wrapper.get('[data-test="filter-pill-value-button"]').trigger('click')

    expect(wrapper.find('.n-base-selection').exists()).toBe(true)
    expect(wrapper.find('.max-h-40.overflow-y-auto').exists()).toBe(false)
  })

  it('renders PCACascader for PCA field and updates value', async () => {
    const onUpdate = vi.fn()
    const wrapper = mount(FilterPill, {
      props: {
        condition: {
          field: 'companyArea',
          op: FilterOp.EQ,
          value: '110000',
        },
        fields: baseFields,
        onUpdate,
        onRemove: vi.fn(),
      },
    })

    await wrapper.get('[data-test="filter-pill-value-button"]').trigger('click')
    expect(wrapper.find('[data-test="mock-pca-cascader"]').exists()).toBe(true)

    await wrapper.get('[data-test="mock-pca-cascader"]').trigger('click')
    expect(onUpdate).toHaveBeenCalledWith({
      field: 'companyArea',
      op: FilterOp.EQ,
      value: '330100',
    })
  })
})
