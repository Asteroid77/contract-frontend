#!/usr/bin/env node
/**
 * Source Map 上传脚本
 * 构建后自动上传 .map 文件到 Source Map Resolver 服务
 *
 * 用法: node scripts/upload-sourcemaps.mjs
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DIST_DIR = process.env.DIST_DIR || path.join(__dirname, '../dist/assets')
const RESOLVER_ENDPOINT = process.env.SOURCEMAP_RESOLVER_ENDPOINT || 'http://localhost:3001'

async function uploadSourceMap(filePath) {
  const filename = path.basename(filePath)
  const content = fs.readFileSync(filePath)

  const response = await fetch(`${RESOLVER_ENDPOINT}/v1/sourcemaps?filename=${encodeURIComponent(filename)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: content,
  })

  if (!response.ok) {
    throw new Error(`Failed to upload ${filename}: ${response.status}`)
  }

  console.log(`✓ Uploaded: ${filename}`)
}

async function main() {
  console.log(`Uploading source maps from: ${DIST_DIR}`)
  console.log(`Target endpoint: ${RESOLVER_ENDPOINT}`)
  console.log('')

  if (!fs.existsSync(DIST_DIR)) {
    console.error(`Error: Directory not found: ${DIST_DIR}`)
    process.exit(1)
  }

  const files = fs.readdirSync(DIST_DIR).filter(f => f.endsWith('.map'))

  if (files.length === 0) {
    console.log('No source map files found.')
    return
  }

  console.log(`Found ${files.length} source map files`)
  console.log('')

  let success = 0
  let failed = 0

  for (const file of files) {
    try {
      await uploadSourceMap(path.join(DIST_DIR, file))
      success++
    } catch (err) {
      console.error(`✗ Failed: ${file} - ${err.message}`)
      failed++
    }
  }

  console.log('')
  console.log(`Done: ${success} uploaded, ${failed} failed`)

  if (failed > 0) {
    process.exit(1)
  }
}

main().catch(err => {
  console.error('Error:', err)
  process.exit(1)
})
