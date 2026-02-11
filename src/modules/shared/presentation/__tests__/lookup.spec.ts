import { describe, expect, it, vi } from 'vitest'
import { SelectLookup, TreeLookup } from '@/modules/shared/presentation/lookup'

describe('SelectLookup', () => {
  it('returns mapped label for existing value', () => {
    const lookup = new SelectLookup([
      { label: '启用', value: true },
      { label: '禁用', value: false },
      { label: '管理员', value: 'admin' },
    ])

    expect(lookup.getLabel(true)).toBe('启用')
    expect(lookup.getLabel(false)).toBe('禁用')
    expect(lookup.getLabel('admin')).toBe('管理员')
  })

  it('returns empty string for empty input values', () => {
    const lookup = new SelectLookup([{ label: 'A', value: 'a' }])

    expect(lookup.getLabel(undefined)).toBe('')
    expect(lookup.getLabel(null)).toBe('')
    expect(lookup.getLabel('')).toBe('')
  })

  it('returns value string when missing and showValueIfMissing is true', () => {
    const lookup = new SelectLookup([{ label: 'A', value: 'a' }])

    expect(lookup.getLabel('missing')).toBe('missing')
    expect(lookup.getLabel(100)).toBe('100')
  })

  it('returns empty string when missing and showValueIfMissing is false', () => {
    const lookup = new SelectLookup([{ label: 'A', value: 'a' }])

    expect(lookup.getLabel('missing', false)).toBe('')
  })

  it('overrides duplicated value with latest label', () => {
    const lookup = new SelectLookup([
      { label: '旧标签', value: 1 },
      { label: '新标签', value: 1 },
    ])

    expect(lookup.getLabel(1)).toBe('新标签')
  })

  it('does not throw when constructed with empty options', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    const lookup = new SelectLookup([])

    expect(lookup.getLabel('x')).toBe('x')
    expect(logSpy).toHaveBeenCalled()
  })
})

describe('TreeLookup', () => {
  const treeData = [
    {
      key: 'p1',
      label: '父节点',
      children: [
        {
          key: 'c1',
          label: '子节点',
          children: [{ key: 'l1', label: '叶子节点' }],
        },
      ],
    },
    {
      key: 'p2',
      label: '第二父节点',
    },
  ]

  it('returns single label by key and falls back to key when missing', () => {
    const lookup = new TreeLookup(treeData)

    expect(lookup.getLabel('c1')).toBe('子节点')
    expect(lookup.getLabel('missing')).toBe('missing')
    expect(lookup.getLabel('')).toBe('')
  })

  it('returns full path with default separator', () => {
    const lookup = new TreeLookup(treeData)

    expect(lookup.getFullPath('l1')).toBe('父节点-子节点-叶子节点')
    expect(lookup.getFullPath('p2')).toBe('第二父节点')
  })

  it('returns full path with custom separator', () => {
    const lookup = new TreeLookup(treeData, ' / ')

    expect(lookup.getFullPath('l1')).toBe('父节点 / 子节点 / 叶子节点')
  })

  it('falls back to key for missing full path and empty key returns empty string', () => {
    const lookup = new TreeLookup(treeData)

    expect(lookup.getFullPath('unknown')).toBe('unknown')
    expect(lookup.getFullPath('')).toBe('')
  })
})
