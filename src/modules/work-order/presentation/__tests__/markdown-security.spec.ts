import { describe, expect, it } from 'vitest'
import {
  sanitizeMarkdownHtml,
  sanitizeMarkdownMermaid,
} from '@/modules/work-order/presentation/markdown-security'

describe('markdown-security', () => {
  it('preserves markdown display hooks needed by the editor while removing active script nodes', async () => {
    const html = `
      <h2 id="heading-anchor">标题</h2>
      <pre><code class="hljs language-ts" data-line="1">const value = 1</code></pre>
      <span class="katex" aria-hidden="true">math</span>
      <div class="mermaid" data-processed="true">graph TD;</div>
      <img src="/safe.png" alt="safe" />
      <script>alert(1)</script>
    `

    const sanitized = sanitizeMarkdownHtml(html)

    expect(sanitized).toContain('id="heading-anchor"')
    expect(sanitized).toContain('class="hljs language-ts"')
    expect(sanitized).toContain('data-line="1"')
    expect(sanitized).toContain('class="katex"')
    expect(sanitized).toContain('class="mermaid"')
    expect(sanitized).toContain('src="/safe.png"')
    expect(sanitized).not.toContain('<script>')
  })

  it('removes event handlers, javascript urls and iframe payloads', () => {
    const html = `
      <a href="javascript:alert(1)" onclick="alert(1)">bad</a>
      <img src="/safe.png" onerror="alert(1)" />
      <iframe srcdoc="<script>alert(1)</script>" src="https://example.com/embed"></iframe>
    `

    const sanitized = sanitizeMarkdownHtml(html)

    expect(sanitized).not.toContain('onclick=')
    expect(sanitized).not.toContain('onerror=')
    expect(sanitized).not.toContain('javascript:alert')
    expect(sanitized).not.toContain('srcdoc=')
    expect(sanitized).not.toContain('<iframe')
  })

  it('removes embedded iframe containers instead of leaving passive-looking active embeds behind', () => {
    const html = `
      <p>before</p>
      <iframe src="https://example.com/embed"></iframe>
      <p>after</p>
    `

    const sanitized = sanitizeMarkdownHtml(html)

    expect(sanitized).toContain('<p>before</p>')
    expect(sanitized).toContain('<p>after</p>')
    expect(sanitized).not.toContain('<iframe')
  })

  it('keeps safe display hooks while forbidding style/script payload containers', () => {
    const html = `
      <pre><code class="hljs language-ts" data-line="1">const value = 1</code></pre>
      <style>@import "javascript:alert(1)"</style>
    `

    const sanitized = sanitizeMarkdownHtml(html)

    expect(sanitized).toContain('class="hljs language-ts"')
    expect(sanitized).toContain('data-line="1"')
    expect(sanitized).not.toContain('<style')
  })

  it('sanitizes mermaid svg output with the same compatibility envelope', async () => {
    const svg = `
      <svg viewBox="0 0 10 10">
        <g class="node" data-node="a" onclick="alert(1)">
          <foreignObject>unsafe</foreignObject>
          <text>safe</text>
        </g>
      </svg>
    `

    const sanitized = await sanitizeMarkdownMermaid(svg)

    expect(sanitized).toContain('class="node"')
    expect(sanitized).toContain('data-node="a"')
    expect(sanitized).toContain('<text>safe</text>')
    expect(sanitized).not.toContain('onclick=')
    expect(sanitized).not.toContain('<foreignObject>')
  })
})
