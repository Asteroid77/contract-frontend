import { match, P } from 'ts-pattern'
import type { FormItemRule } from 'naive-ui' // 假设使用 Element Plus
import { $t } from '@/_utils/i18n'

/**
 * 通用非空规则判断函数
 * @param value 要检查的值
 * @param options 配置选项
 * @returns 是否通过非空检查
 */
export function isNotEmpty<T>(
  value: T | null | undefined,
  options: {
    treatEmptyStringAsEmpty?: boolean
    treatWhitespaceAsEmpty?: boolean
    treatEmptyArrayAsEmpty?: boolean
    treatEmptyObjectAsEmpty?: boolean
    treatZeroAsEmpty?: boolean
    treatNaNAsEmpty?: boolean
    customValidator?: (val: T) => boolean
  } = {},
): boolean {
  const {
    treatEmptyStringAsEmpty = true,
    treatWhitespaceAsEmpty = true,
    treatEmptyArrayAsEmpty = true,
    treatEmptyObjectAsEmpty = true,
    treatZeroAsEmpty = false,
    treatNaNAsEmpty = true,
    customValidator,
  } = options

  // 检查 null 或 undefined
  if (value === null || value === undefined) {
    return false
  }

  // 使用自定义验证器（如果提供）
  if (customValidator && typeof customValidator === 'function') {
    return customValidator(value)
  }

  // 检查不同类型
  const type = typeof value

  // 字符串检查
  if (type === 'string') {
    const strValue = value as unknown as string
    if (treatEmptyStringAsEmpty && strValue === '') {
      return false
    }
    if (treatWhitespaceAsEmpty && strValue.trim() === '') {
      return false
    }
    return true
  }

  // 数字检查
  if (type === 'number') {
    if (treatZeroAsEmpty && value === 0) {
      return false
    }
    if (treatNaNAsEmpty && Number.isNaN(value)) {
      return false
    }
    return true
  }

  // 数组检查
  if (Array.isArray(value)) {
    return !treatEmptyArrayAsEmpty || value.length > 0
  }

  // 对象检查
  if (type === 'object') {
    // 处理 Map
    if (value instanceof Map) {
      return value.size > 0
    }

    // 处理 Set
    if (value instanceof Set) {
      return value.size > 0
    }

    // 处理 Date
    if (value instanceof Date) {
      return !Number.isNaN(value.getTime())
    }

    // 处理普通对象
    if (treatEmptyObjectAsEmpty && value.constructor === Object) {
      return Object.keys(value as object).length > 0
    }

    return true
  }

  // 其他类型（函数、布尔值等）默认为非空
  return true
}

/**
 * 支持多种类型的非空验证，并结合 ts-pattern 进行模式匹配
 *
 * @param rule 表单规则
 * @param field 字段名称
 * @param value 字段值
 * @param options 非空检查选项
 * @returns 验证错误信息或 undefined
 */
export const requireRule = (
  rule: FormItemRule,
  field: string,
  value: unknown,
  options: Parameters<typeof isNotEmpty>[1] = {},
): Error | true => {
  // 使用 isNotEmpty 函数进行基础检查
  if (!isNotEmpty(value, options)) {
    return new Error(`${field}${$t('common.notEmpty')}`)
  }

  // 使用 ts-pattern 进行更精细的类型检查
  return (
    match(value)
      .with(P.string, (str) => {
        if (
          (options.treatEmptyStringAsEmpty !== false && str === '') ||
          (options.treatWhitespaceAsEmpty !== false && str.trim() === '')
        ) {
          return new Error(`${field}${$t('common.notEmpty')}`)
        }
        return true
      })
      .with(P.number, (num) => {
        if (
          (options.treatZeroAsEmpty && num === 0) ||
          (options.treatNaNAsEmpty !== false && Number.isNaN(num))
        ) {
          return new Error(`${field}${$t('common.notEmpty')}`)
        }
        return true
      })
      .with(P.array(), (arr) => {
        if (options.treatEmptyArrayAsEmpty !== false && arr.length === 0) {
          return new Error(`${field}${$t('common.notEmpty')}`)
        }
        return true
      })
      .with(P.instanceOf(Map), (map) => {
        if (map.size === 0) {
          return new Error(`${field}${$t('common.notEmpty')}`)
        }
        return true
      })
      .with(P.instanceOf(Set), (set) => {
        if (set.size === 0) {
          return new Error(`${field}${$t('common.notEmpty')}`)
        }
        return true
      })
      // 使用 P.not 和 P.union 组合检查普通对象
      .with(
        P.not(
          P.union(
            P.array(),
            P.nullish,
            P.string,
            P.number,
            P.boolean,
            P.instanceOf(Map),
            P.instanceOf(Set),
          ),
        ),
        (obj) => {
          if (
            options.treatEmptyObjectAsEmpty !== false &&
            Object.keys(obj as object).length === 0
          ) {
            return new Error(`${field}${$t('common.notEmpty')}`)
          }
          return true
        },
      )
      .otherwise(() => true)
  )
}
