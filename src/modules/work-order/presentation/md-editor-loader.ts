import { defineComponent, h, type Component } from 'vue'
import { sanitizeMarkdownHtml, sanitizeMarkdownMermaid } from './markdown-security'

let mdPreviewRuntimePromise: Promise<void> | null = null
let mdEditorRuntimePromise: Promise<void> | null = null

function disableMarkdownRawHtml(md: { options: { html?: boolean } }) {
  md.options.html = false
}

function createStrictMermaidConfig<TConfig extends Record<string, unknown>>(config: TConfig) {
  return {
    ...config,
    securityLevel: 'strict',
  }
}

const markdownSecurityConfig = {
  markdownItConfig: disableMarkdownRawHtml,
  mermaidConfig: createStrictMermaidConfig,
}

function resolveModuleDefault<T>(module: T | { default: T }): T {
  if (typeof module === 'object' && module !== null && 'default' in module) {
    return module.default
  }

  return module as T
}

function createWorkOrderMarkdownComponent(component: Component, name: string) {
  return defineComponent({
    name,
    inheritAttrs: false,
    setup(_, { attrs, slots }) {
      return () =>
        h(
          component,
          {
            ...attrs,
            noEcharts: true,
            sanitize: sanitizeMarkdownHtml,
            sanitizeMermaid: sanitizeMarkdownMermaid,
          },
          slots,
        )
    },
  })
}

async function ensureMdPreviewRuntime() {
  if (!mdPreviewRuntimePromise) {
    mdPreviewRuntimePromise = (async () => {
      const [{ config }, highlightModule, mermaidModule, katexModule] = await Promise.all([
        import('md-editor-v3'),
        import('highlight.js'),
        import('mermaid'),
        import('katex'),
        import('highlight.js/styles/atom-one-light.css'),
        import('katex/dist/katex.min.css'),
      ])

      config({
        ...markdownSecurityConfig,
        editorExtensions: {
          highlight: {
            instance: resolveModuleDefault(highlightModule),
          },
          mermaid: {
            instance: resolveModuleDefault(mermaidModule),
          },
          katex: {
            instance: resolveModuleDefault(katexModule),
          },
        },
      })
    })()
  }

  return mdPreviewRuntimePromise
}

async function ensureMdEditorRuntime() {
  if (!mdEditorRuntimePromise) {
    mdEditorRuntimePromise = (async () => {
      await ensureMdPreviewRuntime()

      const [{ config }, prettierModule, parserMarkdownModule, cropperModule, screenfullModule] =
        await Promise.all([
          import('md-editor-v3'),
          import('prettier/standalone'),
          import('prettier/plugins/markdown'),
          import('cropperjs'),
          import('screenfull'),
          import('cropperjs/dist/cropper.css'),
        ])

      config({
        ...markdownSecurityConfig,
        editorExtensions: {
          prettier: {
            prettierInstance: resolveModuleDefault(prettierModule),
            parserMarkdownInstance: resolveModuleDefault(parserMarkdownModule),
          },
          cropper: {
            instance: resolveModuleDefault(cropperModule),
          },
          screenfull: {
            instance: resolveModuleDefault(screenfullModule),
          },
        },
      })
    })()
  }

  return mdEditorRuntimePromise
}

export async function loadMdEditor() {
  await Promise.all([ensureMdEditorRuntime(), import('md-editor-v3/lib/style.css')])
  const { default: MdEditor } = await import('md-editor-v3/lib/es/MdEditor.mjs')
  return createWorkOrderMarkdownComponent(MdEditor, 'WorkOrderMdEditor')
}

export async function loadMdPreview() {
  await Promise.all([ensureMdPreviewRuntime(), import('md-editor-v3/lib/preview.css')])
  const { default: MdPreview } = await import('md-editor-v3/lib/es/MdPreview.mjs')
  return createWorkOrderMarkdownComponent(MdPreview, 'WorkOrderMdPreview')
}
