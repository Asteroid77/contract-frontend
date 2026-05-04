import {
  NButton,
  NSpace,
  NSelect,
  NDataTable,
  type DataTableColumns,
  type PaginationProps,
} from 'naive-ui'
import { computed, defineComponent, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAccountStore } from '@/modules/user/application/stores/useAccountStore'
import {
  useWorkOrderList,
  useHandlerWorkOrderList,
  useHandlerCategories,
} from '../application/hooks/useWorkOrderService'
import { WorkOrderStatus } from '../domain/enums'
import type { WorkOrderSummaryVO, WorkOrderListParams } from '../domain/types'
import WorkOrderStatusBadge from './WorkOrderStatusBadge'
import WorkOrderCreateModal from './WorkOrderCreateModal'
import { formatted } from '@/modules/shared/presentation/time'
import WorkOrderCategorySelect from './WorkOrderCategorySelect'
import { useIsMobile } from '@/app/presentation/hooks/useIsMobile'
import MobilePrimarySecondaryText from '@/modules/shared/presentation/widget/MobilePrimarySecondaryText'

type Row = WorkOrderSummaryVO

export default defineComponent({
  name: 'WorkOrderListPage',
  setup() {
    const router = useRouter()
    const { t: $t } = useI18n()
    const accountStore = useAccountStore()

    const isHandler = computed(() => accountStore.hasRole('work_order_handler'))
    const isMobile = useIsMobile(768)

    const showCreateModal = ref(false)
    const selectedCategoryId = ref<number | undefined>(undefined)
    const selectedStatus = ref<WorkOrderStatus | undefined>(undefined)

    const statusOptions = computed(() => [
      { label: $t('domain.workOrder.label.allStatus'), value: undefined },
      { label: $t('domain.workOrder.status.pending'), value: WorkOrderStatus.PENDING },
      { label: $t('domain.workOrder.status.processing'), value: WorkOrderStatus.PROCESSING },
      { label: $t('domain.workOrder.status.completed'), value: WorkOrderStatus.COMPLETED },
      { label: $t('domain.workOrder.status.cancelled'), value: WorkOrderStatus.CANCELLED },
    ])
    const statusSelectWidth = 'calc(var(--spacing-80) * 2)'

    const categoriesQuery = useHandlerCategories({ enabled: isHandler })

    const pagination: PaginationProps = reactive({
      page: 1,
      pageSize: 10,
      showSizePicker: true,
      pageSizes: [10, 20, 50, 100],
      onChange: (page: number) => {
        pagination.page = page
      },
      onUpdatePageSize: (pageSize: number) => {
        pagination.pageSize = pageSize
        pagination.page = 1
      },
    })

    const searchParams = computed<WorkOrderListParams>(() => ({
      page: pagination.page,
      size: pagination.pageSize,
      categoryId: selectedCategoryId.value,
      status: selectedStatus.value,
    }))

    const userListQuery = useWorkOrderList(searchParams, {
      enabled: computed(() => !isHandler.value),
    })
    const handlerListQuery = useHandlerWorkOrderList(searchParams, { enabled: isHandler })

    const listQuery = computed(() => (isHandler.value ? handlerListQuery : userListQuery))

    const handleSearch = () => {
      pagination.page = 1
      listQuery.value.refetch()
    }

    const handleRowClick = (row: WorkOrderSummaryVO) => {
      router.push({ name: 'work-order-detail', params: { id: row.id } })
    }

    const columns = computed<DataTableColumns<Row>>(() => [
      {
        title: $t('domain.workOrder.field.title'),
        key: 'title',
        ellipsis: { tooltip: true },
        render: (row) =>
          isMobile.value ? (
            <MobilePrimarySecondaryText
              primary={row.title}
              secondary={[`${row.categoryName || '-'} · ${formatted(row.createdTime).standard}`]}
            />
          ) : (
            row.title
          ),
      },
      ...(isMobile.value
        ? []
        : [
            {
              title: $t('domain.workOrder.field.category'),
              key: 'categoryName',
              width: 160,
            },
          ]),
      {
        title: $t('domain.workOrder.field.status'),
        key: 'status',
        width: isMobile.value ? 96 : 120,
        render: (row) => <WorkOrderStatusBadge status={row.status} />,
      },
      ...(isMobile.value
        ? []
        : [
            {
              title: $t('domain.workOrder.field.score'),
              key: 'score',
              width: 80,
              render: (row: Row) => (row.score != null ? `${row.score}` : '-'),
            },
            {
              title: $t('common.time.created'),
              key: 'createdTime',
              width: 180,
              render: (row: Row) => formatted(row.createdTime).standard,
            },
          ]),
    ])

    const rowProps = (row: Row) => ({
      style: 'cursor: pointer;',
      onClick: () => handleRowClick(row),
    })

    const handleCreateSuccess = () => {
      showCreateModal.value = false
      pagination.page = 1
      listQuery.value.refetch()
    }

    return () => (
      <NSpace vertical size={16}>
        <NSpace justify="space-between" align="center">
          <NSpace size={12} align="center">
            <WorkOrderCategorySelect
              value={selectedCategoryId.value ?? null}
              showAdd={true}
              showEdit={true}
              showDelete={true}
              showSearch={true}
              onUpdate:value={(value: number | null) => {
                selectedCategoryId.value = value ?? undefined
              }}
            />
            <NSelect
              value={selectedStatus.value}
              options={statusOptions.value}
              placeholder={$t('domain.workOrder.label.allStatus')}
              clearable
              style={{ width: statusSelectWidth }}
              onUpdate:value={(value: WorkOrderStatus | null) => {
                selectedStatus.value = value ?? undefined
              }}
            />
            <NButton type="primary" size="tiny" onClick={handleSearch}>
              {$t('common.action.search')}
            </NButton>
          </NSpace>

          <NButton
            type="primary"
            size="tiny"
            onClick={() => {
              showCreateModal.value = true
            }}
          >
            {$t('domain.workOrder.action.create')}
          </NButton>
        </NSpace>

        <NDataTable
          bordered={false}
          singleLine={false}
          columns={columns.value}
          data={listQuery.value.data.value?.records || []}
          pagination={pagination}
          loading={listQuery.value.isLoading.value}
          rowProps={rowProps}
        />

        <WorkOrderCreateModal
          show={showCreateModal.value}
          categories={categoriesQuery.data.value ?? []}
          onUpdate:show={(value: boolean) => {
            showCreateModal.value = value
          }}
          onSuccess={handleCreateSuccess}
        />
      </NSpace>
    )
  },
})
