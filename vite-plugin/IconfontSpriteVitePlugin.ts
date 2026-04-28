import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import type { Plugin, ViteDevServer } from 'vite'
import { createGeneratedAsset, writeGeneratedAssetIfChanged } from './shared/generated-asset'

type GenerateIconfontSpriteOptions = {
  sourcePath: string
  outputPath: string
  metaPath: string
  check?: boolean
}

const allowedSvgTags = new Set([
  'svg',
  'symbol',
  'path',
  'circle',
  'rect',
  'ellipse',
  'line',
  'polyline',
  'polygon',
  'g',
  'defs',
  'linearGradient',
  'radialGradient',
  'stop',
  'use',
  'title',
  'desc',
])

const jsStringEscapeMap: Record<string, string> = {
  "\\'": "'",
  '\\"': '"',
  '\\\\': '\\',
  '\\n': '\n',
  '\\r': '\r',
  '\\t': '\t',
}

type SvgTextNode = {
  type: 'text'
  text: string
}

type SvgElementNode = {
  type: 'element'
  tagName: string
  attributes: string[]
  children: SvgNode[]
  selfClosing: boolean
}

type SvgNode = SvgTextNode | SvgElementNode

function decodeIconfontJsString(value: string) {
  return value.replace(/\\(?:['"\\nrt])/g, (match) => jsStringEscapeMap[match] ?? match)
}

export function parseIconfontSvgFromJs(source: string) {
  const match = source.match(/window\._iconfont_svg_string_[\w$]+\s*=\s*(['"])([\s\S]*?)\1\s*[,;]/)

  if (!match?.[2]) {
    throw new Error('iconfont svg string not found')
  }

  return decodeIconfontJsString(match[2])
}

function collectSymbolIds(svg: string) {
  return [...svg.matchAll(/<symbol\b[^>]*\bid=(['"])(.*?)\1/gi)].map((match) => match[2])
}

function validateSvgTags(svg: string) {
  for (const match of svg.matchAll(/<\/?\s*([a-zA-Z][\w:-]*)\b/g)) {
    const tagName = match[1]
    if (!allowedSvgTags.has(tagName)) {
      throw new Error(`disallowed svg tag: ${tagName}`)
    }
  }
}

function validateSvgAttributes(svg: string) {
  for (const tagMatch of svg.matchAll(/<([a-zA-Z][\w:-]*)\b([^>]*)>/g)) {
    const attributes = tagMatch[2]

    for (const attrMatch of attributes.matchAll(/\s([:@a-zA-Z_][\w:.-]*)\s*=/g)) {
      const attrName = attrMatch[1]
      if (/^on/i.test(attrName)) {
        throw new Error(`disallowed svg attribute: ${attrName}`)
      }
    }

    if (/\b(?:href|xlink:href)\s*=\s*(['"])\s*javascript:/i.test(attributes)) {
      throw new Error('disallowed javascript url')
    }
  }
}

export function validateIconfontSvg(svg: string) {
  validateSvgTags(svg)
  validateSvgAttributes(svg)

  const symbols = collectSymbolIds(svg)
  if (symbols.length === 0) {
    throw new Error('iconfont svg must contain at least one symbol')
  }

  const duplicates = symbols.filter((symbol, index) => symbols.indexOf(symbol) !== index)
  if (duplicates.length > 0) {
    throw new Error(`duplicate iconfont symbol id: ${duplicates[0]}`)
  }

  return symbols
}

function normalizeSvg(svg: string) {
  return svg.trim().replace(/>\s+</g, '><')
}

function parseAttributes(attributeText: string) {
  return [...attributeText.matchAll(/([:@a-zA-Z_][\w:.-]*)\s*=\s*(['"])(.*?)\2/g)].map(
    (match) => `${match[1]}="${match[3].replace(/"/g, '&quot;')}"`,
  )
}

function parseSvgMarkup(markup: string) {
  const root: SvgElementNode = {
    type: 'element',
    tagName: '__root',
    attributes: [],
    children: [],
    selfClosing: false,
  }
  const stack = [root]
  const tagPattern = /<\/?\s*([a-zA-Z][\w:-]*)\b[^>]*\/?>/g
  let lastIndex = 0

  for (const match of markup.matchAll(tagPattern)) {
    const matchIndex = match.index ?? 0
    const text = markup.slice(lastIndex, matchIndex).trim()
    if (text) {
      stack.at(-1)?.children.push({ type: 'text', text })
    }

    const tag = match[0]
    const tagName = match[1]

    if (tag.startsWith('</')) {
      const current = stack.pop()
      if (!current || current.tagName !== tagName) {
        throw new Error(`malformed svg tag: ${tagName}`)
      }
      lastIndex = matchIndex + tag.length
      continue
    }

    const openingMatch = tag.match(/^<\s*([a-zA-Z][\w:-]*)\b([\s\S]*?)(\/?)>$/)
    if (!openingMatch) {
      throw new Error(`malformed svg tag: ${tagName}`)
    }

    const node: SvgElementNode = {
      type: 'element',
      tagName,
      attributes: parseAttributes(openingMatch[2]),
      children: [],
      selfClosing: openingMatch[3] === '/',
    }
    stack.at(-1)?.children.push(node)

    if (!node.selfClosing) {
      stack.push(node)
    }

    lastIndex = matchIndex + tag.length
  }

  const tailText = markup.slice(lastIndex).trim()
  if (tailText) {
    stack.at(-1)?.children.push({ type: 'text', text: tailText })
  }

  if (stack.length !== 1) {
    const current = stack.at(-1)
    throw new Error(`malformed svg tag: ${current?.tagName ?? 'unknown'}`)
  }

  return root.children
}

function formatIndent(level: number) {
  return ' '.repeat(level)
}

function formatElementTag(node: SvgElementNode, indentLevel: number, inlineClose = false) {
  const indent = formatIndent(indentLevel)
  const inline = `${indent}<${node.tagName}${
    node.attributes.length > 0 ? ` ${node.attributes.join(' ')}` : ''
  }${node.selfClosing ? ' />' : inlineClose ? `></${node.tagName}>` : '>'}`

  if (node.tagName === 'symbol' || node.attributes.length <= 1) {
    return inline
  }

  return [
    `${indent}<${node.tagName}`,
    ...node.attributes.map((attribute) => `${indent}  ${attribute}`),
    node.selfClosing ? `${indent}/>` : inlineClose ? `${indent}></${node.tagName}>` : `${indent}>`,
  ].join('\n')
}

function formatSvgNode(node: SvgNode, indentLevel: number): string {
  if (node.type === 'text') {
    return `${formatIndent(indentLevel)}${node.text}`
  }

  if (node.children.length === 0) {
    return formatElementTag(node, indentLevel, true)
  }

  const onlyChild = node.children[0]
  if (node.children.length === 1 && onlyChild?.type === 'text') {
    const text = onlyChild.text
    const inline = `${formatIndent(indentLevel)}<${node.tagName}${
      node.attributes.length > 0 ? ` ${node.attributes.join(' ')}` : ''
    }>${text}</${node.tagName}>`
    if (inline.length <= 100) {
      return inline
    }
  }

  return [
    formatElementTag(node, indentLevel),
    ...node.children.map((child) => formatSvgNode(child, indentLevel + 2)),
    `${formatIndent(indentLevel)}</${node.tagName}>`,
  ].join('\n')
}

function extractSymbols(svg: string) {
  return [...svg.matchAll(/<symbol\b[\s\S]*?<\/symbol>/gi)]
    .map((match) => match[0])
    .flatMap((symbol) => parseSvgMarkup(symbol))
    .map((node) => formatSvgNode(node, 8))
    .join('\n')
}

function createIconfontSpriteTsx(symbols: string) {
  return `import { defineComponent } from 'vue'

export const IconfontSprite = defineComponent({
  name: 'IconfontSprite',
  setup() {
    return () => (
      <svg class="app-iconfont-sprite" aria-hidden="true" focusable="false">
${symbols}
      </svg>
    )
  },
})

export default IconfontSprite
`
}

export function generateIconfontSprite(options: GenerateIconfontSpriteOptions) {
  const source = readFileSync(options.sourcePath, 'utf8')
  const svg = normalizeSvg(parseIconfontSvgFromJs(source))
  const symbols = validateIconfontSvg(svg)
  const content = createIconfontSpriteTsx(extractSymbols(svg))

  return writeGeneratedAssetIfChanged(
    createGeneratedAsset({
      name: 'iconfont-sprite',
      sourcePaths: [options.sourcePath],
      outputPath: options.outputPath,
      metaPath: options.metaPath,
      content,
      hashInput: svg,
      metadata: {
        symbolCount: symbols.length,
        symbols,
      },
    }),
    { check: options.check },
  )
}

export function iconfontSpritePlugin(): Plugin {
  const sourcePath = resolve(process.cwd(), 'src/assets/iconfont/vendor/iconfont.js')
  const outputPath = resolve(process.cwd(), 'src/assets/iconfont/generated/IconfontSprite.tsx')
  const metaPath = resolve(process.cwd(), 'src/assets/iconfont/generated/iconfont-meta.json')

  const generate = () => generateIconfontSprite({ sourcePath, outputPath, metaPath })

  return {
    name: 'vite-plugin-iconfont-sprite',
    buildStart() {
      generate()
    },
    handleHotUpdate({ file, server }: { file: string; server: ViteDevServer }) {
      if (file !== sourcePath) {
        return
      }

      const result = generate()
      if (result.changed) {
        server.ws.send({
          type: 'full-reload',
          path: '*',
        })
      }
    },
  }
}
