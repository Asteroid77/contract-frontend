import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('iconfont entry wiring', () => {
  it('mounts generated local iconfont sprite and does not execute vendor JavaScript', () => {
    const mainEntry = readFileSync(resolve(process.cwd(), 'src/main.ts'), 'utf8')
    const htmlEntry = readFileSync(resolve(process.cwd(), 'index.html'), 'utf8')

    expect(mainEntry).toContain(
      "import { mountIconfontSprite } from '@/app/plugins/iconfont-sprite'",
    )
    expect(mainEntry).toContain('mountIconfontSprite()')
    expect(mainEntry).not.toContain("import '@/assets/iconfont/iconfont.js'")
    expect(htmlEntry).not.toContain('at.alicdn.com')
  })
})
