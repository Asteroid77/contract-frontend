import { createI18n } from 'vue-i18n'
import { ref, type Ref } from 'vue'
import zhCN from './zh.ts'
import en from './en.ts'
export const language: Ref<NavigatorLanguage['language']> = ref(window.navigator.language)
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
const i18n = createI18n<MessageSchema, 'en' | 'zh-CN'>({
  legacy: false,
  locale: language.value,
  fallbackLocale: 'zh-CN',
  messages: {
    'zh-CN': zhCN,
    en: en,
  },
})
/**
 * 获取i18n实例
 * @return {I18NComposerTranslation}
 */
export const $t = (key: ObjectPaths<MessageSchema>) => i18n.global.t(key)
