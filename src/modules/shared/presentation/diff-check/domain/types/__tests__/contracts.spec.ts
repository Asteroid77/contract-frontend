import { describe, expect, it } from 'vitest'
import type {
  DiffType,
  FieldDiff,
  FileDiff,
  FileDiffItem,
  ListDiff,
  ListItemDiff,
} from '@/modules/shared/presentation/diff-check/domain/types/diff'
import type {
  FieldDefinition,
  FieldType,
  FileSourceType,
  FileStatus,
  FormData,
  ListItemValue,
  OssCallbackView,
} from '@/modules/shared/presentation/diff-check/domain/types/field'

describe('diff-check type contracts', () => {
  it('accepts field definition and form data structures', () => {
    const fieldType: FieldType = 'list'
    const fileStatus: FileStatus = 'uploaded'
    const fileSourceType: FileSourceType = 'system_generated'

    const file: OssCallbackView = {
      id: 1,
      fileName: 'contract.pdf',
      fileType: 'application/pdf',
      fileSize: 1024,
      ossObjectKey: 'obj-1',
      accessUrl: 'https://example.com/contract.pdf',
      status: { code: fileStatus },
      sourceType: { code: fileSourceType },
    }

    const fieldDef: FieldDefinition = {
      key: 'items',
      label: '条目',
      type: fieldType,
      children: [
        { key: 'name', label: '名称', type: 'text' },
        { key: 'price', label: '价格', type: 'money' },
      ],
    }

    const item: ListItemValue = {
      id: 'row-1',
      name: 'A',
      files: [file],
    }

    const formData: FormData = {
      items: [item],
      title: '审批单',
      enabled: true,
    }

    expect(fieldDef.children?.length).toBe(2)
    expect((formData.items as ListItemValue[])[0]?.id).toBe('row-1')
    expect(((item.files as unknown as OssCallbackView[])[0] as OssCallbackView).fileName).toBe(
      'contract.pdf',
    )
  })

  it('accepts diff payload structures and summary contracts', () => {
    const diffType: DiffType = 'modified'

    const fieldDiff: FieldDiff = {
      key: 'name',
      label: '名称',
      oldValue: '旧值',
      newValue: '新值',
      type: diffType,
    }

    const listItemDiff: ListItemDiff = {
      id: 1,
      type: 'added',
      oldItem: null,
      newItem: { id: 1, name: '新条目' },
      fieldDiffs: [fieldDiff],
    }

    const listDiff: ListDiff = {
      key: 'items',
      label: '条目',
      type: 'modified',
      items: [listItemDiff],
      summary: {
        added: 1,
        removed: 0,
        modified: 0,
        unchanged: 0,
      },
    }

    const fileDiffItem: FileDiffItem = {
      type: 'removed',
      oldFile: {
        id: 2,
        fileName: 'old.pdf',
        fileType: 'application/pdf',
        fileSize: 200,
        ossObjectKey: 'old-2',
        accessUrl: 'https://example.com/old.pdf',
      },
      newFile: null,
    }

    const fileDiff: FileDiff = {
      type: 'modified',
      items: [fileDiffItem],
      summary: {
        added: 0,
        removed: 1,
        modified: 0,
        unchanged: 0,
      },
    }

    expect(listDiff.items[0]?.fieldDiffs[0]?.type).toBe('modified')
    expect(fileDiff.summary.removed).toBe(1)
  })
})
