export type ColorTokens = {
  primary: string
  primaryHover: string
  primaryPressed: string
  primarySuppl: string
  bgBody: string
  bgCard: string
  textMain: string
  textBody: string
  textLight: string
  textDisabled: string
  accent: string
  accentHover: string
  accentPressed: string
  accentSuppl: string
  border: string
}

export type SemanticColorTokenKey =
  | 'color/primary/default'
  | 'color/primary/hover'
  | 'color/primary/pressed'
  | 'color/primary/suppl'
  | 'color/accent/default'
  | 'color/accent/hover'
  | 'color/accent/pressed'
  | 'color/accent/suppl'
  | 'color/background/body'
  | 'color/background/card'
  | 'color/text/main'
  | 'color/text/body'
  | 'color/text/light'
  | 'color/text/disabled'
  | 'color/border/default'
  | 'color/semantic/error'
  | 'color/semantic/success'

export const commonTokens = {
  // 圆角
  radiusSm: '0.25rem',
  radiusMd: '0.5rem',
  radiusLg: '0.75rem',
  radiusFull: '9999px',

  // --- 布局尺寸 ---
  siderWidth: '15rem',
  siderCollapsedWidth: '4rem',
  headerHeight: '4rem',

  // --- 布局框架 (响应式) ---
  layoutMaxWidth: '90rem',
  layoutContentMaxWidth: '75rem',
  layoutPaddingXMobile: '1rem',
  layoutPaddingXDesktop: '7.5rem',

  // --- 间距系统 (4px Grid) ---
  spacingXs: '0.25rem',
  spacingSm: '0.5rem',
  spacingMd: '1rem',
  spacingLg: '1.5rem',
  spacingXl: '2rem',
  spacing2Xl: '3rem',
  spacing3Xl: '4rem',
  spacing4Xl: '5rem',
  spacing5Xl: '7.5rem',

  // --- 语义化间距 ---
  paddingCard: '1rem', // 统一卡片内边距
  gapFormItem: '1.5rem', // 表单垂直间距

  // --- 字体系统 ---
  fontSans: "'Inter', 'Noto Sans SC', ui-sans-serif, -apple-system, BlinkMacSystemFont, sans-serif",
  fontMono: "'SFMono-Regular', Menlo, Consolas, 'PT Mono', 'Liberation Mono', Courier, monospace",

  // --- 阴影系统 ---
  shadowSm: '0 1px 2px rgba(0, 0, 0, 0.05)',
  shadowMd: '0 4px 8px rgba(0, 0, 0, 0.08)',
  shadowLg: '0 8px 16px rgba(0, 0, 0, 0.12)',
  shadowXl: '0 16px 32px rgba(0, 0, 0, 0.16)',
}

export const spacingScaleTokens: Record<`spacing/${number}`, string> = {
  'spacing/4': commonTokens.spacingXs,
  'spacing/8': commonTokens.spacingSm,
  'spacing/16': commonTokens.spacingMd,
  'spacing/24': commonTokens.spacingLg,
  'spacing/32': commonTokens.spacingXl,
  'spacing/48': commonTokens.spacing2Xl,
  'spacing/64': commonTokens.spacing3Xl,
  'spacing/80': commonTokens.spacing4Xl,
  'spacing/120': commonTokens.spacing5Xl,
}

export const primitiveColorTokens = {
  'slate-50': '#F8FAFC',
  'slate-100': '#F1F5F9',
  'slate-200': '#E2E8F0',
  'slate-300': '#CBD5E1',
  'slate-400': '#94A3B8',
  'slate-500': '#64748B',
  'slate-600': '#475569',
  'slate-700': '#334155',
  'slate-800': '#1E293B',
  'slate-900': '#0F172A',
  'slate-950': '#020617',
  'blue-400': '#60A5FA',
  'blue-500': '#3B82F6',
  'blue-600': '#2563EB',
  'blue-700': '#1D4ED8',
  'blue-800': '#1E40AF',
  'pink-500': '#EC4899',
  'pink-600': '#DB2777',
  'pink-700': '#BE185D',
  'amber-400': '#FBBF24',
  'amber-500': '#F59E0B',
  'amber-600': '#D97706',
  'rose-50': '#FFF1F2',
  'rose-200': '#FECDD3',
  'rose-400': '#FB7185',
  'rose-800': '#9F1239',
  'rose-900': '#881337',
  'red-400': '#F87171',
  'red-500': '#EF4444',
  'green-400': '#4ADE80',
  'green-500': '#22C55E',
  white: '#FFFFFF',
} as const

