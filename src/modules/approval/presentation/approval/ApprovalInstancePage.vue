<script setup lang="ts">
import type {
  ApprovalInstance,
  ApprovalInstancesPageRequest,
} from '@/modules/approval/application/models'
import {
  useApprovalInstancePage,
  useClaimTask,
} from '@/modules/approval/application/hooks/useApprovalService'
import type { QueryFilters } from '@/modules/shared/domain/query'
import {
  NButton,
  NSpace,
  type DataTableColumns,
  type PaginationProps,
  NDataTable,
  NPopconfirm,
} from 'naive-ui'
import { computed, h, reactive, ref } from 'vue'
import {
  canClaimTask,
  isApprovalFinish,
  isApproveBtnVisible,
  showIncompletedUserName,
} from '@/modules/approval/application/utils'
import { useAccountStore } from '@/modules/user/application/stores/useAccountStore'
import type { SignInResponseComplete } from '@/modules/user/application/models'
import { formatted } from '@/modules/shared/presentation/time'
import { useRouter } from 'vue-router'
import StatusTag from './StatusTag'
import { useI18n } from 'vue-i18n'
import { ModernQueryBuilder } from '@/modules/shared/presentation/advanced-query'
import { approvalInstanceAdvancedQueryFields } from './approvalInstanceAdvancedQueryFields'
const router = useRouter()
const { t: $t } = useI18n()
const accountStore = useAccountStore()

type Row = ApprovalInstance<Record<string, unknown>>

const draftQueryFilters = ref<QueryFilters>({})
const appliedQueryFilters = ref<QueryFilters | null>(null)

const normalizeAppliedQuery = (q: QueryFilters): QueryFilters | null =>
  q.filters?.length || q.group ? q : null

const searchData = computed(() => {
  const result: ApprovalInstancesPageRequest = {
    page: pagination.page,
    size: pagination.pageSize,
  }
  if (appliedQueryFilters.value) result.query = appliedQueryFilters.value
  return result
})
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
const instanceQuery = useApprovalInstancePage(searchData)
const claimMutation = useClaimTask()

const handleSearch = (query?: QueryFilters) => {
  const nextApplied = normalizeAppliedQuery(query ?? draftQueryFilters.value)
  const shouldForceRefetch =
    pagination.page === 1 &&
    JSON.stringify(appliedQueryFilters.value ?? {}) === JSON.stringify(nextApplied ?? {})

  appliedQueryFilters.value = nextApplied
  pagination.page = 1
  if (shouldForceRefetch) instanceQuery.refetch()
}

const handleReset = () => {
  const shouldForceRefetch = pagination.page === 1 && appliedQueryFilters.value == null

  draftQueryFilters.value = {}
  appliedQueryFilters.value = null
  pagination.page = 1
  if (shouldForceRefetch) instanceQuery.refetch()
}

const handleApprove = (row: Row) => {
  router.push({
    name: 'approval-instance-detail',
    query: {
      template: row.processName,
      instanceId: row.id,
    },
  })
}

const handleClaim = (row: Row) => {
  claimMutation.mutate(row.taskId)
}

const columns = computed<DataTableColumns<Row>>(() => [
  {
    title: $t('domain.approval.field.process'),
    key: 'processName',
  },
  {
    title: $t('domain.approval.field.nodeName'),
    key: 'nodeName',
  },
  {
    title: $t('common.label.status'),
    key: 'status',
    render: (row) => h(StatusTag(row.status, 'Instance')),
  },
  {
    title: $t('common.label.status'),
    key: 'taskStatus',
    render: (row) => h(StatusTag(row.taskStatus, 'Task', isApprovalFinish(row.status))),
  },
  {
    title: $t('domain.approval.field.approver'),
    key: 'assigneeName',
    render: (row) => showIncompletedUserName(row.assigneeName),
  },
  {
    title: $t('domain.approval.field.applicant'),
    key: 'applicantName',
    render: (row) => showIncompletedUserName(row.applicantName),
  },
  {
    title: $t('common.time.created'),
    key: 'createdTime',
    render: (row) => formatted(row.createdTime).standard,
  },
  {
    title: $t('common.action.operate'),
    key: 'operate',
    render: (row) => {
      const buttonArray: ReturnType<typeof h>[] = []
      const claimResult = canClaimTask(row, accountStore.account as SignInResponseComplete)

      buttonArray.push(
        h(
          NButton,
          { size: 'small', onClick: () => handleApprove(row) },
          {
            default: () =>
              isApproveBtnVisible(row.status)
                ? $t('common.action.approve')
                : $t('common.action.view'),
          },
        ),
      )
      if (claimResult.canClaim) {
        buttonArray.push(
          h(
            NPopconfirm,
            { onPositiveClick: () => handleClaim(row) },
            {
              trigger: () =>
                h(NButton, { size: 'small' }, { default: () => $t('common.action.claim') }),
              default: () => $t('domain.approval.message.claimConfirm', { id: row.taskId }),
            },
          ),
        )
      }
      return h(NSpace, {}, { default: () => buttonArray })
    },
  },
])
</script>
<template>
  <n-space vertical :size="16">
    <n-space vertical :size="8">
      <ModernQueryBuilder
        :fields="approvalInstanceAdvancedQueryFields"
        v-model:query="draftQueryFilters"
        @search="handleSearch"
        @reset="handleReset"
      />
      <n-space>
        <n-button size="small" type="primary" @click="handleSearch(draftQueryFilters)">
          {{ $t('common.action.search') }}
        </n-button>
        <n-button size="small" @click="handleReset">{{ $t('common.action.reset') }}</n-button>
      </n-space>
    </n-space>

    <n-data-table
      :bordered="false"
      :single-line="false"
      :columns="columns"
      :data="instanceQuery.data.value?.records || []"
      :pagination="pagination"
      :loading="instanceQuery.isLoading.value"
    />
  </n-space>
</template>
