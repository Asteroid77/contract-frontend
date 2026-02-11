import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import ModernQueryBuilder from '@/modules/shared/presentation/advanced-query/modern/ModernQueryBuilder'
import { FieldType } from '@/modules/shared/domain/advanced-query'
import { FilterOp, QueryLogic } from '@/modules/shared/domain/query'

vi.mock('@/_utils/i18n', () => ({
  $t: (key: string) => key,
}))

vi.mock('@/modules/shared/presentation/advanced-query/modern/FilterPill', () => ({
  default: defineComponent({
    name: 'MockFilterPill',
    props: {
      condition: {
        type: Object,
        required: true,
      },
      fields: {
        type: Array,
        required: true,
      },
      onUpdate: {
        type: Function,
        required: true,
      },
      onRemove: {
        type: Function,
        required: true,
      },
    },
    setup(props) {
      return () =>
        h('div', { 'data-test': 'filter-pill' }, [
          h('span', { 'data-test': 'filter-pill-text' }, `${(props.condition as any).field}:${(props.condition as any).op}`),
          h('input', { 'data-test': 'pill-input' }),
          h(
            'button',
            {
              type: 'button',
              'data-test': 'pill-remove',
              onClick: () => (props.onRemove as any)?.(),
            },
            'remove',
          ),
        ])
    },
  }),
}))

const fields = [
  { key: 'name', labelKey: 'field.name', type: FieldType.STRING },
  { key: 'age', labelKey: 'field.age', type: FieldType.NUMBER },
]

describe('ModernQueryBuilder', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('renders empty hint when no conditions', () => {
    const wrapper = mount(ModernQueryBuilder, {
      props: {
        fields,
      },
    })

    expect(wrapper.text()).toContain('common.advancedQuery.hint.empty')
    expect(wrapper.findAll('[data-test="filter-pill"]').length).toBe(0)
  })

  it('adds root filter via menu and emits change/update:query', async () => {
    const wrapper = mount(ModernQueryBuilder, {
      props: {
        fields,
      },
    })

    const addFilterButton = wrapper
      .findAll('button')
      .find((button) => button.text().includes('common.advancedQuery.action.filter'))
    expect(addFilterButton).toBeDefined()

    await addFilterButton!.trigger('click')

    const chooseNameFieldBtn = wrapper.findAll('button').find((button) => button.text() === 'field.name')
    expect(chooseNameFieldBtn).toBeDefined()

    await chooseNameFieldBtn!.trigger('click')

    expect(wrapper.findAll('[data-test="filter-pill"]').length).toBe(1)

    const changeEmits = wrapper.emitted('change')
    const updateEmits = wrapper.emitted('update:query')

    expect(changeEmits?.length).toBeGreaterThan(0)
    expect(updateEmits?.length).toBeGreaterThan(0)

    const latestChange = changeEmits?.[changeEmits.length - 1]?.[0]
    const latestUpdate = updateEmits?.[updateEmits.length - 1]?.[0]

    expect(latestChange).toEqual({
      filters: [
        {
          field: 'name',
          op: FilterOp.EQ,
          value: undefined,
        },
      ],
    })
    expect(latestUpdate).toEqual(latestChange)
  })

  it('adds group then clear all emits reset with empty query', async () => {
    const wrapper = mount(ModernQueryBuilder, {
      props: {
        fields,
      },
    })

    const addFilterButton = wrapper
      .findAll('button')
      .find((button) => button.text().includes('common.advancedQuery.action.filter'))
    expect(addFilterButton).toBeDefined()

    await addFilterButton!.trigger('click')

    const addGroupBtn = wrapper
      .findAll('button')
      .find((button) => button.text().includes('common.advancedQuery.action.addGroup'))
    expect(addGroupBtn).toBeDefined()

    await addGroupBtn!.trigger('click')

    const clearBtn = wrapper
      .findAll('button')
      .find((button) => button.text().includes('common.advancedQuery.action.clear'))
    expect(clearBtn).toBeDefined()

    await clearBtn!.trigger('click')

    const resetEmits = wrapper.emitted('reset')
    expect(resetEmits?.length).toBeGreaterThan(0)
    expect(resetEmits?.[resetEmits.length - 1]?.[0]).toEqual({})
    expect(wrapper.text()).toContain('common.advancedQuery.hint.empty')
  })

  it('syncs state when query prop changes and can be cleared by external query', async () => {
    const wrapper = mount(ModernQueryBuilder, {
      props: {
        fields,
        query: {
          filters: [
            {
              field: 'name',
              op: FilterOp.EQ,
              value: 'Alice',
            },
          ],
        },
      },
    })

    expect(wrapper.text()).toContain('name:EQ')

    await wrapper.setProps({
      query: {
        filters: [
          {
            field: 'age',
            op: FilterOp.GE,
            value: 18,
          },
        ],
        group: {
          logic: QueryLogic.OR,
          filters: [],
          groups: [],
        },
      },
    })

    await nextTick()

    expect(wrapper.text()).toContain('age:GE')
    expect(wrapper.text()).not.toContain('name:EQ')

    await wrapper.setProps({ query: {} })
    await nextTick()

    expect(wrapper.findAll('[data-test="filter-pill"]').length).toBe(0)
    expect(wrapper.text()).toContain('common.advancedQuery.hint.empty')
  })

  it('emits search when Enter is pressed from input element', async () => {
    const wrapper = mount(ModernQueryBuilder, {
      props: {
        fields,
        query: {
          filters: [
            {
              field: 'name',
              op: FilterOp.EQ,
              value: 'Alice',
            },
          ],
        },
      },
    })

    const input = wrapper.get('[data-test="pill-input"]')
    await input.trigger('keydown', { key: 'Enter' })

    const searchEmits = wrapper.emitted('search')
    expect(searchEmits?.length).toBeGreaterThan(0)

    expect(searchEmits?.[searchEmits.length - 1]?.[0]).toEqual({
      filters: [
        {
          field: 'name',
          op: FilterOp.EQ,
          value: 'Alice',
        },
      ],
    })
  })
})
