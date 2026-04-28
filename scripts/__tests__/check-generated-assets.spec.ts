// @vitest-environment node

import { describe, expect, it } from 'vitest'
import {
  collectGeneratedAssetDrifts,
  formatGeneratedAssetDrifts,
} from '../check-generated-assets.mjs'

describe('check-generated-assets', () => {
  it('reports generated asset drift from injected generators', async () => {
    const findings = await collectGeneratedAssetDrifts({
      generators: [
        {
          name: 'theme-css',
          run: () => ({
            changed: true,
            drifted: true,
            hash: 'sha256-test',
          }),
        },
      ],
    })

    expect(findings).toEqual([
      {
        name: 'theme-css',
        hash: 'sha256-test',
        reason: 'generated asset drifted',
      },
    ])
  })

  it('keeps generated assets clean when all generators are unchanged', async () => {
    const findings = await collectGeneratedAssetDrifts({
      generators: [
        {
          name: 'iconfont-sprite',
          run: () => ({
            changed: false,
            drifted: false,
            hash: 'sha256-clean',
          }),
        },
      ],
    })

    expect(findings).toEqual([])
  })

  it('formats generated asset drift with asset name and hash', () => {
    const output = formatGeneratedAssetDrifts([
      {
        name: 'theme-css',
        hash: 'sha256-test',
        reason: 'generated asset drifted',
      },
    ])

    expect(output).toContain('theme-css')
    expect(output).toContain('sha256-test')
    expect(output).toContain('generated asset drifted')
  })
})
