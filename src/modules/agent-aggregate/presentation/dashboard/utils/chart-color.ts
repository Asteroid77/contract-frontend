export const chartColor = (name: string, fallback: string): string => {
  if (typeof document === 'undefined') {
    return fallback
  }

  const resolved = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return resolved || fallback
}
