import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import FilterPill from '@/modules/shared/presentation/advanced-query/modern/FilterPill'
import { FieldType } from '@/modules/shared/domain/advanced-query'
import { FilterOp } from '@/modules/shared/domain/query'

vi.mock('@/_utils/i18n', () => ({
  $t: (key: string) => `t:${key}`,
  $te: () => false,
}))

const baseFields = [
  { key: 'name', labelKey: 'field.name', type: FieldType.STRING },
  { key: 'age', labelKey: 'field.age', type: FieldType.NUMBER },
  { key: 'enabled', labelKey: 'field.enabled', type: FieldType.BOOLEAN },
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

    expect(wrapper.find('button.max-w-24').exists()).toBe(false)
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
    await wrapper.findAll('button').find((button) => button.text() === 't:field.age')?.trigger('click')

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
    expect(
      buttons.some((button) => button.text() === 't:common.advancedQuery.operator.eq'),
    ).toBe(true)
    expect(
      buttons.some((button) => button.text() === 't:common.advancedQuery.operator.like'),
    ).toBe(true)
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
})
