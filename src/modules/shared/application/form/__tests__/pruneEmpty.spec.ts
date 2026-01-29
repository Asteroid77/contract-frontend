import { describe, it, expect } from 'vitest'
import { pruneEmpty } from '@/modules/shared/application/form'

describe('pruneEmpty - 数据清洗工具', () => {
  // 1. 基础空值测试
  it('应该返回 undefined 对于基础空值 (null, undefined, "", NaN)', () => {
    expect(pruneEmpty(null)).toBeUndefined()
    expect(pruneEmpty(undefined)).toBeUndefined()
    expect(pruneEmpty('')).toBeUndefined()
    expect(pruneEmpty(NaN)).toBeUndefined()
  })

  // 2. 基础有效值测试
  it('应该保留有效值 (字符串, 非空数字, true)', () => {
    expect(pruneEmpty('hello')).toBe('hello')
    expect(pruneEmpty(123)).toBe(123)
    expect(pruneEmpty(true)).toBe(true)
  })

  // 3. 关键边界值测试 (0 和 false)
  it('应该保留 0 和 false (重要)', () => {
    const input = {
      price: 0,
      discount: null,
      isActive: false,
      hasStock: undefined,
    }
    // 期望: 0 和 false 被保留，null 和 undefined 被移除
    expect(pruneEmpty(input)).toEqual({
      price: 0,
      isActive: false,
    })
  })

  // 4. 数组清洗测试
  it('应该清洗数组中的空项，并移除最终变为空的数组', () => {
    const input = {
      // 情况 A: 混合内容 -> 移除 null，保留 1, 2
      validList: [1, null, 2, undefined, ''],

      // 情况 B: 全是空值 -> 数组变空 [] -> 键名被移除
      emptyList: [null, undefined, ''],

      // 情况 C: 对象数组 -> 移除变成了 {} 的对象
      objList: [
        { id: 1 },
        { id: null }, // 这个对象会被清洗成 undefined，然后从数组移除
        { name: 'test' },
      ],
    }

    expect(pruneEmpty(input)).toEqual({
      validList: [1, 2],
      objList: [{ id: 1 }, { name: 'test' }],
    })
  })

  // 5. 深度递归测试 (洋葱模型)
  it('应该递归移除嵌套的空对象', () => {
    const input = {
      level1: {
        level2: {
          level3: null, // 最内层是空
          level3_b: '',
        },
        // level2 变成了 {} -> level1 变成了 {} -> 整个返回 undefined
      },
      keepMe: {
        valid: 'yes',
      },
    }

    // level1 这一枝应该完全消失
    expect(pruneEmpty(input)).toEqual({
      keepMe: {
        valid: 'yes',
      },
    })
  })

  // 6. 特殊对象测试
  it('应该保留 Date 等特殊对象', () => {
    const now = new Date()
    const input = {
      createTime: now,
      updateTime: null,
    }
    expect(pruneEmpty(input)).toEqual({
      createTime: now,
    })
  })

  // 7. 模拟真实业务场景 (ServiceAgreement)
  it('真实业务场景模拟: 清洗包含大量默认值的表单', () => {
    const formModel = {
      id: '', // 应该被移除
      customerInfo: {
        status: 1,
        name: '张三',
        remark: '', // 应该被移除
      },
      // signInfo 内部全是 null，应该整个 signInfo 字段都消失
      signInfo: {
        priceModel: null,
        fixedPrice: undefined,
      },
      attachmentInfo: {
        // 空数组应该被移除
        billFiles: [],
        contractFiles: [{ id: 101, url: 'http://...' }],
      },
    }

    const result = pruneEmpty(formModel)

    expect(result).toEqual({
      customerInfo: {
        status: 1,
        name: '张三',
      },
      attachmentInfo: {
        contractFiles: [{ id: 101, url: 'http://...' }],
      },
    })

    // 验证 signInfo 是否真的没了
    expect(result).not.toHaveProperty('signInfo')
  })
})
