/**
 * 判断值是否被视为“空”
 * @param value 任意值
 * @returns boolean
 */
function isEmptyValue(value: unknown): boolean {
  // 1. null 和 undefined 肯定是空
  if (value === null || value === undefined) {
    return true
  }
  // 2. 空字符串通常也视为空 (如果你想保留空字符串，请注释掉这一行)
  if (typeof value === 'string' && value.trim() === '') {
    return true
  }
  // 3. NaN 视为空
  if (typeof value === 'number' && isNaN(value)) {
    return true
  }
  // 注意：数字 0 和 布尔 false 不是空，必须保留！
  return false
}

/**
 * 深度递归剔除对象/数组中的空值
 * 规则：
 * 1. 剔除 null, undefined, NaN, ''
 * 2. 剔除空数组 []
 * 3. 剔除空对象 {}
 * 4. 如果一个对象经过剔除后变成了 {}，那么它自己也会被剔除
 *
 * @param obj 输入对象或数组
 * @returns 清洗后的对象，如果整体为空则返回 undefined
 */
export function pruneEmpty<T>(obj: T): T | undefined {
  // 1. 基础数据类型处理
  if (isEmptyValue(obj)) {
    return undefined
  }

  // 2. 如果不是对象（是 number, boolean, string, symbol 等有效值），直接返回
  if (typeof obj !== 'object') {
    return obj
  }

  // 3. 特殊对象保留：Date, File, Blob, RegExp 等不应该被遍历清理
  if (
    obj instanceof Date ||
    obj instanceof RegExp ||
    (typeof File !== 'undefined' && obj instanceof File) ||
    (typeof Blob !== 'undefined' && obj instanceof Blob)
  ) {
    return obj
  }

  // 4. 处理数组
  if (Array.isArray(obj)) {
    const newArr = obj
      .map((item) => pruneEmpty(item)) // 递归清理子项
      .filter((item) => item !== undefined) // 移除 undefined 的项

    // 如果数组变空了，整体返回 undefined
    return newArr.length > 0 ? (newArr as unknown as T) : undefined
  }

  // 5. 处理普通对象
  const newObj: Record<string, unknown> = {}
  let hasValidKey = false

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key]
      const cleanedValue = pruneEmpty(value) // 递归清理

      // 只有当值有效时才保留键
      if (cleanedValue !== undefined) {
        newObj[key] = cleanedValue
        hasValidKey = true
      }
    }
  }

  // 如果对象所有属性都被剔除了（变成了 {}），整体返回 undefined
  return hasValidKey ? (newObj as T) : undefined
}

/**
 * 清洗 Vue props Proxy
 * 过滤掉空字符串，解决 Naive UI 组件默认值问题
 */
export function cleanProps<T extends Record<string, unknown>>(props: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(props).filter(([_, v]) => v !== undefined && v !== ''),
  ) as Partial<T>
}

/**
 * 将表单草稿数据转换为提交数据（清洗空值）
 * - requiredKeys 为空时，只做清洗
 * - requiredKeys 提供时，缺失则返回 null
 */
export function buildSubmitData<T extends object, K extends keyof T = keyof T>(
  formData: FormInput<T>,
  requiredKeys: readonly K[] = [],
): (ValidatedFormData<T> & Required<Pick<T, K>>) | null {
  const cleaned = pruneEmpty(formData)
  const submitData = (cleaned ?? {}) as Record<string, unknown>
  if (requiredKeys.length > 0) {
    const missing = requiredKeys.filter((key) => submitData[key as string] === undefined)
    if (missing.length > 0) return null
  }
  return submitData as ValidatedFormData<T> & Required<Pick<T, K>>
}

export { useSubscribeForm } from './useSubscribeForm'