export const colorTokens = {
  light: {
    primary: '#334155', // slate-700
    primaryHover: '#475569', // slate-600
    primaryPressed: '#1E293B', // slate-800
    primarySuppl: '#334155', // slate-700
    // [副色/强调色] 深蓝 (Inter/Royal Blue)
    // 用于链接、选中状态、或者 Info 类型的提示
    accent: '#2563EB', // blue-600
    accentHover: '#1D4ED8', // blue-700 (加深)
    accentPressed: '#1E40AF', // blue-800
    accentSuppl: '#2563EB', // blue-600
    // [背景] 极淡的灰白
    bgBody: '#F8FAFC', // slate-50
    bgCard: '#FFFFFF', // 纯白
    // [文字]
    textMain: '#0F172A', // slate-900 (主标题)
    textBody: '#334155', // slate-700 (正文，深一点对比度更好)
    textLight: '#64748B', // slate-500 (辅助)
    textDisabled: '#CBD5E1', // slate-300
    // [边框]
    border: '#E2E8F0', // slate-200
  },
  dark: {
    // [主色] 在暗黑模式下，主色按钮通常反转为白色或极亮灰，以获得最高对比度
    primary: '#E2E8F0', // slate-200
    primaryHover: '#F1F5F9', // slate-100 (更亮)
    primaryPressed: '#94A3B8', // slate-400 (变暗)
    primarySuppl: '#E2E8F0',

    // [副色/强调色] 亮蓝，在深色背景下发光
    accent: '#3B82F6', // blue-500
    accentHover: '#60A5FA', // blue-400 (变亮)
    accentPressed: '#2563EB', // blue-600
    accentSuppl: '#3B82F6',

    // [背景]
    bgBody: '#020617', // slate-950
    bgCard: '#0F172A', // slate-900

    // [文字]
    textMain: '#F8FAFC', // slate-50
    textBody: '#CBD5E1', // slate-300
    textLight: '#64748B', // slate-500
    textDisabled: '#334155', // slate-700

    // [边框]
    border: '#1E293B', // slate-800
  },
  sakura: {
    // [主色] 樱花粉
    primary: '#DB2777', // pink-600
    primaryHover: '#EC4899', // pink-500 (变亮)
    primaryPressed: '#BE185D', // pink-700
    primarySuppl: '#DB2777',

    // [副色/强调色]: Amber/Gold Series (互补色)
    accent: '#F59E0B', // amber-500
    accentHover: '#FBBF24', // amber-400
    accentPressed: '#D97706', // amber-600
    accentSuppl: '#F59E0B',

    // [背景]
    bgBody: '#FFF1F2', // rose-50
    bgCard: '#FFFFFF',

    // [文字]
    textMain: '#881337', // rose-900
    textBody: '#9F1239', // rose-800
    textLight: '#FB7185', // rose-400
    textDisabled: '#FECDD3', // rose-200

    // [边框]
    border: '#FBCFE8',
  },
} as const

type ThemeName = keyof typeof colorTokens

export const semanticColorTokens: Record<ThemeName, Record<SemanticColorTokenKey, string>> = {
  light: {
    'color/primary/default': colorTokens.light.primary,
    'color/primary/hover': colorTokens.light.primaryHover,
    'color/primary/pressed': colorTokens.light.primaryPressed,
    'color/primary/suppl': colorTokens.light.primarySuppl,
    'color/accent/default': colorTokens.light.accent,
    'color/accent/hover': colorTokens.light.accentHover,
    'color/accent/pressed': colorTokens.light.accentPressed,
    'color/accent/suppl': colorTokens.light.accentSuppl,
    'color/background/body': colorTokens.light.bgBody,
    'color/background/card': colorTokens.light.bgCard,
    'color/text/main': colorTokens.light.textMain,
    'color/text/body': colorTokens.light.textBody,
    'color/text/light': colorTokens.light.textLight,
    'color/text/disabled': colorTokens.light.textDisabled,
    'color/border/default': colorTokens.light.border,
    'color/semantic/error': primitiveColorTokens['red-500'],
    'color/semantic/success': primitiveColorTokens['green-500'],
  },
  dark: {
    'color/primary/default': colorTokens.dark.primary,
    'color/primary/hover': colorTokens.dark.primaryHover,
    'color/primary/pressed': colorTokens.dark.primaryPressed,
    'color/primary/suppl': colorTokens.dark.primarySuppl,
    'color/accent/default': colorTokens.dark.accent,
    'color/accent/hover': colorTokens.dark.accentHover,
    'color/accent/pressed': colorTokens.dark.accentPressed,
    'color/accent/suppl': colorTokens.dark.accentSuppl,
    'color/background/body': colorTokens.dark.bgBody,
    'color/background/card': colorTokens.dark.bgCard,
    'color/text/main': colorTokens.dark.textMain,
    'color/text/body': colorTokens.dark.textBody,
    'color/text/light': colorTokens.dark.textLight,
    'color/text/disabled': colorTokens.dark.textDisabled,
    'color/border/default': colorTokens.dark.border,
    'color/semantic/error': primitiveColorTokens['red-400'],
    'color/semantic/success': primitiveColorTokens['green-400'],
  },
  sakura: {
    'color/primary/default': colorTokens.sakura.primary,
    'color/primary/hover': colorTokens.sakura.primaryHover,
    'color/primary/pressed': colorTokens.sakura.primaryPressed,
    'color/primary/suppl': colorTokens.sakura.primarySuppl,
    'color/accent/default': colorTokens.sakura.accent,
    'color/accent/hover': colorTokens.sakura.accentHover,
    'color/accent/pressed': colorTokens.sakura.accentPressed,
    'color/accent/suppl': colorTokens.sakura.accentSuppl,
    'color/background/body': colorTokens.sakura.bgBody,
    'color/background/card': colorTokens.sakura.bgCard,
    'color/text/main': colorTokens.sakura.textMain,
    'color/text/body': colorTokens.sakura.textBody,
    'color/text/light': colorTokens.sakura.textLight,
    'color/text/disabled': colorTokens.sakura.textDisabled,
    'color/border/default': colorTokens.sakura.border,
    'color/semantic/error': primitiveColorTokens['red-500'],
    'color/semantic/success': primitiveColorTokens['green-500'],
  },
}
