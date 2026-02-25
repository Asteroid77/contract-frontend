import { describe, expect, it, vi } from 'vitest'
import { isVNode, type VNode } from 'vue'

vi.mock('@/_utils/i18n', () => ({
  $t: (key: string) => key,
}))

import { ApprovalPrintFieldRenderUtil } from '@/modules/approval/application/print/ApprovalPrintFieldRenderUtil'

type MockData = {
  name?: string | null
  amount?: number
  tags?: string[]
}

describe('ApprovalPrintFieldRenderUtil', () => {
  it('returns formatted new value directly when oldData is null', () => {
    const util = new ApprovalPrintFieldRenderUtil<MockData>(
      {
        amount: 120,
      },
      null,
    )

    const result = util.render('amount', (val) => Number(val) * 2)

    expect(result).toBe(240)
  })

  it('returns default placeholder when new value is null and oldData is null', () => {
    const util = new ApprovalPrintFieldRenderUtil<MockData>(
      {
        name: null,
      },
      null,
    )

    const result = util.render('name')

    expect(result).toBe('-')
  })

  it('returns formatted value without diff when primitive value is unchanged', () => {
    const formatter = vi.fn((val: unknown) => `value:${String(val)}`)
    const util = new ApprovalPrintFieldRenderUtil<MockData>(
      {
        name: 'alice',
      },
      {
        name: 'alice',
      },
    )

    const result = util.render('name', formatter)

    expect(result).toBe('value:alice')
    expect(formatter).toHaveBeenCalledTimes(1)
  })

  it('returns formatted value without diff when deep-equal values are unchanged', () => {
    const util = new ApprovalPrintFieldRenderUtil<MockData>(
      {
        tags: ['A', 'B'],
      },
      {
        tags: ['A', 'B'],
      },
    )

    const result = util.render('tags', (val) => (Array.isArray(val) ? val.join(',') : '-'))

    expect(result).toBe('A,B')
  })

  it('returns diff vnode with new and old display values when value changed', () => {
    const util = new ApprovalPrintFieldRenderUtil<MockData>(
      {
        name: 'new-name',
      },
      {
        name: 'old-name',
      },
    )

    const result = util.render('name')

    expect(isVNode(result)).toBe(true)

    const vnode = result as VNode
    expect(vnode.type).toBe('span')
    expect(vnode.props?.class).toBe('diff-container')

    const children = vnode.children as VNode[]
    expect(children).toHaveLength(2)
    expect(children[0]?.props?.class).toBe('diff-new')
    expect(JSON.stringify(children[0]?.children)).toContain('new-name')
    expect(children[1]?.props?.class).toBe('diff-old')

    const oldText = JSON.stringify(children[1]?.children)
    expect(oldText).toContain('common.label.original')
    expect(oldText).toContain('old-name')
  })
})
