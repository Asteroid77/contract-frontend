import dayjs from 'dayjs'

export function trimString(value: string): string
export function trimString(value: string | null | undefined): string | undefined
export function trimString(value: string | null | undefined): string | undefined {
  if (value == null) return undefined
  return value.trim()
}

export const trimToNull = (value: string | null | undefined): string | null => {
  if (value == null) return null
  const trimmed = value.trim()
  return trimmed === '' ? null : trimmed
}

export const nullToUndefined = <T>(value: T | null | undefined): T | undefined =>
  value ?? undefined

export const toTimestampOrNull = (value: string | null | undefined): number | null => {
  if (!value) return null
  const timestamp = new Date(value).getTime()
  return Number.isNaN(timestamp) ? null : timestamp
}

export const toDateTimeString = (value: number | null | undefined): string | null => {
  if (value == null) return null
  return dayjs(value).format('YYYY-MM-DD HH:mm:ss')
}

export const getPathTail = (value: string | null | undefined, delimiter = '/'): string => {
  if (!value) return ''
  if (!value.includes(delimiter)) return value
  const segments = value.split(delimiter)
  return segments[segments.length - 1] || ''
}

type WithId = { id: number }

export const mapItemIds = <T extends WithId>(items: T[] | null | undefined): number[] => {
  if (!Array.isArray(items)) return []
  return items.map((item) => item.id)
}
