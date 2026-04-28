import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  diffKeys,
  findEmptyStrings,
  findItemInTree,
  findPathInTree,
  findUndefined,
  getNaiveCssText,
  inspectPropsDefaults,
} from '@/modules/shared/presentation/utils'

type TreeItem = {
  key: string
  data: string
  label: string
  children?: TreeItem[]
}

const treeData: TreeItem[] = [
  {
    key: 'root-1',
    data: 'r1',
    label: '根节点1',
    children: [
      {
        key: 'child-1',
        data: 'c1',
        label: '子节点1',
      },
      {
        key: 'child-2',
        data: 'c2',
        label: '子节点2',
        children: [
          {
            key: 'leaf-1',
            data: 'l1',
            label: '叶子1',
          },
        ],
      },
    ],
  },
  {
    key: 'root-2',
    data: 'r2',
    label: '根节点2',
  },
]

describe('shared/presentation/utils', () => {
  beforeEach(() => {
    document.head.replaceChildren()
    vi.restoreAllMocks()
  })

  it('findItemInTree finds node by key/data/label and returns null when absent', () => {
    expect(findItemInTree(treeData, 'leaf-1', 'key')).toMatchObject({ key: 'leaf-1' })
    expect(findItemInTree(treeData, 'c2', 'data')).toMatchObject({ key: 'child-2' })
    expect(findItemInTree(treeData, '根节点2', 'label')).toMatchObject({ key: 'root-2' })
    expect(findItemInTree(treeData, 'missing', 'key')).toBeNull()
  })

  it('findPathInTree returns full path from root to matched node', () => {
    const path = findPathInTree(treeData, 'leaf-1', 'key')

    expect(path?.map((item) => item.key)).toEqual(['root-1', 'child-2', 'leaf-1'])
    expect(findPathInTree(treeData, 'missing', 'key')).toBeNull()
  })

  it('getNaiveCssText collects style text whose id starts with n-', () => {
    const styleA = document.createElement('style')
    styleA.id = 'n-global-styles'
    styleA.innerText = '.a{color:red;}'

    const styleB = document.createElement('style')
    styleB.id = 'other-style'
    styleB.innerText = '.b{color:blue;}'

    const styleC = document.createElement('style')
    styleC.id = 'n-styles'
    styleC.innerText = '.c{color:green;}'

    document.head.appendChild(styleA)
    document.head.appendChild(styleB)
    document.head.appendChild(styleC)

    expect(getNaiveCssText()).toBe('.a{color:red;}.c{color:green;}')
  })

  it('findEmptyStrings and findUndefined return matched entries', () => {
    const source = {
      a: '',
      b: undefined,
      c: 0,
      d: 'ok',
      e: '',
    }

    expect(findEmptyStrings(source)).toEqual([
      ['a', ''],
      ['e', ''],
    ])
    expect(findUndefined(source)).toEqual([['b', undefined]])
  })

  it('diffKeys returns keys only in each side', () => {
    const result = diffKeys(
      {
        a: 1,
        b: 2,
        c: 3,
      },
      {
        b: 2,
        d: 4,
      },
    )

    expect(result).toEqual({
      onlyInA: ['a', 'c'],
      onlyInB: ['d'],
    })
  })

  it('inspectPropsDefaults logs only props containing default field', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    inspectPropsDefaults({
      text: { type: Boolean, default: false },
      size: { type: String, default: 'medium' },
      requiredName: { type: String, required: true },
      nullable: null,
    })

    expect(logSpy).toHaveBeenCalledTimes(2)
    expect(logSpy).toHaveBeenNthCalledWith(1, 'text', '→', false)
    expect(logSpy).toHaveBeenNthCalledWith(2, 'size', '→', 'medium')
  })
})
