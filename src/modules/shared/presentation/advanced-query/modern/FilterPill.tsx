import { defineComponent, type PropType, computed, onBeforeUnmount, onMounted, ref } from 'vue'
import type { FilterCondition } from '@/modules/shared/domain/query'
import { FilterOp } from '@/modules/shared/domain/query'
import {
  getFieldOperators,
  OPERATOR_CONFIG,
  type FieldConfig,
  FieldType,
} from '@/modules/shared/domain/advanced-query'
import { $t } from '@/_utils/i18n'
import SelectLike, { type SelectLikeOption } from './SelectLike'
import PCACascader from '@/modules/shared/presentation/widget/PCACascader'
import areaData from '@/modules/shared/application/constants/PCA.json'
import { TreeLookup } from '@/modules/shared/presentation/lookup'

type EditingPart = 'field' | 'op' | 'value' | null
type I18nKey = Parameters<typeof $t>[0]

const pad2 = (n: number) => String(n).padStart(2, '0')
const translateLabelKey = (key: string): string => $t(key as I18nKey) as string
const pcaLookup = new TreeLookup(areaData)

const formatDate = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
const formatTimeHM = (d: Date) => `${pad2(d.getHours())}:${pad2(d.getMinutes())}`
const formatDateInputValue = (ts: number) => formatDate(new Date(ts))
const formatDateTimeInputValue = (ts: number) =>
  `${formatDate(new Date(ts))}T${formatTimeHM(new Date(ts))}`
const formatDateTimeDisplayValue = (ts: number) =>
  `${formatDate(new Date(ts))} ${formatTimeHM(new Date(ts))}`

const parseDateInputValue = (value: string): number | undefined => {
  const trimmed = value.trim()
  if (!trimmed) return undefined
  const ts = new Date(`${trimmed}T00:00:00`).getTime()
  return Number.isNaN(ts) ? undefined : ts
}

const parseDateTimeInputValue = (value: string): number | undefined => {
  const trimmed = value.trim()
  if (!trimmed) return undefined
  const ts = new Date(trimmed).getTime()
  return Number.isNaN(ts) ? undefined : ts
}

const resolveInputSize = (value: string | number | undefined, fallback = 8): number => {
  const contentLength = String(value ?? '').trim().length
  return Math.min(32, Math.max(fallback, contentLength + 2))
}

const resolveInputSizingStyle = (value: string | number | undefined, fallback = 8) => ({
  width: `${resolveInputSize(value, fallback)}ch`,
  minWidth: `${fallback}ch`,
  maxWidth: 'min(32ch, 70vw)',
  fieldSizing: 'content' as const,
})

