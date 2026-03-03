import type { App } from 'vue'
import { enableQueryPersistence } from './useRequestPlugin'

let appInstance: App<Element> | null = null
let caslEnabled = false
let caslPromise: Promise<void> | null = null

export function registerPostLoginEnhancementApp(app: App<Element>): void {
  appInstance = app
}

async function ensureCaslEnabled(): Promise<void> {
  if (caslEnabled || !appInstance) {
    return
  }

  if (!caslPromise) {
    caslPromise = import('./casl')
      .then((module) => {
        if (!caslEnabled && appInstance) {
          module.setupCasl(appInstance)
          caslEnabled = true
        }
      })
      .finally(() => {
        caslPromise = null
      })
  }

  await caslPromise
}

export async function enablePostLoginEnhancements(): Promise<void> {
  await Promise.allSettled([enableQueryPersistence(), ensureCaslEnabled()])
}
