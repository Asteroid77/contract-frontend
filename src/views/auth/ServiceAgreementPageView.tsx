import { computed, defineComponent } from 'vue'
import { SearchOutlined } from '@vicons/antd'
import { NButton, NIcon, NResult, NSpace } from 'naive-ui'
import ServiceAgreementPage from '@/modules/service-agreement/presentation/sign/ServiceAgreementPage'
import { useServiceAgreementPage } from '@/modules/service-agreement/application/hooks/useSignService'
import type { ServiceAgreementPageItem } from '@/modules/service-agreement/application/models'
import {
  buildServiceAgreementPageRouteQuery,
  buildServiceAgreementPrefillQueryFromPageQuery,
  canCreateServiceAgreementFromQuery,
  normalizeServiceAgreementPageQuery,
  parseServiceAgreementPageRouteQuery,
} from '@/modules/service-agreement/application/entry-search'
import {
  ModernQueryBuilder,
  QueryActionButtons,
} from '@/modules/shared/presentation/advanced-query'
import { useListQueryState } from '@/modules/shared/presentation/advanced-query/useListQueryState'
import type { QueryFilters } from '@/modules/shared/domain/query'
import { serviceAgreementAdvancedQueryFields } from '@/modules/service-agreement/presentation/sign/serviceAgreementAdvancedQueryFields'
import { $t } from '@/_utils/i18n'
import { useTypedRoute, useTypedRouter } from '@/router/useTypedRouter'

type ServiceAgreementPageRequest = Parameters<typeof useServiceAgreementPage>[0]['value']

const renderPrimarySearchIcon = () => (
  <NIcon size={40} style={{ color: 'var(--color-primary)' }}>
    <SearchOutlined />
  </NIcon>
)

export default defineComponent({
  name: 'ServiceAgreementView',
  setup() {
    const router = useTypedRouter()
    const route = useTypedRoute()
    const restoredQuery = parseServiceAgreementPageRouteQuery(
      route.query as Record<string, unknown>,
    )

    const {
      draftQueryFilters,
      appliedQueryFilters,
      pagination,
      handleSearch: applySearch,
      handleReset: applyReset,
    } = useListQueryState()

    draftQueryFilters.value = restoredQuery ?? {}
    appliedQueryFilters.value = restoredQuery

    const hasSearched = computed(() => appliedQueryFilters.value != null)

    const pageRequest = computed<ServiceAgreementPageRequest>(() => {
      const request: ServiceAgreementPageRequest = {
        page: pagination.page,
        size: pagination.pageSize,
      }
      if (appliedQueryFilters.value) {
        request.query = appliedQueryFilters.value as ServiceAgreementPageRequest['query']
      }
      return request
    })

    const {
      data: pageResult,
      isPending,
      refetch,
    } = useServiceAgreementPage(
      pageRequest,
      computed(() => hasSearched.value),
    )

    const tableData = computed(() => pageResult.value?.records || [])
    const displayedTableData = computed(() => (hasSearched.value ? tableData.value : []))
    const showPrompt = computed(() => !hasSearched.value)
    const showNoResult = computed(
      () => hasSearched.value && !isPending.value && displayedTableData.value.length === 0,
    )
    const showCreateButton = computed(
      () => showNoResult.value && canCreateServiceAgreementFromQuery(appliedQueryFilters.value),
    )

    const handleSearch = (query?: QueryFilters) => {
      const nextQuery = normalizeServiceAgreementPageQuery(query ?? draftQueryFilters.value)

      if (!nextQuery) {
        applyReset()
        router.replace({
          name: 'sign-page',
          query: {},
        })
        return
      }

      const shouldForceRefetch = applySearch(nextQuery)
      router.replace({
        name: 'sign-page',
        query: buildServiceAgreementPageRouteQuery(nextQuery),
      })

      if (shouldForceRefetch) refetch()
    }

    const handleReset = () => {
      applyReset()
      router.replace({
        name: 'sign-page',
        query: {},
      })
    }

    const handleCreate = () => {
      router.push({
        name: 'sign',
        query: buildServiceAgreementPrefillQueryFromPageQuery(appliedQueryFilters.value),
      })
    }

    const handleActions = (row: ServiceAgreementPageItem, mode: 'edit' | 'detail') => {
      router.push({
        name: 'sign',
        query: {
          mode,
          ...(row.id ? { id: String(row.id) } : {}),
        },
      })
    }

    const renderEmptyState = () => {
      if (showPrompt.value) {
        return (
          <NResult
            status="info"
            title="请先查询"
            description="请先查询系统内是否已有该公司的备案/签约项"
            v-slots={{
              icon: renderPrimarySearchIcon,
            }}
          />
        )
      }

      if (showNoResult.value) {
        return (
          <NResult
            status="info"
            title="未查询到符合条件的数据"
            description="请先确认系统内是否已有该公司的备案/签约项。"
            v-slots={{
              icon: renderPrimarySearchIcon,
              footer: () =>
                showCreateButton.value ? (
                  <NButton size="tiny" onClick={handleCreate}>
                    {$t('common.action.add')}
                  </NButton>
                ) : null,
            }}
          />
        )
      }

      return null
    }

    return () => (
      <NSpace vertical size="large">
        <NSpace vertical size={8}>
          <ModernQueryBuilder
            fields={serviceAgreementAdvancedQueryFields}
            v-model:query={draftQueryFilters.value}
            onSearch={handleSearch}
            onReset={handleReset}
          />
          <QueryActionButtons
            searchLoading={hasSearched.value && isPending.value}
            onSearch={() => handleSearch(draftQueryFilters.value)}
            onReset={handleReset}
          />
        </NSpace>

        <ServiceAgreementPage
          data={displayedTableData.value}
          pagination={pagination}
          loading={hasSearched.value && isPending.value}
          v-slots={{
            actions: (row: ServiceAgreementPageItem) => (
              <NSpace>
                <NButton
                  size="tiny"
                  onClick={() => {
                    handleActions(row, 'edit')
                  }}
                >
                  {$t('common.action.edit')}
                </NButton>
                <NButton size="tiny" onClick={() => handleActions(row, 'detail')}>
                  {$t('common.action.view')}
                </NButton>
              </NSpace>
            ),
            empty: renderEmptyState,
          }}
        />
      </NSpace>
    )
  },
})
