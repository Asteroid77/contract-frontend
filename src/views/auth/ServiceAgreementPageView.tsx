import { defineComponent, ref, computed, reactive } from 'vue'
import { NSpace, NInput, NSelect, NButton, type PaginationProps } from 'naive-ui'
import ServiceAgreementPage from '@/modules/service-agreement/presentation/sign/ServiceAgreementPage'
import { useServiceAgreementPage } from '@/modules/service-agreement/application/hooks/useSignService' // 替换为实际 hook 路径
import { ServiceAgreementStatusOption } from '@/modules/service-agreement/application/constants' // 假设枚举路径
import type { BasePageRequest } from '@/modules/shared/application/request/types'
import type { ServiceAgreementPageDTO, ServiceAgreementPageVo } from '@/modules/service-agreement/application/models'
import { $t } from '@/_utils/i18n'
import { useRouter } from 'vue-router'
import type { RouteLocationAsRelativeGeneric } from 'vue-router'

export default defineComponent({
  name: 'ServiceAgreementView',
  setup() {
    // 初始化分页查询参数
    const pageRequest = ref<BasePageRequest<ServiceAgreementPageDTO>>({
      page: 1,
      size: 10,
    })

    // 调用 Hook
    // data 对应后端返回的 Page 对象 (包含 records, total 等)
    const { data: pageResult, isPending, refetch } = useServiceAgreementPage(pageRequest)
    const router = useRouter()

    // 处理表格数据
    const tableData = computed(() => pageResult.value?.records || [])

    // 4. 构建 Naive UI 需要的分页对象 (PaginationInfo)
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

    // 5. 搜索处理
    const handleSearch = () => {
      refetch()
    }

    const handleReset = () => {
      delete pageRequest.value.query
      handleSearch()
    }

    const handleActions = (row: ServiceAgreementPageVo, mode: 'edit' | 'detail') => {
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
        {/* ----- 搜索区域示例 ----- */}
        <NSpace>
          <NInput
            placeholder="搜索公司名称"
            value={pageRequest.value.query?.companyName?.value}
            onUpdateValue={(v) => {
              if (pageRequest.value.query?.companyName) {
                pageRequest.value.query.companyName.value = v
              }
            }}
            style={{ width: '200px' }}
          />

          <NSelect
            placeholder="状态"
            options={ServiceAgreementStatusOption}
            value={pageRequest.value.query?.status?.value}
            onUpdateValue={(v) => {
              if (pageRequest.value.query?.status) {
                pageRequest.value.query.status.value = v
              }
            }}
            style={{ width: '150px' }}
          />

          <NButton type="primary" onClick={handleSearch} loading={isPending.value}>
            {$t('actions.search')}
          </NButton>
          <NButton onClick={handleReset}>{$t('actions.reset')}</NButton>
        </NSpace>

        {/* ----- 子组件调用 ----- */}
        <ServiceAgreementPage
          data={tableData.value}
          pagination={pagination}
          loading={isPending.value}
          v-slots={{
            actions: (row: ServiceAgreementPageVo) => (
              <NSpace>
                <NButton
                  size="tiny"
                  onClick={() => {
                    handleActions(row, 'edit')
                  }}
                >
                  {$t('actions.edit')}
                </NButton>
                <NButton size="tiny" onClick={() => handleActions(row, 'detail')}>
                  {$t('actions.read')}
                </NButton>
              </NSpace>
            ),
          }}
        />
      </NSpace>
    )
  },
})
