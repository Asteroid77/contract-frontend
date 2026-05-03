#!/usr/bin/env node

import process from 'node:process'
import { createJiti } from 'jiti'

const jiti = createJiti(import.meta.url)

async function main() {
  const { generateThemeCssAsset } = await jiti.import('../vite-plugin/ThemeGeneratorVitePlugin.ts')
  const result = generateThemeCssAsset()

  console.log(
    result.changed
      ? `Generated theme CSS (${result.hash}).`
      : `Theme CSS is already up to date (${result.hash}).`,
  )
}

void main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
