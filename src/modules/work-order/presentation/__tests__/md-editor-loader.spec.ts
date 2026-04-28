import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { sanitizeMarkdownHtml, sanitizeMarkdownMermaid } from '../markdown-security'

const configSpy = vi.fn()
const { mdPreviewPropsSpy, mdEditorPropsSpy } = vi.hoisted(() => ({
  mdPreviewPropsSpy: vi.fn(),
  mdEditorPropsSpy: vi.fn(),
}))

vi.mock('md-editor-v3', () => ({
  config: configSpy,
}))

vi.mock('highlight.js', () => ({
  default: { name: 'local-highlight' },
}))

vi.mock('mermaid', () => ({
  default: { name: 'local-mermaid' },
}))

vi.mock('katex', () => ({
  default: { name: 'local-katex' },
}))

const echartsImportSpy = vi.fn()

vi.mock('echarts', () => {
  echartsImportSpy()
  return {
    default: { name: 'local-echarts' },
  }
})

vi.mock('prettier/standalone', () => ({
  default: { name: 'local-prettier' },
}))

vi.mock('prettier/plugins/markdown', () => ({
  default: { name: 'local-prettier-markdown' },
}))

vi.mock('cropperjs', () => ({
  default: { name: 'local-cropper' },
}))

vi.mock('screenfull', () => ({
  default: { name: 'local-screenfull' },
}))

vi.mock('md-editor-v3/lib/es/MdEditor.mjs', () => ({
  default: defineComponent({
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
      noEcharts: {
        type: Boolean,
        default: false,
      },
      sanitize: {
        type: Function,
        default: undefined,
      },
      sanitizeMermaid: {
        type: Function,
        default: undefined,
      },
    },
    setup(props) {
      mdEditorPropsSpy({
        modelValue: props.modelValue,
        preview: props.preview,
        noEcharts: props.noEcharts,
        sanitize: props.sanitize,
        sanitizeMermaid: props.sanitizeMermaid,
      })

      return () =>
        h('div', {
          'data-test': 'mock-md-editor',
          'data-no-echarts': String(props.noEcharts),
        })
    },
  }),
}))

vi.mock('md-editor-v3/lib/es/MdPreview.mjs', () => ({
  default: defineComponent({
    name: 'MockMdPreview',
    props: {
      modelValue: {
        type: String,
        default: '',
      },
      noEcharts: {
        type: Boolean,
        default: false,
      },
      sanitize: {
        type: Function,
        default: undefined,
      },
      sanitizeMermaid: {
        type: Function,
        default: undefined,
      },
    },
    setup(props) {
      mdPreviewPropsSpy({
        modelValue: props.modelValue,
        noEcharts: props.noEcharts,
        sanitize: props.sanitize,
        sanitizeMermaid: props.sanitizeMermaid,
      })

      return () =>
        h('div', {
          'data-test': 'mock-md-preview',
          'data-no-echarts': String(props.noEcharts),
        })
    },
  }),
}))

