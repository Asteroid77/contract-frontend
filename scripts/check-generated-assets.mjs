#!/usr/bin/env node

import process from 'node:process'
import { createJiti } from 'jiti'

const jiti = createJiti(import.meta.url)

export async function createDefaultGeneratedAssetGenerators() {
  const { generateThemeCssAsset } = await jiti.import('../vite-plugin/ThemeGeneratorVitePlugin.ts')
  const { generateIconfontSprite } = await jiti.import('../vite-plugin/IconfontSpriteVitePlugin.ts')

  return [
    {
      name: 'theme-css',
      run: () => generateThemeCssAsset({ check: true }),
    },
    {
      name: 'iconfont-sprite',
      run: () =>
        generateIconfontSprite({
          sourcePath: `${process.cwd()}/src/assets/iconfont/vendor/iconfont.js`,
          outputPath: `${process.cwd()}/src/assets/iconfont/generated/IconfontSprite.tsx`,
          metaPath: `${process.cwd()}/src/assets/iconfont/generated/iconfont-meta.json`,
          check: true,
        }),
    },
  ]
}

export async function collectGeneratedAssetDrifts(options = {}) {
  const generators = options.generators ?? (await createDefaultGeneratedAssetGenerators())
  const findings = []

  for (const generator of generators) {
    const result = await generator.run()
    if (result.drifted) {
      findings.push({
        name: generator.name,
        hash: result.hash,
        reason: 'generated asset drifted',
      })
    }
  }

  return findings
}

export function formatGeneratedAssetDrifts(findings) {
  if (findings.length === 0) {
    return 'Generated assets are up to date.'
  }

  return [
    'Generated asset drift detected:',
    ...findings.map((finding) => `- ${finding.name}: ${finding.reason} (${finding.hash})`),
  ].join('\n')
}

async function main() {
  const findings = await collectGeneratedAssetDrifts()
  console.log(formatGeneratedAssetDrifts(findings))

  if (findings.length > 0) {
    process.exitCode = 1
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  void main().catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
}
