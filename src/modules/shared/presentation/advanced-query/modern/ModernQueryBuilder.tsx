import { defineComponent, type PropType, onBeforeUnmount, onMounted, ref, watch, computed } from 'vue'
import { QueryLogic, type QueryFilters, type QueryGroup, FilterOp } from '@/modules/shared/domain/query'
import { FIELD_TYPE_OPERATORS, type FieldConfig, type FilterConditionItem, type QueryGroupItem } from '@/modules/shared/domain/advanced-query'
import FilterPill from './FilterPill'
import { $t } from '@/_utils/i18n'

type I18nKey = Parameters<typeof $t>[0]

const translateLabel = (key: string): string => $t(key as I18nKey) as string

const generateId = () =>
  globalThis.crypto?.randomUUID?.() ?? `${Date.now()}_${Math.random().toString(16).slice(2)}`

const createGroup = (): QueryGroupItem => ({
  id: generateId(),
  logic: QueryLogic.AND,
  filters: [],
  groups: [],
})

const normalizeForCompare = (query?: QueryFilters) => {
  const normalizeGroup = (g: QueryGroup | undefined) => {
    if (!g) return undefined
    const next: { logic: QueryLogic; filters: unknown[]; groups: unknown[] } = {
      logic: (g.logic ?? QueryLogic.AND) as QueryLogic,
      filters: Array.isArray(g.filters) ? g.filters : [],
      groups: Array.isArray(g.groups) ? g.groups.map(normalizeGroup).filter(Boolean) : [],
    }
    if (next.filters.length === 0 && next.groups.length === 0) return undefined
    return next
  }

  const next = {
    filters: Array.isArray(query?.filters) ? query!.filters : [],
    group: normalizeGroup(query?.group),
  }

  if (next.filters.length === 0 && !next.group) return {}
  return next
}

const deepEqual = (a: unknown, b: unknown): boolean => {
  if (Object.is(a, b)) return true
  if (typeof a !== typeof b) return false
  if (a == null || b == null) return false

  if (Array.isArray(a)) {
    if (!Array.isArray(b)) return false
    if (a.length !== b.length) return false
    for (let i = 0; i < a.length; i += 1) {
      if (!deepEqual(a[i], (b as unknown[])[i])) return false
    }
    return true
  }

  if (typeof a === 'object') {
    if (Array.isArray(b)) return false
    const aObj = a as Record<string, unknown>
    const bObj = b as Record<string, unknown>
    const aKeys = Object.keys(aObj)
    const bKeys = Object.keys(bObj)
    if (aKeys.length !== bKeys.length) return false
    for (const k of aKeys) {
      if (!Object.prototype.hasOwnProperty.call(bObj, k)) return false
      if (!deepEqual(aObj[k], bObj[k])) return false
    }
    return true
  }

  return false
}

