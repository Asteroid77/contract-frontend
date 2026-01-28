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
export const commonTokens = {
  // 圆角
  radiusSm: '4px',
  radiusMd: '8px',
  radiusLg: '12px',

  // --- 布局尺寸 ---
  siderWidth: '240px',
  siderCollapsedWidth: '64px',
  headerHeight: '64px',

  // --- 布局框架 (响应式) ---
  layoutMaxWidth: '1440px',          /* 框架最大宽度 */
  layoutContentMaxWidth: '1024px',   /* 内容阅读宽度 */
  layoutPaddingXMobile: '1rem',      /* 移动端页边距 */
  layoutPaddingXDesktop: '2rem',     /* 桌面端页边距 */

  // --- 间距系统 (4px Grid) ---
  spacingXs: '4px',   // 紧凑
  spacingSm: '8px',   // 小
  spacingMd: '16px',  // 标准
  spacingLg: '24px',  // 大
  spacingXl: '32px',  // 宽松
  spacing2Xl: '48px', // 超大

  // --- 语义化间距 ---
  paddingCard: '16px', // 统一卡片内边距
  gapFormItem: '24px', // 表单垂直间距

}
export const colorTokens = {
  light: {
    primary: '#334155', // slate-700
    primaryHover: '#475569', // slate-600
    primaryPressed: '#1e293b', // slate-800
    primarySuppl: '#334155', // slate-800
    // [副色/强调色] 深蓝 (Inter/Royal Blue)
    // 用于链接、选中状态、或者 Info 类型的提示
    accent: '#2563eb', // blue-600
    accentHover: '#1d4ed8', // blue-700 (加深)
    accentPressed: '#1e40af', // blue-800
    accentSuppl: '#2563eb', // blue-600
    // [背景] 极淡的灰白
    bgBody: '#f8fafc', // slate-50
    bgCard: '#ffffff', // 纯白
    // [文字]
    textMain: '#0f172a', // slate-900 (主标题)
    textBody: '#334155', // slate-700 (正文，深一点对比度更好)
    textLight: '#64748b', // slate-500 (辅助)
    textDisabled: '#cbd5e1', // slate-300
    // [边框]
    border: '#e2e8f0', // slate-200
  },
  dark: {
    // [主色] 在暗黑模式下，主色按钮通常反转为白色或极亮灰，以获得最高对比度
    primary: '#e2e8f0', // slate-200
    primaryHover: '#f1f5f9', // slate-100 (更亮)
    primaryPressed: '#94a3b8', // slate-400 (变暗)
    primarySuppl: '#e2e8f0',

    // [副色/强调色] 亮蓝，在深色背景下发光
    accent: '#3b82f6', // blue-500
    accentHover: '#60a5fa', // blue-400 (变亮)
    accentPressed: '#2563eb', // blue-600
    accentSuppl: '#3b82f6',

    // [背景]
    bgBody: '#020617', // slate-950
    bgCard: '#0f172a', // slate-900

    // [文字]
    textMain: '#f8fafc', // slate-50
    textBody: '#cbd5e1', // slate-300
    textLight: '#64748b', // slate-500
    textDisabled: '#334155', // slate-700

    // [边框]
    border: '#1e293b', // slate-800
  },
  sakura: {
    // [主色] 樱花粉
    primary: '#db2777',        // pink-600
    primaryHover: '#ec4899',   // pink-500 (变亮)
    primaryPressed: '#be185d', // pink-700
    primarySuppl: '#db2777',

    // [副色/强调色]: Amber/Gold Series (互补色)
    accent: '#f59e0b', // amber-500
    accentHover: '#fbbf24', // amber-400
    accentPressed: '#d97706', // amber-600
    accentSuppl: '#f59e0b',

    // [背景]
    bgBody: '#fff1f2', // rose-50
    bgCard: '#ffffff',

    // [文字]
    textMain: '#881337', // rose-900
    textBody: '#9f1239', // rose-800
    textLight: '#fb7185', // rose-400
    textDisabled: '#fecdd3', // rose-200

    // [边框]
    border: '#fbcfe8',
  },
} as const
