import { describe, expect, it } from 'vitest'
import { DiffService } from '@/modules/shared/presentation/diff-check/domain/services/diffService'
import type {
  FieldDefinition,
  FormData,
  OssCallbackView,
} from '@/modules/shared/presentation/diff-check/domain/types/field'

const createFile = (overrides: Partial<OssCallbackView> = {}): OssCallbackView => ({
  id: 1,
  fileName: 'contract.pdf',
  fileType: 'application/pdf',
  fileSize: 1024,
  ossObjectKey: 'obj-1',
  accessUrl: 'https://example.com/contract.pdf',
  ...overrides,
})

describe('DiffService basic comparators', () => {
  it('isEmpty handles null/undefined/blank string/empty array', () => {
    expect(DiffService.isEmpty(null)).toBe(true)
    expect(DiffService.isEmpty(undefined)).toBe(true)
    expect(DiffService.isEmpty('   ')).toBe(true)
    expect(DiffService.isEmpty([] as never)).toBe(true)

    expect(DiffService.isEmpty('0')).toBe(false)
    expect(DiffService.isEmpty(0)).toBe(false)
    expect(DiffService.isEmpty([1] as never)).toBe(false)
  })

  it('isEqual compares by strict value / array json / string cast', () => {
    expect(DiffService.isEqual(1, 1)).toBe(true)
    expect(DiffService.isEqual(null, undefined)).toBe(true)
    expect(DiffService.isEqual([1, 2] as never, [1, 2] as never)).toBe(true)
    expect(DiffService.isEqual([1, 2] as never, [2, 1] as never)).toBe(false)
    expect(DiffService.isEqual(1 as never, '1' as never)).toBe(true)
    expect(DiffService.isEqual('a', 'b')).toBe(false)
  })

  it('getDiffType returns added/removed/modified/unchanged correctly', () => {
    expect(DiffService.getDiffType(undefined, undefined)).toBe('unchanged')
    expect(DiffService.getDiffType(undefined, 'x')).toBe('added')
    expect(DiffService.getDiffType('x', undefined)).toBe('removed')
    expect(DiffService.getDiffType('x', 'x')).toBe('unchanged')
    expect(DiffService.getDiffType('x', 'y')).toBe('modified')
  })
})

describe('DiffService field/list diff', () => {
  it('computeFieldDiff maps field metadata and computed diff type', () => {
    const fieldDef: FieldDefinition = { key: 'name', label: '名称' }
    const oldData: FormData = { name: '旧值' }
    const newData: FormData = { name: '新值' }

    const result = DiffService.computeFieldDiff(fieldDef, oldData, newData)

    expect(result).toEqual({
      key: 'name',
      label: '名称',
      oldValue: '旧值',
      newValue: '新值',
      type: 'modified',
    })
  })

  it('computeListDiff builds item diffs and summary for added/removed/modified/unchanged', () => {
    const fieldDef: FieldDefinition = {
      key: 'items',
      label: '条目',
      children: [
        { key: 'name', label: '名称' },
        { key: 'qty', label: '数量' },
      ],
    }

    const oldData: FormData = {
      items: [
        { id: 1, name: 'A', qty: 1 },
        { id: 2, name: 'B', qty: 2 },
        { id: 4, name: 'D', qty: 4 },
      ] as never,
    }

    const newData: FormData = {
      items: [
        { id: 1, name: 'A', qty: 1 },
        { id: 2, name: 'B2', qty: 2 },
        { id: 3, name: 'C', qty: 3 },
      ] as never,
    }

    const result = DiffService.computeListDiff(fieldDef, oldData, newData)

    expect(result.summary).toEqual({
      added: 1,
      removed: 1,
      modified: 1,
      unchanged: 1,
    })
    expect(result.type).toBe('modified')

    expect(result.items.find((item) => item.id === 1)?.type).toBe('unchanged')
    expect(result.items.find((item) => item.id === 2)?.type).toBe('modified')
    expect(result.items.find((item) => item.id === 3)?.type).toBe('added')
    expect(result.items.find((item) => item.id === 4)?.type).toBe('removed')
  })

  it('computeListDiff returns unchanged type when all child fields unchanged', () => {
    const fieldDef: FieldDefinition = {
      key: 'items',
      label: '条目',
      children: [{ key: 'name', label: '名称' }],
    }

    const oldData: FormData = {
      items: [{ id: 1, name: 'A' }] as never,
    }
    const newData: FormData = {
      items: [{ id: 1, name: 'A' }] as never,
    }

    const result = DiffService.computeListDiff(fieldDef, oldData, newData)

    expect(result.type).toBe('unchanged')
    expect(result.summary).toEqual({
      added: 0,
      removed: 0,
      modified: 0,
      unchanged: 1,
    })
  })
})

