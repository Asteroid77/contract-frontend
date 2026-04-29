import { $t } from '@/_utils/i18n'
import { useStorage } from '@vueuse/core'
import { computed, watchEffect } from 'vue'
import {
  commonTokens,
  colorTokens,
  componentSizeTokens,
  semanticColorTokens,
  type ColorTokens,
  type SemanticColorTokenKey,
  typographyTokens,
} from '../ThemeToken'
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
export const createThemeBridge = (
  colors: ColorTokens,
  semanticColors: Record<SemanticColorTokenKey, string> = semanticColorTokens.light,
): GlobalThemeOverrides => ({
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

    successColor: semanticColors['color/status/approved/text'],
    successColorHover: semanticColors['color/status/approved/text'],
    successColorPressed: semanticColors['color/status/approved/text'],
    successColorSuppl: semanticColors['color/status/approved/border'],
    warningColor: semanticColors['color/status/pending/text'],
    warningColorHover: semanticColors['color/status/pending/text'],
    warningColorPressed: semanticColors['color/status/pending/text'],
    warningColorSuppl: semanticColors['color/status/pending/border'],
    errorColor: semanticColors['color/status/rejected/text'],
    errorColorHover: semanticColors['color/status/rejected/text'],
    errorColorPressed: semanticColors['color/status/rejected/text'],
    errorColorSuppl: semanticColors['color/status/rejected/border'],

    // --- 3. 背景与文字 ---
    bodyColor: colors.bgBody,
    cardColor: colors.bgCard,
    popoverColor: colors.bgCard, // 浮层背景
    modalColor: colors.bgCard, // 弹窗背景
    inputColor: colors.bgCard,
    hoverColor: semanticColors['color/interaction/hover'],
    tableHeaderColor: semanticColors['color/surface/subtle'],
    tableColorHover: semanticColors['color/interaction/hover'],
    actionColor: semanticColors['color/surface/subtle'],

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

    fontFamily: commonTokens.fontSans,
    fontFamilyMono: commonTokens.fontMono,
    fontWeight: typographyTokens['font/weight/regular'],
    fontWeightStrong: typographyTokens['font/weight/semibold'],
    fontSize: typographyTokens['font/size/body'],
    fontSizeSmall: typographyTokens['font/size/sm'],
    fontSizeMedium: typographyTokens['font/size/body'],
    fontSizeLarge: typographyTokens['font/size/title'],
    lineHeight: typographyTokens['line-height/body'],
    heightSmall: componentSizeTokens['component/control/height/small'],
    heightMedium: componentSizeTokens['component/control/height/medium'],
    heightLarge: componentSizeTokens['component/control/height/large'],
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

  DataTable: {
    borderRadius: commonTokens.radiusMd,
    borderColor: colors.border,
    thColor: semanticColors['color/surface/subtle'],
    thColorHover: semanticColors['color/interaction/hover'],
    thColorSorting: semanticColors['color/interaction/selected'],
    thTextColor: colors.textBody,
    thFontWeight: typographyTokens['font/weight/semibold'],
    tdColor: colors.bgCard,
    tdColorHover: semanticColors['color/interaction/hover'],
    tdColorStriped: semanticColors['color/surface/subtle'],
    tdColorSorting: semanticColors['color/interaction/selected'],
    tdTextColor: colors.textBody,
    loadingColor: colors.accent,
    thPaddingMedium: `${commonTokens.spacingSm} ${commonTokens.spacingMd}`,
    tdPaddingMedium: `${commonTokens.spacingSm} ${commonTokens.spacingMd}`,
  },

  Menu: {
    borderRadius: commonTokens.radiusMd,
    color: colors.bgCard,
    itemHeight: componentSizeTokens['component/navigation/item-height'],
    itemColorHover: semanticColors['color/interaction/hover'],
    itemColorActive: semanticColors['color/interaction/selected'],
    itemColorActiveHover: semanticColors['color/interaction/selected'],
    itemTextColor: colors.textBody,
    itemTextColorHover: colors.textMain,
    itemTextColorActive: colors.link,
    itemTextColorActiveHover: colors.linkHover,
    itemIconColor: colors.textLight,
    itemIconColorHover: colors.textMain,
    itemIconColorActive: colors.link,
    dividerColor: colors.border,
    fontSize: typographyTokens['font/size/body'],
  },

  Tabs: {
    barColor: colors.accent,
    tabTextColorLine: colors.textBody,
    tabTextColorHoverLine: colors.linkHover,
    tabTextColorActiveLine: colors.link,
    tabTextColorDisabledLine: colors.textDisabled,
    tabFontWeight: typographyTokens['font/weight/medium'],
    tabFontWeightActive: typographyTokens['font/weight/semibold'],
    tabFontSizeMedium: typographyTokens['font/size/body'],
    paneTextColor: colors.textBody,
  },

  Tag: {
    borderRadius: commonTokens.radiusSm,
    fontWeightStrong: typographyTokens['font/weight/medium'],
    textColor: semanticColors['color/status/draft/text'],
    color: semanticColors['color/status/draft/background'],
    border: `1px solid ${semanticColors['color/status/draft/border']}`,
    textColorInfo: colors.link,
    colorInfo: semanticColors['color/status/draft/background'],
    borderInfo: `1px solid ${colors.border}`,
    textColorSuccess: semanticColors['color/status/approved/text'],
    colorSuccess: semanticColors['color/status/approved/background'],
    borderSuccess: `1px solid ${semanticColors['color/status/approved/border']}`,
    textColorWarning: semanticColors['color/status/pending/text'],
    colorWarning: semanticColors['color/status/pending/background'],
    borderWarning: `1px solid ${semanticColors['color/status/pending/border']}`,
    textColorError: semanticColors['color/status/rejected/text'],
    colorError: semanticColors['color/status/rejected/background'],
    borderError: `1px solid ${semanticColors['color/status/rejected/border']}`,
  },

  Select: {
    menuBoxShadow: commonTokens.shadowLg,
    peers: {
      InternalSelection: {
        heightMedium: componentSizeTokens['component/control/height/medium'],
        borderRadius: commonTokens.radiusSm,
        textColor: colors.textBody,
        placeholderColor: colors.textLight,
        color: colors.bgCard,
        border: `1px solid ${colors.border}`,
        borderHover: `1px solid ${colors.primaryHover}`,
        borderFocus: `1px solid ${colors.primary}`,
        boxShadowFocus: `0 0 0 2px ${semanticColors['color/interaction/focus-ring']}33`,
      },
      InternalSelectMenu: {
        borderRadius: commonTokens.radiusMd,
        color: colors.bgCard,
        optionTextColor: colors.textBody,
        optionTextColorActive: colors.link,
        optionColorPending: semanticColors['color/interaction/hover'],
        optionColorActive: semanticColors['color/interaction/selected'],
        optionHeightMedium: componentSizeTokens['component/navigation/item-height'],
      },
    },
  },

  Pagination: {
    itemBorderRadius: commonTokens.radiusSm,
    itemSizeMedium: componentSizeTokens['component/control/height/small'],
    itemTextColor: colors.textBody,
    itemTextColorHover: colors.linkHover,
    itemTextColorActive: colors.link,
    itemColorHover: semanticColors['color/interaction/hover'],
    itemColorActive: semanticColors['color/interaction/selected'],
    itemBorder: `1px solid ${colors.border}`,
    itemBorderActive: `1px solid ${colors.link}`,
  },

  Modal: {
    color: semanticColors['color/surface/overlay'],
    textColor: colors.textBody,
    boxShadow: commonTokens.shadowXl,
  },

  Notification: {
    borderRadius: commonTokens.radiusLg,
    lineHeight: typographyTokens['line-height/body'],
    fontSize: typographyTokens['font/size/body'],
    headerFontWeight: typographyTokens['font/weight/semibold'],
    color: semanticColors['color/surface/overlay'],
    textColor: colors.textBody,
    headerTextColor: colors.textMain,
    descriptionTextColor: colors.textBody,
    iconColorInfo: colors.link,
    iconColorSuccess: semanticColors['color/status/approved/text'],
    iconColorWarning: semanticColors['color/status/pending/text'],
    iconColorError: semanticColors['color/status/rejected/text'],
    boxShadow: commonTokens.shadowLg,
  },

  Popover: {
    fontSize: typographyTokens['font/size/body'],
    borderRadius: commonTokens.radiusMd,
    color: semanticColors['color/surface/overlay'],
    dividerColor: colors.border,
    textColor: colors.textBody,
    boxShadow: commonTokens.shadowLg,
  },
})
const themeOverridesMap = new Map(
  themes.map((item) => [
    item.key,
    createThemeBridge(colorTokens[item.key], semanticColorTokens[item.key]),
  ]),
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
