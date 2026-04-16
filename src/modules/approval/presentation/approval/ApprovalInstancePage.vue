<script setup lang="ts">
import type {
  ApprovalInstance,
  ApprovalInstancesPageRequest,
} from '@/modules/approval/application/models'
import {
  useApprovalInstancePage,
  useClaimTask,
} from '@/modules/approval/application/hooks/useApprovalService'
import { NButton, NSpace, type DataTableColumns, NDataTable, NPopconfirm } from 'naive-ui'
import { computed, h } from 'vue'
import {
  canClaimTask,
  isApprovalFinish,
  isApproveBtnVisible,
} from '@/modules/approval/application/utils'
import { useAccountStore } from '@/modules/user/application/stores/useAccountStore'
import type { SignInResponseComplete } from '@/modules/user/application/models'
import { resolveUserDisplayText } from '@/modules/user/application/utils/displayName'
import { formatted } from '@/modules/shared/presentation/time'
import { useRouter } from 'vue-router'
import StatusTag from './StatusTag'
import { useI18n } from 'vue-i18n'
import {
  ModernQueryBuilder,
  QueryActionButtons,
} from '@/modules/shared/presentation/advanced-query'
import { useListQueryState } from '@/modules/shared/presentation/advanced-query/useListQueryState'
import { useResponsiveTableMode } from '@/modules/shared/presentation/table/useResponsiveTableMode'
import MobilePrimarySecondaryText from '@/modules/shared/presentation/widget/MobilePrimarySecondaryText'
import { approvalInstanceAdvancedQueryFields } from './approvalInstanceAdvancedQueryFields'
const router = useRouter()
const { t: $t } = useI18n()
const accountStore = useAccountStore()

type Row = ApprovalInstance<Record<string, unknown>>

const { draftQueryFilters, appliedQueryFilters, pagination, bindRefetchHandlers } =
  useListQueryState()
const { containerRef: tableContainerRef, mode: tableMode } = useResponsiveTableMode()

const searchData = computed(() => {
  const result: ApprovalInstancesPageRequest = {
    page: pagination.page,
    size: pagination.pageSize,
  }
  if (appliedQueryFilters.value) result.query = appliedQueryFilters.value
  return result
})
const instanceQuery = useApprovalInstancePage(searchData)
const claimMutation = useClaimTask()
const { onSearch: handleSearchWithRefetch, onReset: handleResetWithRefetch } = bindRefetchHandlers(
  () => instanceQuery.refetch(),
)
const formatApprovalUserName = (name: string | null | undefined) =>
  resolveUserDisplayText(name, {
    emptyFallback: $t('common.label.none'),
    numericNamePrefix: $t('domain.approval.label.incompleteUser'),
  })

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

const renderProcessSummary = (row: Row, mode: 'compact' | 'stacked') =>
  h(MobilePrimarySecondaryText, {
    primary: row.processName,
    secondary:
      mode === 'compact'
        ? [
            row.nodeName,
            formatApprovalUserName(row.applicantName),
            formatted(row.createdTime).standard,
          ]
        : [
            `${row.nodeName} · ${formatApprovalUserName(row.applicantName)}`,
            formatted(row.createdTime).standard,
          ],
  })

const renderStatusSummary = (row: Row) =>
  h('div', { class: 'min-w-0 flex flex-col gap-1.5' }, [
    h('div', { class: 'text-xs text-[var(--color-text-main)] truncate leading-5' }, [
      h(StatusTag(row.status, 'Instance')),
    ]),
    h('div', { class: 'text-xs text-[var(--color-text-light)] truncate leading-5' }, [
      h(StatusTag(row.taskStatus, 'Task', isApprovalFinish(row.status))),
    ]),
  ])

const renderOperate = (row: Row) => {
  const buttonArray: ReturnType<typeof h>[] = []
  const claimResult = canClaimTask(row, accountStore.account as SignInResponseComplete)

  buttonArray.push(
    h(
      NButton,
      { size: 'tiny', onClick: () => handleApprove(row) },
      {
        default: () =>
          isApproveBtnVisible(row.status) ? $t('common.action.approve') : $t('common.action.view'),
      },
    ),
  )
  if (claimResult.canClaim) {
    buttonArray.push(
      h(
        NPopconfirm,
        { onPositiveClick: () => handleClaim(row) },
        {
          trigger: () => h(NButton, { size: 'tiny' }, { default: () => $t('common.action.claim') }),
          default: () => $t('domain.approval.message.claimConfirm', { id: row.taskId }),
        },
      ),
    )
  }
  return h(NSpace, {}, { default: () => buttonArray })
}

const getWideColumns = (): DataTableColumns<Row> => [
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
    render: (row: Row) => h(StatusTag(row.status, 'Instance')),
  },
  {
    title: $t('common.label.status'),
    key: 'taskStatus',
    render: (row: Row) => h(StatusTag(row.taskStatus, 'Task', isApprovalFinish(row.status))),
  },
  {
    title: $t('domain.approval.field.approver'),
    key: 'assigneeName',
    render: (row: Row) => formatApprovalUserName(row.assigneeName),
  },
  {
    title: $t('domain.approval.field.applicant'),
    key: 'applicantName',
    render: (row: Row) => formatApprovalUserName(row.applicantName),
  },
  {
    title: $t('common.time.created'),
    key: 'createdTime',
    render: (row: Row) => formatted(row.createdTime).standard,
  },
]

const getCompactColumns = (): DataTableColumns<Row> => [
  {
    title: $t('domain.approval.field.process'),
    key: 'processName',
    render: (row: Row) => renderProcessSummary(row, 'compact'),
  },
  {
    title: $t('common.label.status'),
    key: 'status',
    render: (row: Row) => renderStatusSummary(row),
  },
]

const getStackedColumns = (): DataTableColumns<Row> => [
  {
    title: $t('domain.approval.field.process'),
    key: 'processName',
    render: (row: Row) => renderProcessSummary(row, 'stacked'),
  },
  {
    title: $t('common.label.status'),
    key: 'status',
    render: (row: Row) => renderStatusSummary(row),
  },
]

const columns = computed<DataTableColumns<Row>>(() => [
  ...(tableMode.value === 'wide'
    ? getWideColumns()
    : tableMode.value === 'compact'
      ? getCompactColumns()
      : getStackedColumns()),
  {
    title: $t('common.action.operate'),
    key: 'operate',
    render: (row) => renderOperate(row),
  },
])
</script>
<template>
  <n-space vertical :size="16">
    <n-space vertical :size="8">
      <ModernQueryBuilder
        :fields="approvalInstanceAdvancedQueryFields"
        v-model:query="draftQueryFilters"
        @search="handleSearchWithRefetch"
        @reset="handleResetWithRefetch"
      />
      <QueryActionButtons
        @search="handleSearchWithRefetch(draftQueryFilters)"
        @reset="handleResetWithRefetch"
      />
    </n-space>

    <div ref="tableContainerRef">
      <n-data-table
        :bordered="false"
        :single-line="false"
        :columns="columns"
        :data="instanceQuery.data.value?.records || []"
        :pagination="pagination"
        :loading="instanceQuery.isLoading.value"
      />
    </div>
  </n-space>
</template>