export default defineComponent({
  name: 'AdvancedQueryFilterPill',
  props: {
    condition: {
      type: Object as PropType<FilterCondition>,
      required: true,
    },
    fields: {
      type: Array as PropType<FieldConfig[]>,
      required: true,
    },
    onUpdate: {
      type: Function as PropType<(condition: FilterCondition) => void>,
      required: true,
    },
    onRemove: {
      type: Function as PropType<() => void>,
      required: true,
    },
  },
  setup(props) {
    const isOpen = ref(false)
    const editingPart = ref<EditingPart>(null)
    const pillRef = ref<HTMLElement | null>(null)
    const tagDraft = ref('')

    const field = computed(() => props.fields.find((f) => f.key === props.condition.field))
    const opConfig = computed(() => OPERATOR_CONFIG[props.condition.op])

    const allowedOps = computed<FilterOp[]>(() => {
      return getFieldOperators(field.value)
    })

    const close = () => {
      isOpen.value = false
      editingPart.value = null
    }

    const handleClickOutside = (e: MouseEvent) => {
      if (pillRef.value && !pillRef.value.contains(e.target as Node)) close()
    }

    onMounted(() => {
      document.addEventListener('mousedown', handleClickOutside)
    })

    onBeforeUnmount(() => {
      document.removeEventListener('mousedown', handleClickOutside)
    })

    const getOpLabel = (op: FilterOp) => translateLabelKey(OPERATOR_CONFIG[op].labelKey)

    const maybeT = (text: string) => translateLabelKey(text)

    const normalizeArrayValue = (value: unknown): Array<string | number> => {
      if (!Array.isArray(value)) return []
      return value.filter(
        (v): v is string | number => typeof v === 'string' || typeof v === 'number',
      )
    }

    const formatPcaValue = (value: string | number) => pcaLookup.getFullPath(String(value))

    const formatValue = () => {
      if (!opConfig.value.needValue) return ''
      const value = props.condition.value
      if (value === undefined || value === '') return '...'

      if (Array.isArray(value)) {
        if ([FilterOp.BETWEEN, FilterOp.NOT_BETWEEN].includes(props.condition.op)) {
          const left = value[0]
          const right = value[1]
          const formatOne = (v: unknown) => {
            if (v === undefined || v === null || v === '') return '?'
            if (field.value?.type === FieldType.DATE && typeof v === 'number')
              return formatDateInputValue(v)
            if (field.value?.type === FieldType.DATETIME && typeof v === 'number')
              return formatDateTimeDisplayValue(v)
            if (field.value?.type === FieldType.PCA && (typeof v === 'string' || typeof v === 'number'))
              return formatPcaValue(v)
            return String(v)
          }
          return `${formatOne(left)} ~ ${formatOne(right)}`
        }
        if (field.value?.type === FieldType.ENUM && field.value.options) {
          return value
            .map((v) => {
              const opt = field.value?.options?.find((o) => o.value === v)
              return opt?.label ? maybeT(opt.label) : String(v)
            })
            .join(', ')
        }
        if (field.value?.type === FieldType.PCA) {
          return value.map((v) => formatPcaValue(v)).join(', ')
        }
        return value.map(String).join(', ')
      }

      if (field.value?.type === FieldType.BOOLEAN) {
        return value ? ($t('common.label.yes') as string) : ($t('common.label.no') as string)
      }

      if (field.value?.type === FieldType.DATE && typeof value === 'number') {
        return formatDateInputValue(value)
      }
      if (field.value?.type === FieldType.DATETIME && typeof value === 'number') {
        return formatDateTimeDisplayValue(value)
      }

      if (field.value?.type === FieldType.ENUM && field.value.options) {
        const opt = field.value.options.find((o) => o.value === value)
        return opt?.label ? maybeT(opt.label) : String(value)
      }

      if (field.value?.type === FieldType.PCA && (typeof value === 'string' || typeof value === 'number')) {
        return formatPcaValue(value)
      }

      return String(value)
    }

    const openEditor = (part: EditingPart) => {
      isOpen.value = true
      editingPart.value = part
    }

    const handleFieldChange = (key: string) => {
      const nextField = props.fields.find((f) => f.key === key)
      const nextAllowedOps = getFieldOperators(nextField)
      const nextOp = nextAllowedOps.includes(props.condition.op)
        ? props.condition.op
        : (nextAllowedOps[0] ?? FilterOp.EQ)
      props.onUpdate({ ...props.condition, field: key, op: nextOp, value: undefined })
      openEditor('op')
    }

    const handleOpChange = (op: FilterOp) => {
      const nextConfig = OPERATOR_CONFIG[op]
      let nextValue = props.condition.value

      if (!nextConfig.needValue) {
        nextValue = undefined
      } else if ([FilterOp.BETWEEN, FilterOp.NOT_BETWEEN].includes(op)) {
        nextValue = [undefined, undefined]
      } else if ([FilterOp.IN, FilterOp.NOT_IN].includes(op)) {
        nextValue = []
      }

      props.onUpdate({ ...props.condition, op, value: nextValue })

      if (nextConfig.needValue) openEditor('value')
      else close()
    }

    const handleValueChange = (value: unknown) => {
      props.onUpdate({ ...props.condition, value })
    }

    const renderValueEditor = () => {
      const currentField = field.value
      if (!currentField) return null

      if (currentField.type === FieldType.BOOLEAN) {
        const options = [
          { value: true, label: $t('common.label.yes') as string },
          { value: false, label: $t('common.label.no') as string },
        ]
        return (
          <div class="flex gap-1">
            {options.map((opt) => (
              <button
                key={String(opt.value)}
                type="button"
                onClick={() => {
                  handleValueChange(opt.value)
                  close()
                }}
                class={[
                  'px-2 py-1 text-xs rounded transition-colors',
                  props.condition.value === opt.value
                    ? 'bg-[var(--color-primary)] text-[var(--color-bg-card)]'
                    : 'hover:bg-[var(--color-border)]',
                ]}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )
      }

      if (currentField.type === FieldType.ENUM && currentField.options) {
        const enumOptions: SelectLikeOption[] = currentField.options.map((opt) => ({
          label: maybeT(opt.label),
          value: opt.value,
        }))

        if ([FilterOp.IN, FilterOp.NOT_IN].includes(props.condition.op)) {
          const values = normalizeArrayValue(props.condition.value)

          return (
            <SelectLike
              value={values}
              options={enumOptions}
              multiple
              clearable
              filterable
              maxTagCount="responsive"
              size="small"
              onUpdateValue={(nextValue) => {
                handleValueChange(Array.isArray(nextValue) ? nextValue : [])
              }}
            />
          )
        }

        return (
          <SelectLike
            value={props.condition.value as string | number | null | undefined}
            options={enumOptions}
            clearable
            filterable
            size="small"
            onUpdateValue={(nextValue) => {
              handleValueChange(nextValue)
              close()
            }}
          />
        )
      }

      if (currentField.type === FieldType.PCA) {
        return (
          <PCACascader
            value={props.condition.value as string | undefined}
            clearable
            placeholder={$t('common.advancedQuery.placeholder.input') as string}
            onUpdate:value={(nextValue) => {
              handleValueChange(nextValue)
              close()
            }}
          />
        )
      }

      if ([FilterOp.BETWEEN, FilterOp.NOT_BETWEEN].includes(props.condition.op)) {
        const values = Array.isArray(props.condition.value)
          ? props.condition.value
          : [undefined, undefined]
        const inputType: 'number' | 'date' | 'datetime-local' | 'text' =
          currentField.type === FieldType.NUMBER
            ? 'number'
            : currentField.type === FieldType.DATE
              ? 'date'
              : currentField.type === FieldType.DATETIME
                ? 'datetime-local'
                : 'text'

        const leftValue =
          currentField.type === FieldType.DATE && typeof values[0] === 'number'
            ? formatDateInputValue(values[0])
            : currentField.type === FieldType.DATETIME && typeof values[0] === 'number'
              ? formatDateTimeInputValue(values[0])
              : ((values[0] as string | number | undefined) ?? '')
        const rightValue =
          currentField.type === FieldType.DATE && typeof values[1] === 'number'
            ? formatDateInputValue(values[1])
            : currentField.type === FieldType.DATETIME && typeof values[1] === 'number'
              ? formatDateTimeInputValue(values[1])
              : ((values[1] as string | number | undefined) ?? '')

        const baseInputSize =
          currentField.type === FieldType.DATETIME
            ? 16
            : currentField.type === FieldType.DATE
              ? 10
              : 8

        const leftInputSize = resolveInputSize(leftValue, baseInputSize)
        const rightInputSize = resolveInputSize(rightValue, baseInputSize)

        return (
          <div class="flex items-center gap-1 w-full">
            <input
              type={inputType}
              size={leftInputSize}
              style={resolveInputSizingStyle(leftValue, baseInputSize)}
              value={leftValue}
              onInput={(e) => {
                const raw = (e.target as HTMLInputElement).value
                const next =
                  currentField.type === FieldType.NUMBER
                    ? raw === ''
                      ? undefined
                      : Number(raw)
                    : currentField.type === FieldType.DATE
                      ? parseDateInputValue(raw)
                      : currentField.type === FieldType.DATETIME
                        ? parseDateTimeInputValue(raw)
                        : raw
                handleValueChange([next, values[1]])
              }}
              class="min-w-0 px-2 py-1 text-xs bg-[var(--color-bg-body)] border border-[var(--color-border)] rounded focus:outline-none focus:border-[var(--color-primary)]"
              placeholder={$t('common.advancedQuery.placeholder.min') as string}
            />
            <span class="text-xs text-[var(--color-text-light)]">~</span>
            <input
              type={inputType}
              size={rightInputSize}
              style={resolveInputSizingStyle(rightValue, baseInputSize)}
              value={rightValue}
              onInput={(e) => {
                const raw = (e.target as HTMLInputElement).value
                const next =
                  currentField.type === FieldType.NUMBER
                    ? raw === ''
                      ? undefined
                      : Number(raw)
                    : currentField.type === FieldType.DATE
                      ? parseDateInputValue(raw)
                      : currentField.type === FieldType.DATETIME
                        ? parseDateTimeInputValue(raw)
                        : raw
                handleValueChange([values[0], next])
              }}
              class="min-w-0 px-2 py-1 text-xs bg-[var(--color-bg-body)] border border-[var(--color-border)] rounded focus:outline-none focus:border-[var(--color-primary)]"
              placeholder={$t('common.advancedQuery.placeholder.max') as string}
            />
          </div>
        )
      }

      if ([FilterOp.IN, FilterOp.NOT_IN].includes(props.condition.op)) {
        const values = normalizeArrayValue(props.condition.value)

        const removeAt = (idx: number) => {
          const next = values.filter((_, i) => i !== idx)
          handleValueChange(next)
        }

        const addOne = (raw: string) => {
          const trimmed = raw.trim()
          if (!trimmed) return
          const parsed: string | number =
            currentField.type === FieldType.NUMBER ? Number(trimmed) : trimmed
          if (currentField.type === FieldType.NUMBER && Number.isNaN(parsed)) return
          if (values.includes(parsed)) return
          handleValueChange([...values, parsed])
        }

        const addFromDraft = () => {
          const raw = tagDraft.value
          tagDraft.value = ''
          raw
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
            .forEach(addOne)
        }

        return (
          <div class="flex flex-wrap items-center gap-1 max-w-64">
            {values.map((v, idx) => (
              <span
                key={`${String(v)}_${idx}`}
                class="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-[var(--color-border)]/50 text-xs text-[var(--color-text-body)]"
              >
                {String(v)}
                <button
                  type="button"
                  class="text-[var(--color-text-light)] hover:text-[var(--color-semantic-error)]"
                  aria-label={$t('common.action.delete') as string}
                  onClick={() => removeAt(idx)}
                >
                  ×
                </button>
              </span>
            ))}
            <input
              type={currentField.type === FieldType.NUMBER ? 'number' : 'text'}
              size={resolveInputSize(tagDraft.value, 8)}
              style={resolveInputSizingStyle(tagDraft.value, 8)}
              value={tagDraft.value}
              onInput={(e) => {
                tagDraft.value = (e.target as HTMLInputElement).value
              }}
              onKeydown={(e) => {
                const key = (e as KeyboardEvent).key
                if (key === 'Enter') {
                  e.preventDefault()
                  addFromDraft()
                  return
                }
                if (key === 'Backspace' && tagDraft.value === '' && values.length > 0) {
                  removeAt(values.length - 1)
                }
              }}
              class="min-w-0 flex-1 px-2 py-1 text-xs bg-[var(--color-bg-body)] border border-[var(--color-border)] rounded focus:outline-none focus:border-[var(--color-primary)]"
              placeholder={$t('common.advancedQuery.placeholder.tagInput') as string}
              autofocus
            />
          </div>
        )
      }

      const inputType: 'number' | 'date' | 'datetime-local' | 'text' =
        currentField.type === FieldType.NUMBER
          ? 'number'
          : currentField.type === FieldType.DATE
            ? 'date'
            : currentField.type === FieldType.DATETIME
              ? 'datetime-local'
              : 'text'

      const inputValue =
        currentField.type === FieldType.DATE && typeof props.condition.value === 'number'
          ? formatDateInputValue(props.condition.value)
          : currentField.type === FieldType.DATETIME && typeof props.condition.value === 'number'
            ? formatDateTimeInputValue(props.condition.value)
            : ((props.condition.value as string | number | undefined) ?? '')

      const baseInputSize =
        currentField.type === FieldType.DATETIME
          ? 16
          : currentField.type === FieldType.DATE
            ? 10
            : 8

      return (
        <input
          type={inputType}
          size={resolveInputSize(inputValue, baseInputSize)}
          style={resolveInputSizingStyle(inputValue, baseInputSize)}
          value={inputValue}
          onInput={(e) => {
            const raw = (e.target as HTMLInputElement).value
            const next =
              currentField.type === FieldType.NUMBER
                ? raw === ''
                  ? undefined
                  : Number(raw)
                : currentField.type === FieldType.DATE
                  ? parseDateInputValue(raw)
                  : currentField.type === FieldType.DATETIME
                    ? parseDateTimeInputValue(raw)
                    : raw
            handleValueChange(next)
          }}
          onKeydown={(e) => {
            if ((e as KeyboardEvent).key === 'Enter') close()
          }}
          class="min-w-0 px-2 py-1 text-xs bg-[var(--color-bg-body)] border border-[var(--color-border)] rounded focus:outline-none focus:border-[var(--color-primary)]"
          placeholder={$t('common.advancedQuery.placeholder.input') as string}
          autofocus
        />
      )
    }

    return () => {
      const currentField = field.value
      const valueText = formatValue()

      return (
        <div ref={pillRef} class="relative inline-flex">
          <div class="group inline-flex items-center h-6 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-full text-xs overflow-hidden hover:border-[var(--color-primary)] transition-colors cursor-pointer">
            <button
              type="button"
              onClick={() => openEditor('field')}
              class={[
                'px-2 h-full font-medium transition-colors',
                editingPart.value === 'field'
                  ? 'bg-[var(--color-border)] text-[var(--color-primary)]'
                  : 'hover:bg-[var(--color-border)]',
              ]}
            >
              {currentField ? translateLabelKey(currentField.labelKey) : props.condition.field}
            </button>

            <span class="w-px h-3 bg-[var(--color-border)]" />

            <button
              type="button"
              onClick={() => openEditor('op')}
              class={[
                'px-2 h-full text-[var(--color-text-light)] transition-colors',
                editingPart.value === 'op'
                  ? 'bg-[var(--color-border)] text-[var(--color-primary)]'
                  : 'hover:bg-[var(--color-border)]',
              ]}
            >
              {getOpLabel(props.condition.op)}
            </button>

            {opConfig.value.needValue && (
              <>
                <span class="w-px h-3 bg-[var(--color-border)]" />
                <button
                  type="button"
                  data-test="filter-pill-value-button"
                  onClick={() => openEditor('value')}
                  class={[
                    'px-2 h-full text-[var(--color-text-body)] max-w-48 truncate transition-colors',
                    editingPart.value === 'value'
                      ? 'bg-[var(--color-border)] text-[var(--color-primary)]'
                      : 'hover:bg-[var(--color-border)]',
                  ]}
                  title={valueText}
                >
                  {valueText}
                </button>
              </>
            )}

            <button
              type="button"
              aria-label={$t('common.action.delete') as string}
              onClick={props.onRemove}
              class="px-2 h-full text-[var(--color-text-light)] hover:bg-[var(--color-semantic-error)]/10 hover:text-[var(--color-semantic-error)] transition-colors"
            >
              ×
            </button>
          </div>

          {isOpen.value && editingPart.value && (
            <div class="absolute z-20 mt-2 min-w-[220px] max-w-[320px] p-2 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-lg shadow-lg top-full left-0 flex flex-col gap-2">
              {editingPart.value === 'field' && (
                <div class="flex flex-col gap-1 max-h-56 overflow-auto">
                  {props.fields.map((f) => (
                    <button
                      key={f.key}
                      type="button"
                      onClick={() => handleFieldChange(f.key)}
                      class="px-2 py-1 text-left text-xs rounded hover:bg-[var(--color-border)]"
                    >
                      {translateLabelKey(f.labelKey)}
                    </button>
                  ))}
                </div>
              )}

              {editingPart.value === 'op' && (
                <div class="flex flex-col gap-1 max-h-56 overflow-auto">
                  {allowedOps.value.map((op) => (
                    <button
                      key={op}
                      type="button"
                      onClick={() => handleOpChange(op)}
                      class="px-2 py-1 text-left text-xs rounded hover:bg-[var(--color-border)]"
                    >
                      {getOpLabel(op)}
                    </button>
                  ))}
                </div>
              )}

              {editingPart.value === 'value' && renderValueEditor()}
            </div>
          )}
        </div>
      )
    }
  },
})
