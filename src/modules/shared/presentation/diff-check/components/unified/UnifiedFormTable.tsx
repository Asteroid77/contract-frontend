import { defineComponent, type PropType, ref, computed, type VNodeChild } from 'vue'
import { NButton, NCard, NImage, NImageGroup, NModal, NSpin } from 'naive-ui'
import type {
  FieldDefinition,
  FieldValue,
  FormData,
  ListItemValue,
  OssCallbackView,
} from '@/modules/shared/presentation/diff-check/domain/types/field'
import type { FieldDiff, ListDiff, ListItemDiff } from '@/modules/shared/presentation/diff-check/domain/types/diff'
import { DiffService } from '@/modules/shared/presentation/diff-check/domain/services/diffService'
import InlineDiffValue from './InlineDiffValue'
import { $t } from '@/_utils/i18n'

/**
 * 统一表单表格组件
 * 支持普通字段、列表字段、文件字段混排，支持 Diff 模式
 */
export default defineComponent({
  name: 'UnifiedFormTable',
  props: {
    /** 展示变体：screen=屏幕预览（默认），print=打印预览/打印 */
    variant: {
      type: String as PropType<'screen' | 'print'>,
      default: 'screen',
    },
    /** 字段定义列表 */
    fields: {
      type: Array as PropType<FieldDefinition[]>,
      required: true,
    },
    /** 当前数据 */
    data: {
      type: Object as PropType<FormData>,
      required: true,
    },
    /** 旧数据（用于 Diff 对比，不传则为普通模式） */
    oldData: {
      type: Object as PropType<FormData | null>,
      default: null,
    },
    /** 只显示变更项（Diff 模式下生效） */
    showOnlyChanged: {
      type: Boolean,
      default: false,
    },
    /** 每行展示字段列数：1=单列(一行一个字段)，2=双列(一行两个字段) */
    columnCount: {
      type: Number as PropType<1 | 2>,
      default: 2,
    },
    /** 值长度超过阈值时，强制单列展示（避免挤压） */
    longValueThreshold: {
      type: Number,
      default: 28,
    },
    /** 列表字段默认全部展开（打印场景推荐） */
    expandAllLists: {
      type: Boolean,
      default: true,
    },
    /** 禁用列表展开/收起交互（打印场景推荐） */
    disableListToggle: {
      type: Boolean,
      default: false,
    },
  },
  setup(props) {
    const isPrint = computed(() => props.variant === 'print')

    const expandedLists = ref<Set<string>>(
      new Set(props.expandAllLists ? props.fields.filter((f) => f.type === 'list').map((f) => f.key) : []),
    )

    const isDiffMode = computed(() => props.oldData !== null)

    // 判断是否为图片类型
    const isImageFile = (file: OssCallbackView): boolean => {
      const imageTypes = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp']
      const rawType = (file.fileType || '').toLowerCase().trim()
      if (rawType.startsWith('image/')) return true
      const extFromType = rawType.replace(/^\./, '').split('/').pop() || ''
      const extFromName = (file.fileName || '').split('.').pop()?.toLowerCase() || ''
      const ext = extFromType || extFromName
      return imageTypes.includes(ext) || ext.startsWith('svg')
    }

    // 格式化文件大小
    const formatFileSize = (bytes: number): string => {
      if (bytes < 1024) return `${bytes} B`
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    }

    // 计算所有字段的 Diff
    const fieldDiffs = computed(() => {
      if (!isDiffMode.value) return new Map<string, FieldDiff>()

      const map = new Map<string, FieldDiff>()
      props.fields.forEach((field) => {
        if (field.type !== 'list') {
          map.set(field.key, DiffService.computeFieldDiff(field, props.oldData!, props.data))
        }
      })
      return map
    })

    // 计算列表字段的 Diff
    const listDiffs = computed(() => {
      if (!isDiffMode.value) return new Map<string, ListDiff>()

      const map = new Map<string, ListDiff>()
      props.fields
        .filter((f) => f.type === 'list')
        .forEach((field) => {
          map.set(field.key, DiffService.computeListDiff(field, props.oldData!, props.data))
        })
      return map
    })

    // 过滤后的字段列表
    const visibleFields = computed(() => {
      if (!props.showOnlyChanged || !isDiffMode.value) {
        return props.fields
      }

      return props.fields.filter((field) => {
        if (field.type === 'list') {
          const listDiff = listDiffs.value.get(field.key)
          return listDiff && listDiff.type !== 'unchanged'
        }
        const diff = fieldDiffs.value.get(field.key)
        return diff && diff.type !== 'unchanged'
      })
    })

    const toggleList = (key: string) => {
      if (props.disableListToggle) return
      if (expandedLists.value.has(key)) {
        expandedLists.value.delete(key)
      } else {
        expandedLists.value.add(key)
      }
    }

    // ========== 文件渲染相关 ==========

    const getFileExt = (file: OssCallbackView): string => {
      const normalize = (v: string) => v.trim().toLowerCase().replace(/^\./, '')

      const rawType = normalize(file.fileType || '')
      if (rawType) {
        if (rawType.includes('/')) {
          const mime = rawType
          const sub = mime.split('/').pop() || ''
          const mimeExt = normalize(sub)
          if (mimeExt === 'plain') return 'txt'
          return mimeExt
        }
        return rawType
      }

      const fromName = normalize((file.fileName || '').split('.').pop() || '')
      return fromName
    }

    const textPreviewExts = new Set(['txt', 'log', 'md', 'csv', 'json', 'xml', 'yaml', 'yml'])
    const isPdfFile = (file: OssCallbackView): boolean => getFileExt(file) === 'pdf'
    const isTextFile = (file: OssCallbackView): boolean => textPreviewExts.has(getFileExt(file))
    const isDocPreviewable = (file: OssCallbackView): boolean => isPdfFile(file) || isTextFile(file)

    const previewFile = ref<OssCallbackView | null>(null)
    const previewLoading = ref(false)
    const previewText = ref('')
    const previewError = ref<string | null>(null)
    const previewKind = computed<'pdf' | 'text' | 'unknown'>(() => {
      if (!previewFile.value) return 'unknown'
      if (isPdfFile(previewFile.value)) return 'pdf'
      if (isTextFile(previewFile.value)) return 'text'
      return 'unknown'
    })

    let previewRequestId = 0

    const closePreview = () => {
      previewFile.value = null
      previewLoading.value = false
      previewText.value = ''
      previewError.value = null
    }

    const openPreview = async (file: OssCallbackView) => {
      if (isPrint.value) return
      if (!isDocPreviewable(file)) return

      previewFile.value = file
      previewText.value = ''
      previewError.value = null

      if (isPdfFile(file)) {
        previewLoading.value = false
        return
      }

      // 文本类：尝试读取内容（若跨域/权限限制则降级为新窗口打开）
      previewLoading.value = true
      const currentId = ++previewRequestId
      try {
        const resp = await fetch(file.accessUrl)
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
        const text = await resp.text()
        if (currentId !== previewRequestId) return
        previewText.value = text
      } catch {
        if (currentId !== previewRequestId) return
        previewError.value = $t('common.diffCheck.message.textReadFallback') as string
      } finally {
        if (currentId === previewRequestId) previewLoading.value = false
      }
    }

    const openInNewTab = (file: OssCallbackView | null) => {
      if (!file?.accessUrl) return
      window.open(file.accessUrl, '_blank', 'noopener')
    }

    // 渲染单个文件项
    const renderSingleFile = (file: OssCallbackView, status: 'normal' | 'added' | 'removed' = 'normal') => {
      if (isPrint.value) {
        const prefix =
          status === 'added'
            ? `[${$t('common.action.add')}] `
            : status === 'removed'
              ? `[${$t('common.action.delete')}] `
              : ''
        return (
          <div>
            <span>
              {prefix}
              {file.fileName}
            </span>
            {typeof file.fileSize === 'number' ? <span>（{formatFileSize(file.fileSize)}）</span> : null}
          </div>
        )
      }

      const isImage = isImageFile(file)
      const statusClass = status === 'added' ? 'file-item--added' : status === 'removed' ? 'file-item--removed' : ''

      return (
        <div class={`file-item ${statusClass}`}>
          {isImage ? (
            <div class="file-image-wrapper">
              <NImage
                src={file.accessUrl}
                alt={file.fileName}
                class="file-image-thumb"
                objectFit="cover"
                preview-src={file.accessUrl}
              />
              {status !== 'normal' && (
                <span class={`file-status-tag file-status-tag--${status}`}>
                  {status === 'added' ? $t('common.action.add') : $t('common.action.delete')}
                </span>
              )}
            </div>
          ) : (
            <div class="file-info">
              <span class="file-icon">📎</span>
              <a
                class={isDocPreviewable(file) ? 'file-name file-link' : 'file-name'}
                href={file.accessUrl}
                target="_blank"
                rel="noopener"
                onClick={(e) => {
                  if (!isDocPreviewable(file)) return
                  e.preventDefault()
                  void openPreview(file)
                }}
              >
                {file.fileName}
              </a>
              <span class="file-size">({formatFileSize(file.fileSize)})</span>
              {status !== 'normal' && (
                <span class={`file-status-badge file-status-badge--${status}`}>
                  {status === 'added' ? $t('common.action.add') : $t('common.action.delete')}
                </span>
              )}
            </div>
          )}
        </div>
      )
    }

    // 渲染文件字段值（普通模式）
    const renderFileValue = (field: FieldDefinition) => {
      const value = props.data[field.key]

      if (DiffService.isEmpty(value)) {
        return <span class="field-empty">{$t('common.label.empty')}</span>
      }

      const files = DiffService.normalizeFileValue(value)

      const hasImages = files.some(isImageFile)
      const body = (
        <div class="file-list">
          {files.map((file) => (
            <div key={file.id}>{renderSingleFile(file, 'normal')}</div>
          ))}
        </div>
      )

      return hasImages ? <NImageGroup>{body}</NImageGroup> : body
    }

    // 渲染文件 Diff（对比模式）
    const renderFileDiff = (field: FieldDefinition) => {
      const diff = fieldDiffs.value.get(field.key)!
      const fileDiffs = DiffService.computeFileDiff(diff.oldValue, diff.newValue)

      // 没有任何变化
      if (fileDiffs.length === 0) {
        return <span class="field-empty">{$t('common.label.empty')}</span>
      }

      // 检查是否全部未变化
      const allUnchanged = fileDiffs.every((f) => f.type === 'unchanged')
      if (allUnchanged && props.showOnlyChanged) {
        return null
      }

      if (isPrint.value) {
        return (
          <div>
            {fileDiffs.map((d) => {
              if (d.type === 'added' && d.newFile) {
                return (
                  <div key={`add-${d.newFile.id}`}>
                    <span class="print-diff-new">
                      [{ $t('common.action.add') }] {d.newFile.fileName}
                    </span>
                  </div>
                )
              }
              if (d.type === 'removed' && d.oldFile) {
                return (
                  <div key={`del-${d.oldFile.id}`}>
                    <span class="print-diff-old">
                      [{ $t('common.action.delete') }] {d.oldFile.fileName}
                    </span>
                  </div>
                )
              }
              if (d.type === 'modified' && d.oldFile && d.newFile) {
                return (
                  <div key={`mod-${d.oldFile.id}`}>
                    <span class="print-diff-old">{d.oldFile.fileName}</span>
                    <span> → </span>
                    <span class="print-diff-new">{d.newFile.fileName}</span>
                  </div>
                )
              }
              if (d.type === 'unchanged' && d.newFile) {
                return <div key={`unch-${d.newFile.id}`}>{d.newFile.fileName}</div>
              }
              return null
            })}
          </div>
        )
      }

      const removed = fileDiffs.filter((d) => d.type === 'removed' && d.oldFile).map((d) => d.oldFile!) 
      const added = fileDiffs.filter((d) => d.type === 'added' && d.newFile).map((d) => d.newFile!)
      const hasImages = fileDiffs.some((d) => (d.newFile && isImageFile(d.newFile)) || (d.oldFile && isImageFile(d.oldFile)))

      // 图片字段的“替换”增强：旧图 + 新图（即使 id 不同也用 → 表达替换）
      if (field.type === 'image' && removed.length === 1 && added.length === 1 && fileDiffs.length === 2) {
        const body = (
          <div class="file-diff-list">
            <div class="file-diff-item file-diff-replace">
              {renderSingleFile(removed[0], 'removed')}
              <span class="file-diff-arrow">→</span>
              {renderSingleFile(added[0], 'added')}
            </div>
          </div>
        )
        return hasImages ? <NImageGroup>{body}</NImageGroup> : body
      }

      const body = (
        <div class="file-diff-list">
          {fileDiffs.map((fileDiff) => {
            switch (fileDiff.type) {
              case 'added':
                return (
                  <div key={`add-${fileDiff.newFile!.id}`} class="file-diff-item">
                    {renderSingleFile(fileDiff.newFile!, 'added')}
                  </div>
                )

              case 'removed':
                return (
                  <div key={`del-${fileDiff.oldFile!.id}`} class="file-diff-item">
                    {renderSingleFile(fileDiff.oldFile!, 'removed')}
                  </div>
                )

              case 'modified':
                // 文件被替换
                return (
                  <div key={`mod-${fileDiff.oldFile!.id}`} class="file-diff-item file-diff-replace">
                    {renderSingleFile(fileDiff.oldFile!, 'removed')}
                    <span class="file-diff-arrow">→</span>
                    {renderSingleFile(fileDiff.newFile!, 'added')}
                  </div>
                )

              case 'unchanged':
              default:
                return (
                  <div key={`unch-${fileDiff.newFile!.id}`} class="file-diff-item">
                    {renderSingleFile(fileDiff.newFile!, 'normal')}
                  </div>
                )
            }
          })}
        </div>
      )

      return hasImages ? <NImageGroup>{body}</NImageGroup> : body
    }

    // ========== 普通字段渲染 ==========

    // 渲染普通字段值
    const renderFieldValue = (field: FieldDefinition) => {
      // 文件类型特殊处理
      if (field.type === 'file' || field.type === 'image') {
        if (isDiffMode.value) {
          return renderFileDiff(field)
        }
        return renderFileValue(field)
      }

      // 普通字段
      if (!isDiffMode.value) {
        const value = props.data[field.key]
        if (DiffService.isEmpty(value)) {
          return <span class="field-empty">{$t('common.label.empty')}</span>
        }
        return <span>{String(value)}</span>
      }

      const diff = fieldDiffs.value.get(field.key)!
      return <InlineDiffValue oldValue={diff.oldValue} newValue={diff.newValue} diffType={diff.type} />
    }

    const formatForLength = (val: unknown): string => {
      if (DiffService.isEmpty(val as FieldValue)) return ''
      if (typeof val === 'boolean') return val ? ($t('common.label.yes') as string) : ($t('common.label.no') as string)
      if (Array.isArray(val)) return $t('common.label.totalItems', { count: val.length }) as string
      return String(val)
    }

    const isLongValueField = (field: FieldDefinition): boolean => {
      if (field.type === 'list' || field.type === 'file' || field.type === 'image') return true
      const newVal = props.data[field.key]
      const newText = formatForLength(newVal)
      if (!isDiffMode.value || !props.oldData) {
        return newText.includes('\n') || newText.length > props.longValueThreshold
      }

      const oldVal = props.oldData[field.key]
      const oldText = formatForLength(oldVal)
      const diffType = DiffService.getDiffType(oldVal, newVal)
      const combined = diffType === 'modified' ? `${oldText}${newText}` : newText
      return combined.includes('\n') || combined.length > props.longValueThreshold
    }

    // ========== 列表渲染 ==========

    // 渲染列表摘要
    const renderListSummary = (field: FieldDefinition) => {
      const isExpanded = expandedLists.value.has(field.key)
      const items = (props.data[field.key] as ListItemValue[]) || []

      if (isPrint.value) {
        if (!isDiffMode.value) {
          return <div>{$t('common.label.totalItems', { count: items.length })}</div>
        }
        const listDiff = listDiffs.value.get(field.key)!
        const { summary } = listDiff
        const parts: string[] = []
        if (summary.added > 0) parts.push($t('common.diffCheck.label.addedCount', { count: summary.added }) as string)
        if (summary.removed > 0) parts.push($t('common.diffCheck.label.removedCount', { count: summary.removed }) as string)
        if (summary.modified > 0) parts.push($t('common.diffCheck.label.modifiedCount', { count: summary.modified }) as string)
        const details = parts.length > 0 ? `（${parts.join(', ')}）` : ''
        return <div>{`${$t('common.label.totalItems', { count: listDiff.items.length })}${details}`}</div>
      }

      if (!isDiffMode.value) {
        return (
          <div class="list-summary" onClick={() => toggleList(field.key)}>
            <span class="list-toggle">{isExpanded ? '▼' : '▶'}</span>
            <span>{$t('common.label.totalItems', { count: items.length })}</span>
          </div>
        )
      }

      const listDiff = listDiffs.value.get(field.key)!
      const { summary } = listDiff

      return (
        <div class="list-summary" onClick={() => toggleList(field.key)}>
          <span class="list-toggle">{isExpanded ? '▼' : '▶'}</span>
          <span>{$t('common.label.totalItems', { count: listDiff.items.length })}</span>
          {summary.added > 0 && <span class="badge badge--added">+{summary.added}</span>}
          {summary.removed > 0 && <span class="badge badge--removed">-{summary.removed}</span>}
          {summary.modified > 0 && <span class="badge badge--modified">~{summary.modified}</span>}
        </div>
      )
    }

    // 获取列表行样式
    const getRowClass = (itemDiff: ListItemDiff): string => {
      switch (itemDiff.type) {
        case 'added':
          return 'list-row list-row--added'
        case 'removed':
          return 'list-row list-row--removed'
        case 'modified':
          return 'list-row list-row--modified'
        default:
          return 'list-row'
      }
    }

    // 渲染列表内容
    const renderListContent = (field: FieldDefinition) => {
      if (!expandedLists.value.has(field.key)) return null

      const childFields = field.children || []
      const listContainerColspan = props.columnCount === 2 ? 4 : 2
      const tableClass = isPrint.value ? 'print-table print-table--nested' : 'form-table form-table--nested'

      if (!isDiffMode.value) {
        const items = (props.data[field.key] as ListItemValue[]) || []
        return (
          <tr class="list-expand-row">
            <td colspan={listContainerColspan}>
              <div class="list-nested">
                <table class={tableClass}>
                  <thead>
                    <tr>
                      <th class="col-index">#</th>
                      {childFields.map((cf) => (
                        <th key={cf.key}>{cf.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, idx) => (
                      <tr key={item.id}>
                        <td class="col-index">{idx + 1}</td>
                        {childFields.map((cf) => (
                          <td key={cf.key}>
                            {DiffService.isEmpty(item[cf.key]) ? <span class="field-empty">{$t('common.label.empty')}</span> : String(item[cf.key])}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </td>
          </tr>
        )
      }

      // Diff 模式下的列表渲染
      const listDiff = listDiffs.value.get(field.key)!
      const visibleItems = props.showOnlyChanged ? listDiff.items.filter((i) => i.type !== 'unchanged') : listDiff.items

      return (
        <tr class="list-expand-row">
          <td colspan={listContainerColspan}>
            <div class="list-nested">
              <table class={tableClass}>
                <thead>
                  <tr>
                    <th class="col-index">#</th>
                    {childFields.map((cf) => (
                      <th key={cf.key}>{cf.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visibleItems.length === 0 ? (
                    <tr>
                      <td colspan={childFields.length + 1} class="empty-row">
                        <span class="field-empty">{$t('common.diffCheck.label.noChangeData')}</span>
                      </td>
                    </tr>
                  ) : (
                    visibleItems.map((itemDiff, idx) => (
                      <tr key={itemDiff.id} class={getRowClass(itemDiff)}>
                        <td class="col-index">{idx + 1}</td>
                        {itemDiff.fieldDiffs.map((fd) => (
                          <td key={fd.key}>
                            <InlineDiffValue oldValue={fd.oldValue} newValue={fd.newValue} diffType={fd.type} showOldValue={itemDiff.type !== 'added'} />
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </td>
        </tr>
      )
    }

    return () => (
      <div class="unified-table-wrapper">
        <table class={isPrint.value ? 'print-table' : 'form-table'}>
          <tbody>
            {(() => {
              type TableCellContent = VNodeChild
              type TableRowPair = {
                field: FieldDefinition
                content: TableCellContent
              }

              const rows: TableCellContent[] = []
              const totalColumns = props.columnCount === 2 ? 4 : 2
              const valueColspan = props.columnCount === 2 ? 3 : 1

              const renderSingleRow = (field: FieldDefinition, content: TableCellContent) => (
                <tr key={field.key}>
                  <td class="field-label">{field.label}</td>
                  <td colspan={valueColspan}>{content}</td>
                </tr>
              )

              const renderPairRow = (a: TableRowPair, b?: TableRowPair) => (
                <tr key={`${a.field.key}${b ? `__${b.field.key}` : ''}`}>
                  <td class="field-label">{a.field.label}</td>
                  <td>{a.content}</td>
                  {b ? (
                    <>
                      <td class="field-label">{b.field.label}</td>
                      <td>{b.content}</td>
                    </>
                  ) : (
                    <>
                      <td class="field-label"></td>
                      <td></td>
                    </>
                  )}
                </tr>
              )

              let pending: TableRowPair | null = null
              const flushPending = () => {
                if (!pending) return
                // 末尾剩余字段时，不再填充空列，直接独占一行（体验更一致，打印/屏幕都更“严肃”）
                rows.push(renderSingleRow(pending.field, pending.content))
                pending = null
              }

              visibleFields.value.forEach((field) => {
                if (field.type === 'list') {
                  flushPending()
                  rows.push(
                    <tr key={field.key} class="list-header-row">
                      <td class="field-label">{field.label}</td>
                      <td colspan={valueColspan}>{renderListSummary(field)}</td>
                    </tr>,
                  )
                  const contentRow = renderListContent(field)
                  if (contentRow) rows.push(contentRow)
                  return
                }

                const content = renderFieldValue(field)
                if (content === null) return

                const shouldFullRow = props.columnCount === 1 || isLongValueField(field)
                if (shouldFullRow) {
                  flushPending()
                  rows.push(renderSingleRow(field, content))
                  return
                }

                if (pending) {
                  rows.push(renderPairRow(pending, { field, content }))
                  pending = null
                } else {
                  pending = { field, content }
                }
              })

              flushPending()

              // 保底：确保 table 结构正确
              if (props.columnCount === 2 && totalColumns !== 4) {
                // noop
              }

              return rows
            })()}
          </tbody>
        </table>

        {!isPrint.value && (
          <NModal
            show={!!previewFile.value}
            onUpdateShow={(v) => {
              if (!v) closePreview()
            }}
          >
            <NCard
              title={previewFile.value?.fileName || ($t('common.diffCheck.title.filePreview') as string)}
              style="width:min(960px, 92vw);"
              closable
              onClose={closePreview}
            >
              <div style="display:flex; justify-content:flex-end; gap:8px; margin-bottom: 8px;">
                <NButton size="small" onClick={() => openInNewTab(previewFile.value)}>
                  {$t('common.action.openInNewTab')}
                </NButton>
              </div>

              {previewKind.value === 'pdf' && previewFile.value ? (
                <iframe
                  src={previewFile.value.accessUrl}
                  style="width:100%;height:75vh;border:none;"
                />
              ) : previewKind.value === 'text' ? (
                previewLoading.value ? (
                  <div style="display:flex; justify-content:center; padding: 24px 0;">
                    <NSpin />
                  </div>
                ) : previewError.value ? (
                  <div style="color:#666; font-size: 13px; line-height: 1.6;">
                    {previewError.value}
                  </div>
                ) : (
                  <pre
                    style="max-height:75vh; overflow:auto; background:#0b1220; color:#e2e8f0; padding: 12px; border-radius: 8px; white-space: pre-wrap; word-break: break-word;"
                  >
                    {previewText.value}
                  </pre>
                )
              ) : (
                <div style="color:#666; font-size: 13px; line-height: 1.6;">
                  {$t('common.diffCheck.message.previewUnsupported')}
                </div>
              )}
            </NCard>
          </NModal>
        )}
      </div>
    )
  },
})
