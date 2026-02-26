import { defineComponent, ref, computed, reactive } from 'vue'
import { NSpace, NButton, type PaginationProps } from 'naive-ui'
import ServiceAgreementPage from '@/modules/service-agreement/presentation/sign/ServiceAgreementPage'
import { useServiceAgreementPage } from '@/modules/service-agreement/application/hooks/useSignService'
import type { ServiceAgreementPageItem } from '@/modules/service-agreement/application/models'
import {
  ModernQueryBuilder,
  QueryActionButtons,
} from '@/modules/shared/presentation/advanced-query'
import type { QueryFilters } from '@/modules/shared/domain/query'
import type { BaseQuery } from '@/modules/shared/application/request/types'
import { serviceAgreementAdvancedQueryFields } from '@/modules/service-agreement/presentation/sign/serviceAgreementAdvancedQueryFields'
import { $t } from '@/_utils/i18n'
import { useRouter } from 'vue-router'
import type { RouteLocationAsRelativeGeneric } from 'vue-router'

type ServiceAgreementQueryFilters = QueryFilters & BaseQuery
type ServiceAgreementPageRequest = Parameters<typeof useServiceAgreementPage>[0]['value']

const normalizeAppliedQuery = (
  query: ServiceAgreementQueryFilters,
): ServiceAgreementQueryFilters | null => (query.filters?.length || query.group ? query : null)

export default defineComponent({
  name: 'ServiceAgreementView',
  setup() {
    const draftQueryFilters = ref<ServiceAgreementQueryFilters>({})
    const appliedQueryFilters = ref<ServiceAgreementQueryFilters | null>(null)

    const router = useRouter()

    const pagination: PaginationProps = reactive({
      page: 1,
      pageSize: 10,
      showSizePicker: true,
      pageSizes: [10, 50, 100],
      onChange: (page: number) => {
        pagination.page = page
      },
      onUpdatePageSize: (pageSize: number) => {
        pagination.pageSize = pageSize
        pagination.page = 1
      },
    })

    const pageRequest = computed<ServiceAgreementPageRequest>(() => {
      const request: ServiceAgreementPageRequest = {
        page: pagination.page,
        size: pagination.pageSize,
      }
      if (appliedQueryFilters.value) {
        request.query = appliedQueryFilters.value
      }
      return request
    })

    const { data: pageResult, isPending, refetch } = useServiceAgreementPage(pageRequest)
    const tableData = computed(() => pageResult.value?.records || [])

    const handleSearch = (query?: QueryFilters) => {
      const nextApplied = normalizeAppliedQuery(
        (query ?? draftQueryFilters.value) as ServiceAgreementQueryFilters,
      )
      const shouldForceRefetch =
        pagination.page === 1 &&
        JSON.stringify(appliedQueryFilters.value ?? {}) === JSON.stringify(nextApplied ?? {})

      appliedQueryFilters.value = nextApplied
      pagination.page = 1
      if (shouldForceRefetch) refetch()
    }

    const handleReset = () => {
      const shouldForceRefetch = pagination.page === 1 && appliedQueryFilters.value == null

      draftQueryFilters.value = {}
      appliedQueryFilters.value = null
      pagination.page = 1
      if (shouldForceRefetch) refetch()
    }

    const handleActions = (row: ServiceAgreementPageItem, mode: 'edit' | 'detail') => {
      const routeInfo = {
        name: 'sign',
        query: {
          mode,
        },
      } as RouteLocationAsRelativeGeneric
      if (row.id) {
        routeInfo.query = {
          ...routeInfo.query,
          id: Number(row.id),
        }
      }
      router.push(routeInfo)
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
            searchLoading={isPending.value}
            onSearch={() => handleSearch(draftQueryFilters.value)}
            onReset={handleReset}
          />
        </NSpace>

        <ServiceAgreementPage
          data={tableData.value}
          pagination={pagination}
          loading={isPending.value}
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
          }}
        />
      </NSpace>
    )
  },
})
