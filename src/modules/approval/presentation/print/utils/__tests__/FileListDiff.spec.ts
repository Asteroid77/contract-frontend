import { describe, expect, it } from 'vitest'

import {
  diffFileList,
  formatFileSize,
  mapFileIds,
} from '@/modules/approval/presentation/print/utils/FileListDiff'

const file = (id: number, fileSize: number) =>
  ({
    id,
    fileName: `f-${id}.pdf`,
    fileType: 'application/pdf',
    sourceType: 'UPLOAD',
    ossRegion: 'cn-east-1',
    ossBucket: 'bucket-a',
    ossObjectKey: `key-${id}`,
    fileHash: `hash-${id}`,
    uploadTime: '2026-01-01 00:00:00',
    uploader: 1,
    description: null,
    status: 'READY',
    expireTime: 1700000000,
    accessUrl: `https://cdn/${id}`,
    fileSize,
  }) as never

describe('approval/presentation/print/utils/FileListDiff', () => {
  it('re-exported diffFileList returns added/removed/kept-like statuses', () => {
    const rows = diffFileList([file(1, 10), file(2, 20)], [file(2, 20), file(3, 30)], true)

    expect(rows).toHaveLength(3)
    expect(rows.find((row) => row.id === 1)?._status).toBe('added')
    expect(rows.find((row) => row.id === 2)?._status).toBe('kept')
    expect(rows.find((row) => row.id === 3)?._status).toBe('removed')
  })

  it('re-exported helpers format size and map ids', () => {
    expect(formatFileSize(undefined)).toBe('-')
    expect(formatFileSize(0)).toBe('0 B')
    expect(formatFileSize(1024)).toBe('1 KB')

    const ids = mapFileIds(
      {
        billIds: [1, 2, 2, 0],
        contractScanIds: [3],
      },
      [
        { title: 'bill', key: 'billIds' },
        { title: 'contract', key: 'contractScanIds' },
      ],
    )

    expect(ids).toEqual([1, 2, 3])
  })
})
