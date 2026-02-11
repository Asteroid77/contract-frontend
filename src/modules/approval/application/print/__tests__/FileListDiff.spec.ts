import { describe, expect, it, vi } from 'vitest'
import { isVNode, ref } from 'vue'
import {
  diffFileList,
  formatFileSize,
  mapFileIds,
  renderAttachmentRows,
  useDistributeFiles,
} from '@/modules/approval/application/print/FileListDiff'
import type { OssCallbackView } from '@/modules/file/application/models'

vi.mock('@/_utils/i18n', () => ({
  $t: (key: string) => key,
}))

const createFile = (overrides: Partial<OssCallbackView> = {}): OssCallbackView => ({
  id: 1,
  fileName: 'contract.pdf',
  fileType: 'application/pdf',
  sourceType: { code: 'UPLOAD', description: 'upload' },
  ossRegion: 'cn-beijing',
  ossBucket: 'bucket-a',
  ossObjectKey: 'object-a',
  fileSize: 1024,
  fileHash: 'hash-a',
  uploadTime: '2026-02-10T10:00:00+08:00',
  uploader: 66,
  description: null,
  status: { code: 'ACTIVE', description: 'active' },
  accessUrl: 'https://example.com/contract.pdf',
  expireTime: 1730000000,
  ...overrides,
})

describe('FileListDiff utils', () => {
  it('diffFileList returns added/modified/kept/removed with expected order', () => {
    const newList = [
      createFile({ id: 1, fileName: 'same.pdf', fileSize: 1024 }),
      createFile({ id: 2, fileName: 'modified.pdf', fileSize: 2048 }),
      createFile({ id: 4, fileName: 'added.pdf', fileSize: 4096 }),
    ]
    const oldList = [
      createFile({ id: 1, fileName: 'same.pdf', fileSize: 1024 }),
      createFile({ id: 2, fileName: 'modified.pdf', fileSize: 1024 }),
      createFile({ id: 3, fileName: 'removed.pdf', fileSize: 512 }),
    ]

    const result = diffFileList(newList, oldList, true)

    expect(result).toEqual([
      expect.objectContaining({ id: 1, _status: 'kept' }),
      expect.objectContaining({ id: 2, _status: 'modified', _oldFileSize: 1024 }),
      expect.objectContaining({ id: 4, _status: 'added' }),
      expect.objectContaining({ id: 3, _status: 'removed' }),
    ])
  })

  it('diffFileList marks new files as kept when enable flag is false', () => {
    const result = diffFileList(
      [createFile({ id: 10, fileName: 'new.pdf' })],
      [createFile({ id: 1 })],
      false,
    )

    expect(result.find((item) => item.id === 10)?._status).toBe('kept')
  })

  it('formatFileSize handles undefined/zero and converts units', () => {
    expect(formatFileSize(undefined)).toBe('-')
    expect(formatFileSize(0)).toBe('0 B')
    expect(formatFileSize(1024)).toBe('1 KB')
    expect(formatFileSize(1536)).toBe('1.5 KB')
  })

  it('renderAttachmentRows returns null for empty diff list', () => {
    const result = renderAttachmentRows('附件', [], [])

    expect(result).toBeNull()
  })

  it('renderAttachmentRows creates rows with title, status text and size display', () => {
    const rows = renderAttachmentRows(
      '附件',
      [
        createFile({ id: 1, fileName: 'added.pdf', fileSize: 1024 }),
        createFile({ id: 2, fileName: 'modified.pdf', fileSize: 2048 }),
      ],
      [createFile({ id: 2, fileName: 'modified.pdf', fileSize: 1024 })],
      true,
    )

    expect(rows).not.toBeNull()
    expect(rows).toHaveLength(2)

    const firstRow = rows?.[0]
    expect(isVNode(firstRow)).toBe(true)

    const firstRowJson = JSON.stringify(firstRow)
    expect(firstRowJson).toContain('附件')
    expect(firstRowJson).toContain('common.action.add')
    expect(firstRowJson).toContain('1 KB')

    const secondRowJson = JSON.stringify(rows?.[1])
    expect(secondRowJson).toContain('common.action.modify')
    expect(secondRowJson).toContain('2 KB (1 KB)')
  })

  it('mapFileIds merges configured keys with dedupe and falsy filtering', () => {
    const sourceData = {
      contractIds: [1, 2, 0],
      extraIds: [2, 3],
      ignoredIds: [4],
    }

    const ids = mapFileIds(sourceData, [
      { title: '合同', key: 'contractIds' },
      { title: '附件', key: 'extraIds' },
    ])

    expect(ids).toEqual([1, 2, 3])
  })

  it('useDistributeFiles maps ids to files and falls back to empty arrays', () => {
    const allFilesRef = ref([
      createFile({ id: 1, fileName: 'A.pdf' }),
      createFile({ id: 2, fileName: 'B.pdf' }),
    ])

    const distributed = useDistributeFiles(
      allFilesRef,
      {
        old: {
          contractIds: [1, 3],
          attachIds: null,
        },
        new: {
          contractIds: [2],
          attachIds: [1],
        },
      },
      [
        { key: 'contractIds', title: '合同' },
        { key: 'attachIds', title: '附件' },
      ],
    )

    expect(distributed.value.old.contractIds.map((item) => item.id)).toEqual([1])
    expect(distributed.value.old.attachIds).toEqual([])
    expect(distributed.value.new.contractIds.map((item) => item.id)).toEqual([2])
    expect(distributed.value.new.attachIds.map((item) => item.id)).toEqual([1])
  })
})
