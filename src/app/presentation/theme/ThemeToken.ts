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
  surfaceRaised: string
  surfaceSubtle: string
  surfaceOverlay: string
  fillHover: string
  fillSelected: string
  focusRing: string
  link: string
  linkHover: string
  warning: string
}

export const statusToneNames = ['draft', 'pending', 'approved', 'rejected', 'archived'] as const
export type StatusTone = (typeof statusToneNames)[number]
export type StatusTonePart = 'text' | 'background' | 'border'

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
  | 'color/semantic/warning'
  | 'color/surface/raised'
  | 'color/surface/subtle'
  | 'color/surface/overlay'
  | 'color/interaction/hover'
  | 'color/interaction/selected'
  | 'color/interaction/focus-ring'
  | 'color/link/default'
  | 'color/link/hover'
  | `color/status/${StatusTone}/${StatusTonePart}`

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

export const typographyTokens = {
  'font/size/xs': '0.75rem',
  'font/size/sm': '0.8125rem',
  'font/size/body': '0.875rem',
  'font/size/title': '1.25rem',
  'font/size/heading': '1.5rem',
  'font/weight/regular': '400',
  'font/weight/medium': '500',
  'font/weight/semibold': '600',
  'line-height/tight': '1.25',
  'line-height/body': '1.6',
  'line-height/heading': '1.3',
} as const

export const componentSizeTokens = {
  'component/control/height/small': '2rem',
  'component/control/height/medium': '2.25rem',
  'component/control/height/large': '2.5rem',
  'component/table/header-height': '2.75rem',
  'component/table/row-height': '3rem',
  'component/navigation/item-height': '2.5rem',
  'component/interactive/min-target': '1.5rem',
} as const

export const motionTokens = {
  'motion/duration/fast': '120ms',
  'motion/duration/base': '180ms',
  'motion/duration/slow': '240ms',
  'motion/easing/standard': 'cubic-bezier(0.4, 0, 0.2, 1)',
  'motion/easing/enter': 'cubic-bezier(0, 0, 0.2, 1)',
  'motion/easing/exit': 'cubic-bezier(0.4, 0, 1, 1)',
  'motion/transition/fast': '120ms cubic-bezier(0.4, 0, 0.2, 1)',
  'motion/transition/base': '180ms cubic-bezier(0.4, 0, 0.2, 1)',
  'motion/transition/slow': '240ms cubic-bezier(0.4, 0, 0.2, 1)',
} as const

export const layerTokens = {
  'layer/base': '0',
  'layer/sticky': '100',
  'layer/dropdown': '1000',
  'layer/popover': '1100',
  'layer/modal': '1200',
  'layer/notification': '1300',
  'layer/tooltip': '1400',
  'layer/loading': '1500',
} as const

export const opacityTokens = {
  'opacity/disabled': '0.48',
  'opacity/muted': '0.64',
  'opacity/overlay': '0.72',
  'opacity/loading': '0.72',
  'opacity/dragging': '0.8',
} as const

export const elevationTokens = {
  'elevation/surface': 'none',
  'elevation/card': commonTokens.shadowSm,
  'elevation/floating': commonTokens.shadowMd,
  'elevation/popover': commonTokens.shadowLg,
  'elevation/modal': commonTokens.shadowXl,
} as const

export const borderTokens = {
  'border/width/default': '1px',
  'border/width/focus': '0.125rem',
  'border/style/default': 'solid',
  'border/style/focus': 'solid',
  'border/focus-ring-width': '0.125rem',
} as const

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
  'blue-50': '#EFF6FF',
  'blue-100': '#DBEAFE',
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
  'amber-700': '#B45309',
  'amber-50': '#FFFBEB',
  'amber-200': '#FDE68A',
  'amber-950': '#451A03',
  'rose-50': '#FFF1F2',
  'rose-200': '#FECDD3',
  'rose-400': '#FB7185',
  'rose-800': '#9F1239',
  'rose-900': '#881337',
  'red-50': '#FEF2F2',
  'red-200': '#FECACA',
  'red-400': '#F87171',
  'red-500': '#EF4444',
  'red-700': '#B91C1C',
  'red-950': '#450A0A',
  'green-50': '#F0FDF4',
  'green-200': '#BBF7D0',
  'green-400': '#4ADE80',
  'green-500': '#22C55E',
  'green-700': '#15803D',
  'green-950': '#052E16',
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
    surfaceRaised: '#FFFFFF',
    surfaceSubtle: '#F1F5F9',
    surfaceOverlay: '#FFFFFF',
    fillHover: '#F8FAFC',
    fillSelected: '#EFF6FF',
    focusRing: '#2563EB',
    link: '#2563EB',
    linkHover: '#1D4ED8',
    warning: '#B45309',
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
    surfaceRaised: '#0F172A',
    surfaceSubtle: '#1E293B',
    surfaceOverlay: '#020617',
    fillHover: '#1E293B',
    fillSelected: '#1E3A8A',
    focusRing: '#60A5FA',
    link: '#60A5FA',
    linkHover: '#93C5FD',
    warning: '#FBBF24',
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
    surfaceRaised: '#FFFFFF',
    surfaceSubtle: '#FFF1F2',
    surfaceOverlay: '#FFFFFF',
    fillHover: '#FFF1F2',
    fillSelected: '#FECDD3',
    focusRing: '#DB2777',
    link: '#DB2777',
    linkHover: '#BE185D',
    warning: '#B45309',
  },
} as const

export type ThemeName = keyof typeof colorTokens
export const themeNames = ['light', 'dark', 'sakura'] as const satisfies readonly ThemeName[]

export type StatusToneTokens = Record<StatusTonePart, string>

