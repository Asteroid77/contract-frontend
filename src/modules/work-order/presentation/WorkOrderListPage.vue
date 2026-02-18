<script setup lang="ts">
import {
  NButton,
  NSpace,
  NSelect,
  NDataTable,
  type DataTableColumns,
  type PaginationProps,
} from 'naive-ui'
import { computed, h, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAccountStore } from '@/modules/user/application/stores/useAccountStore'
import { useWorkOrderList, useHandlerWorkOrderList, useHandlerCategories } from '../application/hooks/useWorkOrderService'
import { WorkOrderStatus } from '../domain/enums'
import type { WorkOrderSummaryVO, WorkOrderListParams } from '../domain/types'
import WorkOrderStatusBadge from './WorkOrderStatusBadge'
import WorkOrderCreateModal from './WorkOrderCreateModal.vue'
import { formatted } from '@/modules/shared/presentation/time'

const router = useRouter()
const { t: $t } = useI18n()
const accountStore = useAccountStore()

const isHandler = computed(() => accountStore.hasRole('work_order_handler'))

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

const categoriesQuery = useHandlerCategories({ enabled: isHandler })

const categoryOptions = computed(() => {
  const base = [{ label: $t('domain.workOrder.label.allCategory'), value: undefined }]
  const cats = categoriesQuery.data.value?.map((c) => ({ label: c.name, value: c.id })) ?? []
  return [...base, ...cats]
})

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

const userListQuery = useWorkOrderList(searchParams, { enabled: computed(() => !isHandler.value) })
const handlerListQuery = useHandlerWorkOrderList(searchParams, { enabled: isHandler })

const listQuery = computed(() => (isHandler.value ? handlerListQuery : userListQuery))

const handleSearch = () => {
  pagination.page = 1
  listQuery.value.refetch()
}

const handleRowClick = (row: WorkOrderSummaryVO) => {
  router.push({ name: 'work-order-detail', params: { id: row.id } })
}

type Row = WorkOrderSummaryVO

const columns = computed<DataTableColumns<Row>>(() => [
  {
    title: $t('domain.workOrder.field.title'),
    key: 'title',
    ellipsis: { tooltip: true },
  },
  {
    title: $t('domain.workOrder.field.category'),
    key: 'categoryName',
    width: 160,
  },
  {
    title: $t('domain.workOrder.field.status'),
    key: 'status',
    width: 120,
    render: (row) => h(WorkOrderStatusBadge, { status: row.status }),
  },
  {
    title: $t('domain.workOrder.field.score'),
    key: 'score',
    width: 80,
    render: (row) => (row.score != null ? `${row.score}` : '-'),
  },
  {
    title: $t('common.time.created'),
    key: 'createdTime',
    width: 180,
    render: (row) => formatted(row.createdTime).standard,
  },
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
</script>
<template>
  <n-space vertical :size="16">
    <n-space justify="space-between" align="center">
      <n-space :size="12" align="center">
        <n-select
          v-model:value="selectedCategoryId"
          :options="categoryOptions"
          :placeholder="$t('domain.workOrder.label.allCategory')"
          clearable
          style="width: 200px"
        />
        <n-select
          v-model:value="selectedStatus"
          :options="statusOptions"
          :placeholder="$t('domain.workOrder.label.allStatus')"
          clearable
          style="width: 160px"
        />
        <n-button type="primary" size="small" @click="handleSearch">
          {{ $t('common.action.search') }}
        </n-button>
      </n-space>

      <n-button type="primary" @click="showCreateModal = true">
        {{ $t('domain.workOrder.action.create') }}
      </n-button>
    </n-space>

    <n-data-table
      :bordered="false"
      :single-line="false"
      :columns="columns"
      :data="listQuery.data.value?.records || []"
      :pagination="pagination"
      :loading="listQuery.isLoading.value"
      :row-props="rowProps"
    />

    <WorkOrderCreateModal
      v-model:show="showCreateModal"
      :categories="categoriesQuery.data.value ?? []"
      @success="handleCreateSuccess"
    />
  </n-space>
</template>