export default defineComponent({
  name: 'AdvancedQueryModernQueryBuilder',
  props: {
    fields: {
      type: Array as PropType<FieldConfig[]>,
      required: true,
    },
    query: {
      type: Object as PropType<QueryFilters>,
      required: false,
      default: undefined,
    },
    initialQuery: {
      type: Object as PropType<QueryFilters>,
      required: false,
      default: undefined,
    },
  },
  emits: {
    change: (_query: QueryFilters) => true,
    'update:query': (_query: QueryFilters) => true,
    search: (_query: QueryFilters) => true,
    reset: (_query: QueryFilters) => true,
  },
  setup(props, { emit }) {
    const filters = ref<FilterConditionItem[]>([])
    const groups = ref<QueryGroupItem[]>([])
    const rootLogic = ref<QueryLogic>(QueryLogic.AND)
    const showFieldMenu = ref(false)
    const showGroupFieldMenu = ref<string | null>(null)

    const rootMenuRef = ref<HTMLElement | null>(null)
    const groupMenuRef = ref<HTMLElement | null>(null)

    const activeMenuEl = computed(() => {
      if (showFieldMenu.value) return rootMenuRef.value
      if (showGroupFieldMenu.value) return groupMenuRef.value
      return null
    })

    const createFilter = (fieldKey: string): FilterConditionItem => {
      const field = props.fields.find((f) => f.key === fieldKey)
      const allowedOps = field ? FIELD_TYPE_OPERATORS[field.type] : []
      return {
        id: generateId(),
        field: fieldKey,
        op: allowedOps?.[0] ?? FilterOp.EQ,
        value: undefined,
      }
    }

    const toggleRootLogic = () => {
      rootLogic.value = rootLogic.value === QueryLogic.AND ? QueryLogic.OR : QueryLogic.AND
    }

    const buildQuery = (): QueryFilters => {
      const cleanFilters = filters.value.map(({ field, op, value }) => ({ field, op, value }))

      const cleanGroups = (items: QueryGroupItem[]): QueryGroup[] =>
        items.map((g) => ({
          logic: g.logic,
          filters: g.filters.map(({ field, op, value }) => ({ field, op, value })),
          groups: cleanGroups(g.groups),
        }))

      if (groups.value.length === 0 && filters.value.length === 0) return {}
      if (groups.value.length === 0) return { filters: cleanFilters }

      return {
        filters: cleanFilters.length > 0 ? cleanFilters : undefined,
        group: {
          logic: rootLogic.value,
          filters: [],
          groups: cleanGroups(groups.value),
        },
      }
    }

    const applyQueryToState = (query?: QueryFilters) => {
      if (!query) return

      filters.value = (query.filters ?? []).map((f) => ({ ...f, id: generateId() }))
      rootLogic.value = query.group?.logic ?? QueryLogic.AND

      const toGroupItem = (g: QueryGroup): QueryGroupItem => ({
        id: generateId(),
        logic: g.logic ?? QueryLogic.AND,
        filters: (g.filters ?? []).map((f) => ({ ...f, id: generateId() })),
        groups: (g.groups ?? []).map(toGroupItem),
      })
      groups.value = (query.group?.groups ?? []).map(toGroupItem)
    }

    applyQueryToState(props.query ?? props.initialQuery)

    watch(
      () => [filters.value, groups.value, rootLogic.value] as const,
      () => {
        const next = buildQuery()
        emit('change', next)
        emit('update:query', next)
      },
      { deep: true },
    )

    watch(
      () => props.query,
      (next) => {
        const nextNormalized = normalizeForCompare(next)
        const currentNormalized = normalizeForCompare(buildQuery())

        if (deepEqual(nextNormalized, currentNormalized)) {
          if (Object.keys(nextNormalized).length === 0 && rootLogic.value !== QueryLogic.AND) {
            showFieldMenu.value = false
            showGroupFieldMenu.value = null
            rootLogic.value = QueryLogic.AND
          }
          return
        }

        showFieldMenu.value = false
        showGroupFieldMenu.value = null
        filters.value = []
        groups.value = []
        rootLogic.value = QueryLogic.AND
        applyQueryToState(next)
      },
      { deep: true },
    )

    const handleClickOutside = (e: MouseEvent) => {
      const el = activeMenuEl.value
      if (!el) return
      if (!el.contains(e.target as Node)) {
        showFieldMenu.value = false
        showGroupFieldMenu.value = null
      }
    }

    onMounted(() => {
      document.addEventListener('mousedown', handleClickOutside)
    })

    onBeforeUnmount(() => {
      document.removeEventListener('mousedown', handleClickOutside)
    })

    const addFilter = (fieldKey: string) => {
      const field = props.fields.find((f) => f.key === fieldKey)
      if (!field) return
      filters.value = [...filters.value, createFilter(fieldKey)]
      showFieldMenu.value = false
    }

    const updateFilter = (id: string, next: FilterConditionItem) => {
      filters.value = filters.value.map((f) => (f.id === id ? { ...next, id } : f))
    }

    const removeFilter = (id: string) => {
      filters.value = filters.value.filter((f) => f.id !== id)
    }

    const addGroup = () => {
      groups.value = [...groups.value, createGroup()]
    }

    const removeGroup = (id: string) => {
      groups.value = groups.value.filter((g) => g.id !== id)
    }

    const updateGroupLogic = (id: string, logic: QueryLogic) => {
      groups.value = groups.value.map((g) => (g.id === id ? { ...g, logic } : g))
    }

    const addFilterToGroup = (groupId: string, fieldKey: string) => {
      const field = props.fields.find((f) => f.key === fieldKey)
      if (!field) return

      groups.value = groups.value.map((g) =>
        g.id === groupId ? { ...g, filters: [...g.filters, createFilter(fieldKey)] } : g,
      )
      showGroupFieldMenu.value = null
    }

    const updateGroupFilter = (groupId: string, filterId: string, next: FilterConditionItem) => {
      groups.value = groups.value.map((g) =>
        g.id === groupId
          ? { ...g, filters: g.filters.map((f) => (f.id === filterId ? { ...next, id: filterId } : f)) }
          : g,
      )
    }

    const removeGroupFilter = (groupId: string, filterId: string) => {
      groups.value = groups.value.map((g) =>
        g.id === groupId ? { ...g, filters: g.filters.filter((f) => f.id !== filterId) } : g,
      )
    }

    const clearAll = () => {
      filters.value = []
      groups.value = []
      rootLogic.value = QueryLogic.AND
    }

    const hasConditions = computed(() => filters.value.length > 0 || groups.value.length > 0)

    const renderFieldMenu = () => (
      <div class="absolute top-full left-0 mt-1 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-lg shadow-lg z-50 min-w-28 py-1">
        <div class="px-2 py-1 text-[9px] text-[var(--color-text-light)] uppercase tracking-wide border-b border-[var(--color-border)]">
          {$t('common.advancedQuery.dropdown.selectFieldTitle')}
        </div>
        {props.fields.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => addFilter(f.key)}
            class="w-full text-left px-2 py-1.5 text-[11px] hover:bg-[var(--color-border)] transition-colors"
          >
            {translateLabel(f.labelKey)}
          </button>
        ))}
        <div class="border-t border-[var(--color-border)] mt-1 pt-1">
          <button
            type="button"
            onClick={() => {
              addGroup()
              showFieldMenu.value = false
            }}
            class="w-full text-left px-2 py-1.5 text-[11px] text-[var(--color-accent)] hover:bg-[var(--color-accent)]/10 transition-colors"
          >
            + {$t('common.advancedQuery.action.addGroup')}
          </button>
        </div>
      </div>
    )

    const renderRootConnector = () => (
      <button
        type="button"
        onClick={toggleRootLogic}
        class="px-1 py-0.5 text-[10px] font-medium text-[var(--color-accent)] hover:bg-[var(--color-accent)]/10 rounded transition-colors"
        title={$t('common.advancedQuery.tooltip.toggleLogic') as string}
      >
        {rootLogic.value === QueryLogic.AND
          ? ($t('common.advancedQuery.logicConnector.and') as string)
          : ($t('common.advancedQuery.logicConnector.or') as string)}
      </button>
    )

    const renderGroup = (group: QueryGroupItem) => (
      <div class="inline-flex items-center gap-1 px-1.5 py-1 bg-[var(--color-bg-body)] border border-[var(--color-border)] rounded-lg group">
        <span class="text-[9px] text-[var(--color-text-light)]">(</span>

        {group.filters.map((filter, index) => (
          <span key={filter.id} class="contents">
            {index > 0 && (
              <button
                type="button"
                onClick={() =>
                  updateGroupLogic(group.id, group.logic === QueryLogic.AND ? QueryLogic.OR : QueryLogic.AND)
                }
                class="px-1 py-0.5 text-[9px] font-medium text-[var(--color-accent)] hover:bg-[var(--color-accent)]/10 rounded transition-colors"
                title={$t('common.advancedQuery.tooltip.toggleLogic') as string}
              >
                {group.logic === QueryLogic.AND
                  ? ($t('common.advancedQuery.logicConnector.and') as string)
                  : ($t('common.advancedQuery.logicConnector.or') as string)}
              </button>
            )}
            <FilterPill
              condition={filter}
              fields={props.fields}
              onUpdate={(c) => updateGroupFilter(group.id, filter.id, { ...c, id: filter.id })}
              onRemove={() => removeGroupFilter(group.id, filter.id)}
            />
          </span>
        ))}

        <div class="relative" ref={showGroupFieldMenu.value === group.id ? groupMenuRef : undefined}>
          <button
            type="button"
            onClick={() => {
              showGroupFieldMenu.value = showGroupFieldMenu.value === group.id ? null : group.id
              showFieldMenu.value = false
            }}
            class="w-4 h-4 flex items-center justify-center text-[var(--color-text-light)] hover:text-[var(--color-accent)] hover:bg-[var(--color-accent)]/10 rounded transition-colors"
            aria-label={$t('common.advancedQuery.action.filter') as string}
          >
            <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
          </button>
          {showGroupFieldMenu.value === group.id && (
            <div class="absolute top-full left-0 mt-1 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-lg shadow-lg z-50 min-w-28 py-1">
              {props.fields.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => addFilterToGroup(group.id, f.key)}
                  class="w-full text-left px-2 py-1 text-[10px] hover:bg-[var(--color-border)] transition-colors"
                >
                  {translateLabel(f.labelKey)}
                </button>
              ))}
            </div>
          )}
        </div>

        <span class="text-[9px] text-[var(--color-text-light)]">)</span>

        <button
          type="button"
          onClick={() => removeGroup(group.id)}
          class="w-0 group-hover:w-4 h-4 flex items-center justify-center text-[var(--color-text-light)] hover:text-red-500 transition-all overflow-hidden"
          aria-label={$t('common.advancedQuery.action.removeGroup') as string}
        >
          <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    )

    return () => (
      <div
        class="text-[11px]"
        onKeydown={(e) => {
          if (e.key !== 'Enter') return
          const target = e.target as HTMLElement | null
          if (!target) return
          const tag = target.tagName?.toLowerCase?.() ?? ''
          if (tag !== 'input' && tag !== 'textarea') return
          emit('search', buildQuery())
        }}
      >
        <div class="flex flex-wrap items-center gap-1.5">
          {filters.value.map((filter, index) => (
            <span key={filter.id} class="contents">
              {index > 0 && renderRootConnector()}
              <FilterPill
                condition={filter}
                fields={props.fields}
                onUpdate={(c) => updateFilter(filter.id, { ...c, id: filter.id })}
                onRemove={() => removeFilter(filter.id)}
              />
            </span>
          ))}

          {groups.value.map((group, index) => (
            <span key={group.id} class="contents">
              {(filters.value.length > 0 || index > 0) && renderRootConnector()}
              {renderGroup(group)}
            </span>
          ))}

          <div class="relative" ref={showFieldMenu.value ? rootMenuRef : undefined}>
            <button
              type="button"
              onClick={() => {
                showFieldMenu.value = !showFieldMenu.value
                showGroupFieldMenu.value = null
              }}
              class="inline-flex items-center gap-1 h-6 px-2 text-[var(--color-text-light)] hover:text-[var(--color-accent)] hover:bg-[var(--color-accent)]/10 border border-dashed border-[var(--color-border)] hover:border-[var(--color-accent)] rounded-full transition-colors"
            >
              <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              <span>{$t('common.advancedQuery.action.filter')}</span>
            </button>
            {showFieldMenu.value && renderFieldMenu()}
          </div>

          {hasConditions.value && (
            <button
              type="button"
              onClick={() => {
                clearAll()
                emit('reset', buildQuery())
              }}
              class="h-6 px-2 text-[var(--color-text-light)] hover:text-red-500 transition-colors"
            >
              {$t('common.advancedQuery.action.clear')}
            </button>
          )}
        </div>

        {!hasConditions.value && (
          <div class="mt-2 text-[10px] text-[var(--color-text-light)]">
            {$t('common.advancedQuery.hint.empty')}
          </div>
        )}
      </div>
    )
  },
})
