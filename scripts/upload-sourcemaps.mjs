#!/usr/bin/env node
/**
 * upload-sourcemaps.mjs —— 构建产物 Source Map 上传脚本
 *
 * 【目的】
 * 前端项目打包后会在 dist/assets 目录下生成 .map（Source Map）文件。
 * 本脚本将这些 .map 文件逐个上传到 Source Map 解析服务（Resolver），
 * 以便在生产环境出现错误时，能够通过 Source Map 还原出原始源码位置，
 * 方便排查问题。
 *
 * 【环境变量】
 *
 *   DIST_DIR
 *     构建产物目录路径，默认为项目根目录下的 dist/assets。
 *     如果你的构建输出到了其他位置（例如自定义 Vite outDir），
 *     可以通过设置此环境变量来覆盖。
 *
 *   SOURCEMAP_RESOLVER_ENDPOINT
 *     Source Map 解析服务的地址，默认为 http://localhost:3001。
 *     在 CI/CD 环境中通常会设置为内网服务地址或云端服务地址。
 *
 * 【__dirname 兼容处理】
 * 因为本脚本是 ESM 格式（.mjs），不像 CommonJS 那样自带 __dirname，
 * 所以通过 fileURLToPath(import.meta.url) + path.dirname() 手动构造，
 * 确保相对路径解析正确。
 *
 * 【uploadSourceMap(filePath) —— 单文件上传】
 *   - 读取指定 .map 文件的内容。
 *   - 以 PUT 方法发送到 Resolver 服务的 /v1/sourcemaps 端点，
 *     通过查询参数 filename 传递文件名。
 *   - 如果上传失败（HTTP 非 2xx 或网络错误），函数会抛出错误，
 *     但不会终止整个脚本——由 main() 负责捕获并记录。
 *
 * 【main() —— 主流程】
 *   1. 检查 DIST_DIR 是否存在：
 *      - 不存在 → 说明构建未完成或路径配置错误，直接报错并 exit(1)。
 *
 *   2. 扫描 DIST_DIR 下所有 .map 文件：
 *      - 没有找到任何 .map 文件 → 这不算错误（可能项目配置了不生成 sourcemap），
 *        脚本正常退出（exit 0）。
 *
 *   3. 逐个上传 .map 文件：
 *      - 每个文件独立上传，单个文件上传失败不会中断后续文件的上传。
 *      - 失败的文件会被记录到一个失败列表中，并在控制台输出错误信息。
 *
 *   4. 上传完毕后统计结果：
 *      - 如果失败数 > 0 → exit(1)，CI 流水线标记为失败。
 *      - 如果全部成功 → exit(0)，流水线继续。
 *
 * 【顶层错误处理】
 * main().catch() 捕获未预期的致命错误（如代码 bug、权限问题等），
 * 打印错误信息并以 exit(1) 退出，确保 CI 不会静默通过。
 *
 * 【CI 行为】
 * - 通过（exit 0）：所有 .map 文件上传成功，或目录下无 .map 文件。
 * - 失败（exit 1）：DIST_DIR 不存在、或有至少一个 .map 文件上传失败、
 *   或发生未预期的运行时错误。
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
// DIST_DIR 可被 CI 覆盖；默认使用前端构建产物目录。
const DIST_DIR = process.env.DIST_DIR || path.join(__dirname, '../dist/assets')
// 解析服务地址可被环境变量注入；本地默认值用于开发联调。
const RESOLVER_ENDPOINT = process.env.SOURCEMAP_RESOLVER_ENDPOINT || 'http://localhost:3001'

async function uploadSourceMap(filePath) {
  // 上传单个 sourcemap：文件名作为 query 参数，文件内容作为请求体。
  const filename = path.basename(filePath)
  // sourcemap 文件是文本 JSON，这里直接按 Buffer 读取并传输。
  const content = fs.readFileSync(filePath)

  // 服务端协议：PUT /v1/sourcemaps?filename=<name>
  // 返回非 2xx 视为上传失败。
  const response = await fetch(
    `${RESOLVER_ENDPOINT}/v1/sourcemaps?filename=${encodeURIComponent(filename)}`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: content,
    },
  )

  if (!response.ok) {
    throw new Error(`Failed to upload ${filename}: ${response.status}`)
  }

  console.log(`✓ Uploaded: ${filename}`)
}

async function main() {
  // 主入口：检查目录 -> 扫描文件 -> 逐个上传 -> 汇总结果。
  console.log(`Uploading source maps from: ${DIST_DIR}`)
  console.log(`Target endpoint: ${RESOLVER_ENDPOINT}`)
  console.log('')

  if (!fs.existsSync(DIST_DIR)) {
    // 目录不存在通常说明 build 尚未执行，或 DIST_DIR 指错。
    console.error(`Error: Directory not found: ${DIST_DIR}`)
    process.exit(1)
  }

  // 仅处理 .map 文件，其它构建产物跳过。
  const files = fs.readdirSync(DIST_DIR).filter((f) => f.endsWith('.map'))

  if (files.length === 0) {
    // 无 sourcemap 视为可接受场景（例如关闭了 sourcemap 输出）。
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
      // 单文件失败不立即中断：继续上传剩余文件，最后统一给出汇总结果。
      console.error(`✗ Failed: ${file} - ${err.message}`)
      failed++
    }
  }

  console.log('')
  console.log(`Done: ${success} uploaded, ${failed} failed`)

  if (failed > 0) {
    // 只要有失败就返回非零，让 CI 感知并中断发布。
    process.exit(1)
  }
}

main().catch((err) => {
  // 兜底捕获未处理异常，确保脚本在异常场景下返回非零状态码。
  console.error('Error:', err)
  process.exit(1)
})
