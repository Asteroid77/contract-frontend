// @vitest-environment node

import { describe, expect, it } from 'vitest'
import { renderGeneratedContent, resolveInfraRoot } from '../sync-frontend-security-origins.mjs'

describe('sync-frontend-security-origins', () => {
  it('renders shared resource origins and worker sources for nginx include', () => {
    expect(
      renderGeneratedContent({
        cspSharedOrigins: [
          'https://oss-cn-guangzhou.aliyuncs.com',
          'https://*.oss-cn-guangzhou.aliyuncs.com',
        ],
        cspWorkerSources: ['blob:'],
      }),
    ).toBe(`# Generated from contract-frontend access-policy.json
set $frontend_shared_resource_origins "https://oss-cn-guangzhou.aliyuncs.com https://*.oss-cn-guangzhou.aliyuncs.com";
set $frontend_worker_src "blob:";
`)
  })

  it('prefers the first existing infra root candidate', () => {
    expect(
      resolveInfraRoot('/workspace/contract-frontend', {
        candidates: ['/workspace/projects/infra', '/workspace/infra'],
        exists: (path) => path === '/workspace/infra/stack/docker-setting/nginx/conf.d',
      }),
    ).toBe('/workspace/infra')
  })
})