describe('DiffService file helpers and file diff', () => {
  it('isFileObject validates required file properties', () => {
    expect(DiffService.isFileObject(createFile())).toBe(true)
    expect(DiffService.isFileObject({ id: 1, fileName: 'a' })).toBe(false)
    expect(DiffService.isFileObject(null)).toBe(false)
    expect(DiffService.isFileObject('x')).toBe(false)
  })

  it('normalizeFileValue handles empty/single/array and filters invalid items', () => {
    expect(DiffService.normalizeFileValue(undefined)).toEqual([])
    expect(DiffService.normalizeFileValue(createFile({ id: 8 }))).toEqual([createFile({ id: 8 })])

    const mixed = [createFile({ id: 1 }), { id: 2, fileName: 'x' }, createFile({ id: 3 })]

    expect(DiffService.normalizeFileValue(mixed as never).map((file) => file.id)).toEqual([1, 3])
    expect(DiffService.normalizeFiles(mixed as never).map((file) => file.id)).toEqual([1, 3])
  })

  it('isSameFile compares by ossObjectKey first then fallback fields', () => {
    expect(
      DiffService.isSameFile(
        createFile({ id: 1, ossObjectKey: 'same-key' }),
        createFile({ id: 99, ossObjectKey: 'same-key' }),
      ),
    ).toBe(true)

    expect(
      DiffService.isSameFile(
        createFile({ id: 1, ossObjectKey: '' }),
        createFile({ id: 1, fileName: 'contract.pdf', fileSize: 1024, ossObjectKey: '' }),
      ),
    ).toBe(true)

    expect(
      DiffService.isSameFile(
        createFile({ id: 1, ossObjectKey: '' }),
        createFile({ id: 2, fileName: 'other.pdf', fileSize: 2048, ossObjectKey: '' }),
      ),
    ).toBe(false)
  })

  it('computeFileDiff returns unchanged/modified/removed/added in expected order', () => {
    const oldValue = [
      createFile({ id: 1, ossObjectKey: 'k1' }),
      createFile({ id: 2, ossObjectKey: 'k2', fileSize: 100 }),
      createFile({ id: 3, ossObjectKey: 'k3' }),
    ]

    const newValue = [
      createFile({ id: 1, ossObjectKey: 'k1' }),
      createFile({ id: 2, ossObjectKey: 'k2-new', fileSize: 999 }),
      createFile({ id: 4, ossObjectKey: 'k4' }),
    ]

    const result = DiffService.computeFileDiff(oldValue as never, newValue as never)

    expect(result.map((item) => item.type)).toEqual(['unchanged', 'modified', 'removed', 'added'])
    expect(result[0]?.oldFile?.id).toBe(1)
    expect(result[1]?.oldFile?.id).toBe(2)
    expect(result[1]?.newFile?.id).toBe(2)
    expect(result[2]?.oldFile?.id).toBe(3)
    expect(result[2]?.newFile).toBeNull()
    expect(result[3]?.oldFile).toBeNull()
    expect(result[3]?.newFile?.id).toBe(4)
  })
})
