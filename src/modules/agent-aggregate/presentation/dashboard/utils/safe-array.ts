export const safeArray = <T,>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : [])
