import { $t } from '@/_utils/i18n'
import { useStorage } from '@vueuse/core'
import { computed, watchEffect } from 'vue'
import { commonTokens, colorTokens, type ColorTokens } from '../ThemeToken'
import { darkTheme, type GlobalThemeOverrides } from 'naive-ui'

export type Theme = 'light' | 'dark' | 'sakura'

export interface ThemeOption {
  key: Theme
  label: string
}

export const themes: ThemeOption[] = [
  { key: 'light', label: $t('layout.theme.light') },
  { key: 'dark', label: $t('layout.theme.dark') },
  { key: 'sakura', label: $t('layout.theme.sakura') },
]
const createThemeBridge = (colors: ColorTokens): GlobalThemeOverrides => ({
  common: {
    // --- 1. 基础颜色映射 ---
    primaryColor: colors.primary,
    primaryColorHover: colors.primaryHover,
    primaryColorPressed: colors.primaryPressed,
    primaryColorSuppl: colors.primarySuppl, // 对应 Focus Ring 颜色

    // --- 2. 强调色映射 (Accent -> Info) ---
    infoColor: colors.accent,
    infoColorHover: colors.accentHover,
    infoColorPressed: colors.accentPressed,
    infoColorSuppl: colors.accentSuppl,

    // --- 3. 背景与文字 ---
    bodyColor: colors.bgBody,
    cardColor: colors.bgCard,
    popoverColor: colors.bgCard, // 浮层背景
    modalColor: colors.bgCard, // 弹窗背景

    textColorBase: colors.textBody,
    textColor1: colors.textMain, // 标题
    textColor2: colors.textBody, // 正文
    textColor3: colors.textLight, // 辅助
    textColorDisabled: colors.textDisabled,

    borderColor: colors.border,
    dividerColor: colors.border,

    // --- 4. 全局圆角 ---
    borderRadius: commonTokens.radiusMd,
    borderRadiusSmall: commonTokens.radiusSm,
  },

  // --- 组件特定覆盖 ---

  Card: {
    borderRadius: commonTokens.radiusLg, // 卡片使用大圆角
    paddingMedium: commonTokens.paddingCard, // 统一卡片内边距
  },

  // 弹窗 (Dialog) 应该和 Card 保持一致的设计语言
  Dialog: {
    borderRadius: commonTokens.radiusLg,
    padding: commonTokens.paddingCard,
    // titleFontSize: '18px', // 根据需要微调标题大小
  },

  Button: {
    borderRadiusMedium: commonTokens.radiusMd,
    borderRadiusSmall: commonTokens.radiusSm,
    // 按钮文字粗细，高级灰风格通常用 500
    fontWeight: '500',
  },

  Layout: {
    // 侧边栏/顶栏尺寸
    siderWidth: commonTokens.siderWidth,
    siderCollapsedWidth: commonTokens.siderCollapsedWidth,
    headerHeight: commonTokens.headerHeight,

    // 边框颜色
    borderColor: colors.border,
    headerBorderColor: colors.border,
    siderBorderColor: colors.border,
  },

  Input: {
    borderColor: colors.border,
    borderColorHover: colors.primaryHover,
    borderColorFocus: colors.primary,

    // 圆角统一
    borderRadius: commonTokens.radiusSm,
  },

  // 统一表单间距
  Form: {
    // 表单验证错误提示的间距
    feedbackPadding: commonTokens.spacingXs,
  },
})
const themeOverridesMap = new Map(
  themes.map((item) => [item.key, createThemeBridge(colorTokens[item.key])]),
)

// --- 模块级 singleton：供 discrete API 等非组件上下文直接 import ---

const currentTheme = useStorage<Theme>('app-theme', 'light')

export const activeThemeOverrides = computed(() => themeOverridesMap.get(currentTheme.value))

// 判断是否为暗黑主题，主要是dark风格的NaiveUI组件肯定比我们定义的要完善，考虑到这个不如以覆盖其dark主题为主。
// 这样其实就把主题分成了暗黑与其它两大类
export const isDark = computed(() => currentTheme.value === 'dark')

/** NaiveUI 基础主题对象（dark / null），供 ConfigProvider 和 discrete API 使用 */
export const naiveTheme = computed(() => (isDark.value ? darkTheme : null))

// 使用 watchEffect 监听 currentTheme 的变化，并更新 <html> 的 data-theme
watchEffect(() => {
  const htmlEl = document.documentElement
  // 如果是默认主题，可以移除属性，让 :root 生效
  if (currentTheme.value === 'light') {
    htmlEl.removeAttribute('data-theme')
  } else {
    htmlEl.setAttribute('data-theme', currentTheme.value)
  }
})

function setTheme(theme: Theme) {
  currentTheme.value = theme
}

export function useTheme() {
  return {
    themes,
    currentTheme,
    setTheme,
    isDark,
    activeThemeOverrides,
  }
}
