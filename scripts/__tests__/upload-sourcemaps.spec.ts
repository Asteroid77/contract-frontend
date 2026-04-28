// @vitest-environment node

import { execFile } from 'node:child_process'
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { createServer, type IncomingMessage } from 'node:http'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'

const scriptPath = fileURLToPath(new URL('../upload-sourcemaps.mjs', import.meta.url))
const tempRoots: string[] = []

function createTempRoot() {
  const root = mkdtempSync(join(tmpdir(), 'contract-upload-sourcemaps-'))
  tempRoots.push(root)
  return root
}

function readRequestBody(request: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []

    request.on('data', (chunk) => chunks.push(Buffer.from(chunk)))
    request.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')))
    request.on('error', reject)
  })
}

function runScript(env: NodeJS.ProcessEnv): Promise<{ code: number | null; output: string }> {
  return new Promise((resolve) => {
    execFile(
      process.execPath,
      [scriptPath],
      {
        env: {
          ...process.env,
          ...env,
        },
      },
      (error, stdout, stderr) => {
        resolve({
          code: error && 'code' in error ? Number(error.code) : 0,
          output: `${stdout}${stderr}`,
        })
      },
    )
  })
}

describe('upload-sourcemaps script', () => {
  afterEach(() => {
    for (const root of tempRoots.splice(0)) {
      rmSync(root, { recursive: true, force: true })
    }
  })

  it('uploads recursive sourcemaps with service, release, and relative filename params', async () => {
    const root = createTempRoot()
    const distAssets = join(root, 'dist', 'assets')
    mkdirSync(join(distAssets, 'chunks'), { recursive: true })
    writeFileSync(join(distAssets, 'chunks', 'app.js.map'), '{"version":3}')

    const requests: Array<{ url: string; body: string }> = []
    const server = createServer(async (request, response) => {
      requests.push({
        url: request.url || '',
        body: await readRequestBody(request),
      })
      response.writeHead(200)
      response.end('ok')
    })

    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
    const address = server.address()
    if (!address || typeof address === 'string') {
      throw new Error('Expected local test server address')
    }

    try {
      const result = await runScript({
        DIST_DIR: distAssets,
        SOURCEMAP_RESOLVER_ENDPOINT: `http://127.0.0.1:${address.port}`,
        SOURCEMAP_RELEASE: 'release-a',
        SOURCEMAP_SERVICE_NAME: 'contract-frontend',
      })

      expect(result.code).toBe(0)
      expect(requests).toHaveLength(1)

      const uploadUrl = new URL(requests[0].url, 'http://127.0.0.1')
      expect(uploadUrl.pathname).toBe('/v1/sourcemaps')
      expect(uploadUrl.searchParams.get('service')).toBe('contract-frontend')
      expect(uploadUrl.searchParams.get('release')).toBe('release-a')
      expect(uploadUrl.searchParams.get('filename')).toBe('assets/chunks/app.js.map')
      expect(requests[0].body).toBe('{"version":3}')
    } finally {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()))
      })
    }
  })

  it('fails fast when no release id is configured', async () => {
    const root = createTempRoot()
    const distAssets = join(root, 'dist', 'assets')
    mkdirSync(distAssets, { recursive: true })

    const result = await runScript({
      DIST_DIR: distAssets,
      SOURCEMAP_RESOLVER_ENDPOINT: 'http://127.0.0.1:9',
      SOURCEMAP_RELEASE: '',
      RELEASE_ID: '',
      GITHUB_SHA: '',
    })

    expect(result.code).toBe(1)
    expect(result.output).toContain('SOURCEMAP_RELEASE, RELEASE_ID, or GITHUB_SHA must be set')
  })
})
