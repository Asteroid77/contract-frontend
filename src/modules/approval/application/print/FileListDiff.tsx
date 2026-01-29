import { $t } from '@/_utils/i18n'
import type { OssCallbackDTO } from '@/modules/file/application/models'
import { uniq } from 'lodash'
import type { Ref } from 'vue'
import { computed } from 'vue'

export interface DiffOssFile extends OssCallbackDTO {
  _status: 'added' | 'removed' | 'modified' | 'kept'
  _oldFileSize?: number // 用于展示修改前的大小
}
/**
 * 对比新旧文件列表，返回一个合并后的列表
 */
export function diffFileList(
  newList: OssCallbackDTO[] | undefined | null,
  oldList: OssCallbackDTO[] | undefined | null,
  enable?: boolean,
): DiffOssFile[] {
  const safeNew = newList || []
  const safeOld = oldList || []

  const result: DiffOssFile[] = []
  const newMap = new Map(safeNew.map((f) => [f.id, f]))
  const oldMap = new Map(safeOld.map((f) => [f.id, f]))

  // 遍历新列表 (处理 新增、修改、保持)
  safeNew.forEach((newItem) => {
    const oldItem = oldMap.get(newItem.id)

    if (oldItem) {
      // ID 存在，检查 fileSize
      if (newItem.fileSize !== oldItem.fileSize) {
        result.push({
          ...newItem,
          _status: 'modified',
          _oldFileSize: oldItem.fileSize,
        })
      } else {
        result.push({ ...newItem, _status: 'kept' })
      }
    } else {
      // ID 不存在 -> 新增
      result.push({ ...newItem, _status: enable ? 'added' : 'kept' })
    }
  })

  // 2. 遍历旧列表 (找出被删除的)
  safeOld.forEach((oldItem) => {
    if (!newMap.has(oldItem.id)) {
      result.push({ ...oldItem, _status: 'removed' })
    }
  })

  return result
}

// 辅助函数：格式化文件大小
export function formatFileSize(bytes: number | undefined) {
  if (bytes === undefined) return '-'
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
// 渲染附件行的辅助函数
export const renderAttachmentRows = (
  title: string,
  newFiles: OssCallbackDTO[] | undefined,
  oldFiles: OssCallbackDTO[] | undefined,
  enable?: boolean,
) => {
  // 获取 Diff 后的合并列表
  const list = diffFileList(newFiles, oldFiles, enable)

  if (list.length === 0) return null

  // 渲染行
  return list.map((file, index) => {
    // 计算类名
    const rowClass = {
      'row-added': file._status === 'added',
      'row-removed': file._status === 'removed',
      'row-modified': file._status === 'modified',
    }

    // 状态文本
    let statusText = ''
    if (file._status === 'added') statusText = `${$t('actions.add')}`
    if (file._status === 'removed') statusText = `${$t('actions.delete')}`
    if (file._status === 'modified') statusText = `${$t('actions.modify')}`

    // 文件大小显示逻辑
    const sizeDisplay =
      file._status === 'modified'
        ? `${formatFileSize(file.fileSize)} (${formatFileSize(file._oldFileSize)})`
        : formatFileSize(file.fileSize)

    return (
      <tr key={`${file.id}-${file._status}`} class={rowClass}>
        {/* 第一行显示分类标题，后续行留空 */}
        <td>{index === 0 ? title : ''}</td>

        {/* 文件名 + 状态 */}
        <td>
          <span class="file-name">{file.fileName}</span>
          <span class="diff-tag">{statusText}</span>
        </td>

        {/* 文件大小 */}
        <td class="size-col">{sizeDisplay}</td>
      </tr>
    )
  })
}
/**
 * 映射Ids
 * @param sourceData 包含 ID 的源数据对象
 * @param rules 映射规则
 * @returns Map<key, OssCallbackDTO[]>
 */
export function mapFileIds(
  sourceData: Record<string, number[]>,
  rules: { title: string; key: string }[],
): number[] {
  // 1. 提取所有需要的 ID (聚合)
  let allIds: number[] = []

  rules.forEach((rule) => {
    const ids: number[] = sourceData[rule.key]
    if (Array.isArray(ids) && ids.length > 0) {
      allIds.push(...ids)
    }
  })

  // 2. 去重 & 过滤空值
  allIds = uniq(allIds).filter((id: number) => !!id)
  return allIds
}
export interface MappedFiles {
  // key 是 rules 中定义的 key (例如 'contractScanFiles')
  old: Record<string, OssCallbackDTO[]>
  new: Record<string, OssCallbackDTO[]>
}
const createFileIdMap = (files: OssCallbackDTO[] | undefined) => {
  const map = new Map<number, OssCallbackDTO>()
  if (files) {
    files.forEach((f) => map.set(f.id, f))
  }
  return map
}

export function useDistributeFiles(
  allFilesRef: Ref<OssCallbackDTO[] | undefined>,
  dataSources: { old: Record<string, unknown>; new: Record<string, unknown> }, // 这里的 any 指代包含 xxxIds 的业务对象
  rules: { key: string; title: string }[],
) {
  return computed(() => {
    // 1. 先把全量文件转成 Map，方便 O(1) 查找
    const fileMap = createFileIdMap(allFilesRef.value)

    // 2. 初始化结果结构
    const result: { old: Record<string, OssCallbackDTO[]>; new: Record<string, OssCallbackDTO[]> } =
      {
        old: {},
        new: {},
      }

    // 遍历 'old' 和 'new' 两个维度
    ;(['old', 'new'] as const).forEach((type) => {
      const sourceObj = dataSources[type] // e.g. props.oldData

      // 遍历每一条规则 (e.g. key='billFiles', idKey='billIds')
      rules.forEach((rule) => {
        const ids = sourceObj?.[rule.key] as number[] | null

        if (!ids || ids.length === 0) {
          result[type][rule.key] = []
        } else {
          // 根据 ID 从 fileMap 中捞取对象
          result[type][rule.key] = ids
            .map((id) => fileMap.get(id))
            .filter(Boolean) as OssCallbackDTO[]
        }
      })
    })

    return result
  })
}
