import type { Plugin } from 'vite'

export const TRUSTED_TYPES_DEV_CLIENT_PUBLIC_PATH = '/@contract-frontend/trusted-types-dev-client'
export const TRUSTED_TYPES_DEV_CLIENT_MODULE_ID = '\0contract-frontend:trusted-types-dev-client'

export function trustedTypesDevClientPlugin(): Plugin {
  return {
    name: 'contract-frontend:trusted-types-dev-client',
    apply: 'serve',
    enforce: 'post',
    resolveId(id) {
      if (id === TRUSTED_TYPES_DEV_CLIENT_PUBLIC_PATH) {
        return TRUSTED_TYPES_DEV_CLIENT_MODULE_ID
      }
    },
    load(id) {
      if (id === TRUSTED_TYPES_DEV_CLIENT_MODULE_ID) {
        return [
          "import { installTrustedTypesWorkerConstructors } from '/src/modules/shared/application/security/trusted-types.ts'",
          'installTrustedTypesWorkerConstructors()',
          '',
        ].join('\n')
      }
    },
    transformIndexHtml: {
      order: 'post',
      handler() {
        return [
          {
            tag: 'script',
            attrs: {
              type: 'module',
              src: TRUSTED_TYPES_DEV_CLIENT_PUBLIC_PATH,
            },
            injectTo: 'head-prepend',
          },
        ]
      },
    },
  }
}
