import { describe, expect, it, vi } from 'vitest'
import { defineAsyncComponent, defineComponent, h, nextTick, type Component } from 'vue'
import { mount } from '@vue/test-utils'
import WorkOrderReplyEditor from '@/modules/work-order/presentation/WorkOrderReplyEditor'

vi.mock('naive-ui', () => ({
  NCard: defineComponent({
    name: 'NCard',
    setup(_, { slots }) {
      return () => h('section', { 'data-test': 'reply-editor-card' }, slots.default?.())
    },
  }),
  NSpace: defineComponent({
    name: 'NSpace',
    setup(_, { slots }) {
      return () => h('div', { 'data-test': 'reply-editor-space' }, slots.default?.())
    },
  }),
  NSpin: defineComponent({
    name: 'NSpin',
    setup(_, { slots }) {
      return () => h('div', { 'data-test': 'reply-editor-spin' }, slots.default?.())
    },
  }),
}))

const uploadHandler = vi.fn()

const createAsyncEditor = () =>
  defineAsyncComponent(
    () =>
      new Promise<Component>((resolve) => {
        setTimeout(() => {
          resolve(
            defineComponent({
              name: 'MockMdEditor',
              props: {
                modelValue: {
                  type: String,
                  default: '',
                },
                preview: {
                  type: Boolean,
                  default: true,
                },
                language: {
                  type: String,
                  default: '',
                },
                onOnUploadImg: {
                  type: Function,
                  default: undefined,
                },
              },
              emits: ['update:modelValue'],
              setup(props, { emit }) {
                return () =>
                  h(
                    'button',
                    {
                      'data-test': 'mock-md-editor',
                      'data-model-value': props.modelValue,
                      'data-preview': String(props.preview),
                      'data-language': props.language,
                      'data-has-upload': String(props.onOnUploadImg === uploadHandler),
                      onClick: () => emit('update:modelValue', '更新后的回复'),
                    },
                    props.modelValue,
                  )
              },
            }),
          )
        }, 0)
      }),
  )

describe('WorkOrderReplyEditor', () => {
  it('renders loading shell while editor resolves and emits content updates', async () => {
    const wrapper = mount(WorkOrderReplyEditor, {
      props: {
        editorComponent: createAsyncEditor(),
        modelValue: '初始回复',
        onUploadImg: uploadHandler,
      },
    })

    expect(wrapper.find('[data-test="reply-editor-card"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="reply-editor-spin"]').exists()).toBe(true)
    expect(wrapper.find('.markdown-editor-loading-placeholder').exists()).toBe(true)

    await new Promise((resolve) => setTimeout(resolve, 0))
    await nextTick()

    const editor = wrapper.get('[data-test="mock-md-editor"]')
    expect(editor.attributes('data-model-value')).toBe('初始回复')
    expect(editor.attributes('data-preview')).toBe('false')
    expect(editor.attributes('data-language')).toBe('zh-CN')
    expect(editor.attributes('data-has-upload')).toBe('true')

    await editor.trigger('click')

    expect(wrapper.emitted('update:modelValue')).toEqual([['更新后的回复']])
  })
})