export const statusColorTokens: Record<ThemeName, Record<StatusTone, StatusToneTokens>> = {
  light: {
    draft: {
      text: primitiveColorTokens['slate-700'],
      background: primitiveColorTokens['slate-100'],
      border: primitiveColorTokens['slate-200'],
    },
    pending: {
      text: primitiveColorTokens['amber-700'],
      background: primitiveColorTokens['amber-50'],
      border: primitiveColorTokens['amber-200'],
    },
    approved: {
      text: primitiveColorTokens['green-700'],
      background: primitiveColorTokens['green-50'],
      border: primitiveColorTokens['green-200'],
    },
    rejected: {
      text: primitiveColorTokens['red-700'],
      background: primitiveColorTokens['red-50'],
      border: primitiveColorTokens['red-200'],
    },
    archived: {
      text: primitiveColorTokens['slate-600'],
      background: primitiveColorTokens['slate-100'],
      border: primitiveColorTokens['slate-300'],
    },
  },
  dark: {
    draft: {
      text: primitiveColorTokens['slate-300'],
      background: primitiveColorTokens['slate-800'],
      border: primitiveColorTokens['slate-700'],
    },
    pending: {
      text: primitiveColorTokens['amber-400'],
      background: primitiveColorTokens['amber-950'],
      border: primitiveColorTokens['amber-600'],
    },
    approved: {
      text: primitiveColorTokens['green-400'],
      background: primitiveColorTokens['green-950'],
      border: primitiveColorTokens['green-500'],
    },
    rejected: {
      text: primitiveColorTokens['red-400'],
      background: primitiveColorTokens['red-950'],
      border: primitiveColorTokens['red-500'],
    },
    archived: {
      text: primitiveColorTokens['slate-400'],
      background: primitiveColorTokens['slate-900'],
      border: primitiveColorTokens['slate-700'],
    },
  },
  sakura: {
    draft: {
      text: primitiveColorTokens['rose-800'],
      background: primitiveColorTokens['rose-50'],
      border: primitiveColorTokens['rose-200'],
    },
    pending: {
      text: primitiveColorTokens['amber-700'],
      background: primitiveColorTokens['amber-50'],
      border: primitiveColorTokens['amber-200'],
    },
    approved: {
      text: primitiveColorTokens['green-700'],
      background: primitiveColorTokens['green-50'],
      border: primitiveColorTokens['green-200'],
    },
    rejected: {
      text: primitiveColorTokens['red-700'],
      background: primitiveColorTokens['red-50'],
      border: primitiveColorTokens['red-200'],
    },
    archived: {
      text: primitiveColorTokens['slate-600'],
      background: primitiveColorTokens['rose-50'],
      border: primitiveColorTokens['rose-200'],
    },
  },
}

function createSemanticColorTokens(
  colors: ColorTokens,
  statuses: Record<StatusTone, StatusToneTokens>,
  signalColors: Pick<Record<'success' | 'error', string>, 'success' | 'error'>,
): Record<SemanticColorTokenKey, string> {
  return {
    'color/primary/default': colors.primary,
    'color/primary/hover': colors.primaryHover,
    'color/primary/pressed': colors.primaryPressed,
    'color/primary/suppl': colors.primarySuppl,
    'color/accent/default': colors.accent,
    'color/accent/hover': colors.accentHover,
    'color/accent/pressed': colors.accentPressed,
    'color/accent/suppl': colors.accentSuppl,
    'color/background/body': colors.bgBody,
    'color/background/card': colors.bgCard,
    'color/text/main': colors.textMain,
    'color/text/body': colors.textBody,
    'color/text/light': colors.textLight,
    'color/text/disabled': colors.textDisabled,
    'color/border/default': colors.border,
    'color/semantic/error': signalColors.error,
    'color/semantic/success': signalColors.success,
    'color/semantic/warning': colors.warning,
    'color/surface/raised': colors.surfaceRaised,
    'color/surface/subtle': colors.surfaceSubtle,
    'color/surface/overlay': colors.surfaceOverlay,
    'color/interaction/hover': colors.fillHover,
    'color/interaction/selected': colors.fillSelected,
    'color/interaction/focus-ring': colors.focusRing,
    'color/link/default': colors.link,
    'color/link/hover': colors.linkHover,
    'color/status/draft/text': statuses.draft.text,
    'color/status/draft/background': statuses.draft.background,
    'color/status/draft/border': statuses.draft.border,
    'color/status/pending/text': statuses.pending.text,
    'color/status/pending/background': statuses.pending.background,
    'color/status/pending/border': statuses.pending.border,
    'color/status/approved/text': statuses.approved.text,
    'color/status/approved/background': statuses.approved.background,
    'color/status/approved/border': statuses.approved.border,
    'color/status/rejected/text': statuses.rejected.text,
    'color/status/rejected/background': statuses.rejected.background,
    'color/status/rejected/border': statuses.rejected.border,
    'color/status/archived/text': statuses.archived.text,
    'color/status/archived/background': statuses.archived.background,
    'color/status/archived/border': statuses.archived.border,
  }
}

export const semanticColorTokens: Record<ThemeName, Record<SemanticColorTokenKey, string>> = {
  light: createSemanticColorTokens(colorTokens.light, statusColorTokens.light, {
    error: primitiveColorTokens['red-500'],
    success: primitiveColorTokens['green-500'],
  }),
  dark: createSemanticColorTokens(colorTokens.dark, statusColorTokens.dark, {
    error: primitiveColorTokens['red-400'],
    success: primitiveColorTokens['green-400'],
  }),
  sakura: createSemanticColorTokens(colorTokens.sakura, statusColorTokens.sakura, {
    error: primitiveColorTokens['red-500'],
    success: primitiveColorTokens['green-500'],
  }),
}
