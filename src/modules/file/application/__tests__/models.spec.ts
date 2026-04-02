import { describe, expect, it } from 'vitest'

import { toOssCallbackView, toOssCallbackViews } from '@/modules/file/application/models'

const createDto = (id: number, path: string) =>
  ({
    id,
    fileName: `file-${id}.png`,
    fileType: 'image/png',
    sourceType: 'UPLOAD',
    ossRegion: 'cn-east-1',
    ossBucket: 'bucket-a',
    ossObjectKey: `key-${id}`,
    fileSize: 100,
    fileHash: `hash-${id}`,
    uploadTime: '2026-01-01 00:00:00',
    uploader: 1,
    description: null,
    status: 'READY',
    expireTime: 1700000000,
    path,
  }) as never

describe('file/application/models', () => {
  it('toOssCallbackView maps path to accessUrl and keeps other fields', () => {
    const dto = createDto(1, 'https://cdn/a.png')

    const view = toOssCallbackView(dto)

    expect(view.id).toBe(1)
    expect(view.fileName).toBe('file-1.png')
    expect(view.accessUrl).toBe('https://cdn/a.png')
    expect((view as Record<string, unknown>).path).toBeUndefined()
  })

  it('toOssCallbackViews maps list items in order', () => {
    const views = toOssCallbackViews([
      createDto(1, 'https://cdn/a.png'),
      createDto(2, 'https://cdn/b.png'),
    ])

    expect(views).toHaveLength(2)
    expect(views[0].id).toBe(1)
    expect(views[0].accessUrl).toBe('https://cdn/a.png')
    expect(views[1].id).toBe(2)
    expect(views[1].accessUrl).toBe('https://cdn/b.png')
  })
})
