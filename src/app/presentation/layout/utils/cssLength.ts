const FALLBACK_ROOT_FONT_SIZE = 16

const getRootFontSize = () => {
  if (typeof window === 'undefined') return FALLBACK_ROOT_FONT_SIZE

  const rootFontSize = Number.parseFloat(getComputedStyle(document.documentElement).fontSize)
  return Number.isFinite(rootFontSize) ? rootFontSize : FALLBACK_ROOT_FONT_SIZE
}

export const parseCssLengthToPx = (value: string) => {
  const numeric = Number.parseFloat(value)
  if (!Number.isFinite(numeric)) return 0

  if (value.trim().endsWith('rem')) {
    return Math.round(numeric * getRootFontSize())
  }

  return Math.round(numeric)
}
