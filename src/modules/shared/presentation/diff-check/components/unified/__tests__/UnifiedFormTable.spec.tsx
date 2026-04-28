import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import UnifiedFormTable from '@/modules/shared/presentation/diff-check/components/unified/UnifiedFormTable'
import type {
  FieldDefinition,
  FormData,
} from '@/modules/shared/presentation/diff-check/domain/types/field'

vi.mock('@/_utils/i18n', () => ({
  $t: (key: string, params?: Record<string, unknown>) => {
    if (params && 'count' in params) {
      return `t:${key}:${String(params.count)}`
    }
    return `t:${key}`
  },
}))

vi.mock('naive-ui', () => {
  const passthrough = (name: string) =>
    defineComponent({
      name: `Mock${name}`,
      props: {
        show: {
          type: Boolean,
          required: false,
        },
      },
      setup(props, { slots }) {
        return () => {
          if (name === 'NModal' && !props.show) {
            return null
          }
          return h('div', { 'data-test': name }, slots.default?.())
        }
      },
    })

  return {
    NButton: passthrough('NButton'),
    NCard: passthrough('NCard'),
    NImageGroup: passthrough('NImageGroup'),
    NModal: passthrough('NModal'),
    NSpin: passthrough('NSpin'),
    NImage: defineComponent({
      name: 'MockNImage',
      props: {
        src: { type: String, required: false },
        alt: { type: String, required: false },
      },
      setup(props) {
        return () => h('img', { 'data-test': 'NImage', src: props.src, alt: props.alt })
      },
    }),
  }
})

vi.mock('@/modules/shared/presentation/diff-check/components/unified/InlineDiffValue', () => ({
  default: defineComponent({
    name: 'MockInlineDiffValue',
    props: {
      oldValue: { type: [String, Number, Boolean, Array, Object], required: false },
      newValue: { type: [String, Number, Boolean, Array, Object], required: false },
      diffType: { type: String, required: true },
      showOldValue: { type: Boolean, required: false },
    },
    setup(props) {
      return () =>
        h(
          'span',
          { 'data-test': 'inline-diff' },
          `${props.diffType}:${String(props.oldValue ?? '')}->${String(props.newValue ?? '')}`,
        )
    },
  }),
}))

const buildListField = (): FieldDefinition => ({
  key: 'contacts',
  label: '联系人',
  type: 'list',
  children: [{ key: 'name', label: '姓名' }],
})

describe('UnifiedFormTable', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it('renders normal field value and empty placeholder in non-diff mode', () => {
    const fields: FieldDefinition[] = [
      { key: 'name', label: '姓名' },
      { key: 'remark', label: '备注' },
    ]
    const data: FormData = {
      name: 'Alice',
      remark: '',
    }

    const wrapper = mount(UnifiedFormTable, {
      props: {
        fields,
        data,
      },
    })

    expect(wrapper.text()).toContain('姓名')
    expect(wrapper.text()).toContain('Alice')
    expect(wrapper.text()).toContain('备注')
    expect(wrapper.text()).toContain('t:common.label.empty')
  })

  it('filters unchanged non-list fields when showOnlyChanged is true in diff mode', () => {
    const fields: FieldDefinition[] = [
      { key: 'name', label: '姓名' },
      { key: 'age', label: '年龄' },
    ]

    const wrapper = mount(UnifiedFormTable, {
      props: {
        fields,
        data: {
          name: 'Alice',
          age: 20,
        } as FormData,
        oldData: {
          name: 'Alice',
          age: 18,
        } as FormData,
        showOnlyChanged: true,
      },
    })

    expect(wrapper.text()).toContain('年龄')
    expect(wrapper.text()).not.toContain('姓名')
    expect(wrapper.findAll('[data-test="inline-diff"]').length).toBeGreaterThan(0)
  })

  it('shows list diff summary badges for added and modified items', () => {
    const fields: FieldDefinition[] = [buildListField()]

    const wrapper = mount(UnifiedFormTable, {
      props: {
        fields,
        data: {
          contacts: [
            { id: 1, name: 'A-NEW' },
            { id: 2, name: 'B' },
          ],
        } as FormData,
        oldData: {
          contacts: [{ id: 1, name: 'A-OLD' }],
        } as FormData,
      },
    })

    expect(wrapper.find('.badge--added').text()).toBe('+1')
    expect(wrapper.find('.badge--modified').text()).toBe('~1')
    expect(wrapper.text()).toContain('t:common.label.totalItems:2')
  })

  it('respects disableListToggle and keeps list expanded after click', async () => {
    const fields: FieldDefinition[] = [buildListField()]

    const wrapper = mount(UnifiedFormTable, {
      props: {
        fields,
        data: {
          contacts: [{ id: 1, name: 'A' }],
        } as FormData,
        expandAllLists: true,
        disableListToggle: true,
      },
    })

    expect(wrapper.find('.list-expand-row').exists()).toBe(true)

    await wrapper.find('.list-summary').trigger('click')
    await nextTick()

    expect(wrapper.find('.list-expand-row').exists()).toBe(true)
  })

  it('collapses list when toggle is enabled', async () => {
    const fields: FieldDefinition[] = [buildListField()]

    const wrapper = mount(UnifiedFormTable, {
      props: {
        fields,
        data: {
          contacts: [{ id: 1, name: 'A' }],
        } as FormData,
        expandAllLists: true,
        disableListToggle: false,
      },
    })

    expect(wrapper.find('.list-expand-row').exists()).toBe(true)

    await wrapper.find('.list-summary').trigger('click')
    await nextTick()

    expect(wrapper.find('.list-expand-row').exists()).toBe(false)
  })

  it('does not open text preview or keep href for disallowed accessUrl', async () => {
    const fields: FieldDefinition[] = [{ key: 'attachment', label: '附件', type: 'file' }]

    const wrapper = mount(UnifiedFormTable, {
      props: {
        fields,
        data: {
          attachment: [
            {
              id: 1,
              fileName: 'note.txt',
              fileType: 'txt',
              fileSize: 8,
              ossObjectKey: 'note.txt',
              accessUrl: 'https://evil.example/note.txt',
            },
          ],
        } as FormData,
      },
    })

    const link = wrapper.get('.file-name')
    expect(link.attributes('href')).toBeUndefined()

    await link.trigger('click')
    await nextTick()

    expect(fetch).not.toHaveBeenCalled()
    expect(wrapper.find('[data-test="NModal"]').exists()).toBe(false)
  })
})
