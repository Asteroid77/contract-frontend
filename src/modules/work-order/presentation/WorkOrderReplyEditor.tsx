import { defineComponent, h, Suspense, toRaw, type Component, type PropType } from 'vue'
import { NCard, NSpin, NSpace } from 'naive-ui'

type MarkdownUploadResult = {
  url: string
  alt: string
  title: string
}

type MarkdownImageUploadHandler = (
  files: File[],
  callback: (urls: MarkdownUploadResult[]) => void,
) => void | Promise<void>

export default defineComponent({
  name: 'WorkOrderReplyEditor',
  props: {
    editorComponent: {
      type: Object as PropType<Component>,
      required: true,
    },
    modelValue: {
      type: String,
      required: true,
    },
    onUploadImg: {
      type: Function as PropType<MarkdownImageUploadHandler>,
      required: true,
    },
  },
  emits: {
    'update:modelValue': (_value: string) => true,
  },
  setup(props, { emit }) {
    return () => (
      <NCard bordered={false}>
        <NSpace vertical size={12}>
          <Suspense
            v-slots={{
              default: () =>
                h(toRaw(props.editorComponent), {
                  modelValue: props.modelValue,
                  'onUpdate:modelValue': (value: string) => emit('update:modelValue', value),
                  language: 'zh-CN',
                  class: 'w-full',
                  preview: false,
                  onOnUploadImg: props.onUploadImg,
                }),
              fallback: () => (
                <NSpin show={true} class="markdown-loading-shell">
                  <div class="markdown-editor-loading-placeholder" />
                </NSpin>
              ),
            }}
          />
        </NSpace>
      </NCard>
    )
  },
})
