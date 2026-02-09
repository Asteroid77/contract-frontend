/**
 * LocalStorage 键名常量
 * 统一管理所有 localStorage 的 key，避免魔法字符串
 */
export const STORAGE_KEYS = {
  /** 访问令牌 */
  ACCESS_TOKEN: 'ACCESS_TOKEN',
  /** 刷新令牌 */
  REFRESH_TOKEN: 'REFRESH_TOKEN',
  /** 语言偏好（用户手动选择） */
  APP_LOCALE: 'APP_LOCALE',
  /** 用户偏好设置 */
  USER_PREFERENCES: 'USER_PREFERENCES',
} as const

/**
 * SessionStorage 键名常量
 */
export const SESSION_KEYS = {
  /** 临时重定向路径 */
  REDIRECT_PATH: 'REDIRECT_PATH',
} as const
