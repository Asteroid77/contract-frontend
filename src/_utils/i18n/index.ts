import { createI18n } from 'vue-i18n'
import { ref, type Ref } from 'vue'
import zhCN from './zh.ts'
import en from './en.ts'
import { STORAGE_KEYS } from '@/constants/storage'

export type AppLocale = 'en' | 'zh-CN'

function normalizeLocale(locale?: string): AppLocale {
  return locale?.toLowerCase().startsWith('en') ? 'en' : 'zh-CN'
}

function parseStoredLocale(value: string | null): AppLocale | undefined {
  if (value === 'en' || value === 'zh-CN') {
    return value
  }
  return undefined
}

function getInitialLocale(): AppLocale {
  if (typeof window === 'undefined') {
    return 'zh-CN'
  }

  const stored = parseStoredLocale(localStorage.getItem(STORAGE_KEYS.APP_LOCALE))
  if (stored) {
    return stored
  }

  return normalizeLocale(window.navigator.language)
}

export const language: Ref<AppLocale> = ref(getInitialLocale())

type MessageSchema = typeof zhCN
type ObjectPaths<T, Path extends string = ''> = T extends object
  ? {
      [K in keyof T]: K extends string
        ? T[K] extends object
          ? ObjectPaths<T[K], Path extends '' ? K : `${Path}.${K}`>
          : Path extends ''
            ? K
            : `${Path}.${K}`
        : never
    }[keyof T]
  : never

export const i18n = createI18n<MessageSchema, AppLocale>({
  legacy: false,
  locale: language.value,
  fallbackLocale: 'zh-CN',
  messages: {
    'zh-CN': zhCN,
    en,
  },
})

export function setLanguage(locale: AppLocale) {
  language.value = locale

  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.APP_LOCALE, locale)
  }

  const globalLocale = i18n.global.locale as unknown

  if (typeof globalLocale === 'string') {
    ;(i18n.global.locale as unknown as AppLocale) = locale
    return
  }

  if (globalLocale && typeof globalLocale === 'object' && 'value' in globalLocale) {
    ;(globalLocale as { value: AppLocale }).value = locale
  }
}

/**
 * 获取i18n实例
 * @return {I18NComposerTranslation}
 */
export const $t = (key: ObjectPaths<MessageSchema>, params?: Record<string, unknown>) =>
  params ? i18n.global.t(key, params) : i18n.global.t(key)

export const $te = (key: string) => i18n.global.te(key)