describe('md-editor-loader', () => {
  beforeEach(() => {
    configSpy.mockClear()
    mdPreviewPropsSpy.mockClear()
    mdEditorPropsSpy.mockClear()
    vi.resetModules()
  })

  it('loads MdPreview with local highlight, mermaid and katex runtimes instead of relying on CDN defaults', async () => {
    const { loadMdPreview } = await import('../md-editor-loader')

    const preview = await loadMdPreview()
    const configCall = configSpy.mock.calls[0]?.[0]
    const markdownItConfig = configCall?.markdownItConfig as
      | ((md: { options: { html: boolean } }) => void)
      | undefined
    const mermaidConfig = configCall?.mermaidConfig as
      | ((config: { startOnLoad: boolean; theme: string; securityLevel?: string }) => {
          startOnLoad: boolean
          theme: string
          securityLevel?: string
        })
      | undefined
    const markdownIt = { options: { html: true } }
    const mermaidBaseConfig = { startOnLoad: false, theme: 'default' }

    expect(preview).toMatchObject({ name: 'WorkOrderMdPreview', inheritAttrs: false })
    expect(configSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        editorExtensions: expect.objectContaining({
          highlight: expect.objectContaining({
            instance: { name: 'local-highlight' },
          }),
          mermaid: expect.objectContaining({
            instance: { name: 'local-mermaid' },
          }),
          katex: expect.objectContaining({
            instance: { name: 'local-katex' },
          }),
        }),
      }),
    )
    expect(configCall.editorExtensions).not.toHaveProperty('echarts')
    expect(echartsImportSpy).not.toHaveBeenCalled()
    expect(markdownItConfig).toEqual(expect.any(Function))
    expect(mermaidConfig).toEqual(expect.any(Function))

    markdownItConfig?.(markdownIt)

    expect(markdownIt.options.html).toBe(false)
    expect(mermaidConfig?.(mermaidBaseConfig)).toEqual({
      startOnLoad: false,
      theme: 'default',
      securityLevel: 'strict',
    })
  })

  it('preloads markdown preview security props through the returned MdPreview component', async () => {
    const { loadMdPreview } = await import('../md-editor-loader')
    const preview = await loadMdPreview()
    const userSanitize = vi.fn()
    const userSanitizeMermaid = vi.fn()
    const wrapper = mount(preview, {
      props: {
        modelValue: '# hello',
        noEcharts: false,
        sanitize: userSanitize,
        sanitizeMermaid: userSanitizeMermaid,
      },
    })

    expect(wrapper.get('[data-test="mock-md-preview"]').attributes('data-no-echarts')).toBe('true')
    expect(mdPreviewPropsSpy).toHaveBeenCalledTimes(1)
    const previewProps = mdPreviewPropsSpy.mock.calls[0]?.[0]
    expect(previewProps?.modelValue).toBe('# hello')
    expect(previewProps?.noEcharts).toBe(true)
    expect(previewProps?.sanitize?.('<script>alert(1)</script><p>ok</p>')).toBe(
      sanitizeMarkdownHtml('<script>alert(1)</script><p>ok</p>'),
    )
    expect(
      previewProps?.sanitize?.('<iframe src="https://example.com/embed"></iframe><p>ok</p>'),
    ).toBe('<p>ok</p>')
    await expect(
      previewProps?.sanitizeMermaid?.(
        '<foreignObject><div>bad</div></foreignObject><svg onclick="alert(1)"></svg>',
      ),
    ).resolves.toBe(
      await sanitizeMarkdownMermaid(
        '<foreignObject><div>bad</div></foreignObject><svg onclick="alert(1)"></svg>',
      ),
    )
    await expect(
      previewProps?.sanitizeMermaid?.(
        '<svg><foreignObject>bad</foreignObject><text>ok</text></svg>',
      ),
    ).resolves.toContain('<text>ok</text>')
  })

  it('loads MdEditor with local prettier and cropper runtimes instead of relying on CDN defaults', async () => {
    const { loadMdEditor } = await import('../md-editor-loader')

    const editor = await loadMdEditor()

    expect(configSpy).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        markdownItConfig: expect.any(Function),
        mermaidConfig: expect.any(Function),
        editorExtensions: expect.objectContaining({
          prettier: expect.objectContaining({
            prettierInstance: { name: 'local-prettier' },
            parserMarkdownInstance: { name: 'local-prettier-markdown' },
          }),
          cropper: expect.objectContaining({
            instance: { name: 'local-cropper' },
          }),
          screenfull: expect.objectContaining({
            instance: { name: 'local-screenfull' },
          }),
        }),
      }),
    )
  })

  it('preloads markdown editor security props through the returned MdEditor component', async () => {
    const { loadMdEditor } = await import('../md-editor-loader')
    const editor = await loadMdEditor()
    const userSanitize = vi.fn()
    const userSanitizeMermaid = vi.fn()
    const wrapper = mount(editor, {
      props: {
        modelValue: 'content',
        preview: false,
        noEcharts: false,
        sanitize: userSanitize,
        sanitizeMermaid: userSanitizeMermaid,
      },
    })

    expect(wrapper.get('[data-test="mock-md-editor"]').attributes('data-no-echarts')).toBe('true')
    expect(mdEditorPropsSpy).toHaveBeenCalledTimes(1)
    const editorProps = mdEditorPropsSpy.mock.calls[0]?.[0]
    expect(editorProps?.modelValue).toBe('content')
    expect(editorProps?.preview).toBe(false)
    expect(editorProps?.noEcharts).toBe(true)
    expect(editorProps?.sanitize?.('<script>alert(1)</script><p>ok</p>')).toBe(
      sanitizeMarkdownHtml('<script>alert(1)</script><p>ok</p>'),
    )
    await expect(
      editorProps?.sanitizeMermaid?.(
        '<foreignObject><div>bad</div></foreignObject><svg onclick="alert(1)"></svg>',
      ),
    ).resolves.toBe(
      await sanitizeMarkdownMermaid(
        '<foreignObject><div>bad</div></foreignObject><svg onclick="alert(1)"></svg>',
      ),
    )
  })

  it('configures preview and editor runtimes only once across repeated loads', async () => {
    const { loadMdEditor, loadMdPreview } = await import('../md-editor-loader')

    await loadMdPreview()
    await loadMdPreview()

    await loadMdEditor()
    await loadMdEditor()

    expect(configSpy).toHaveBeenCalledTimes(2)
  })
})
