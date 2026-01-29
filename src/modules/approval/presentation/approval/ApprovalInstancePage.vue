<script setup lang="ts">
import { $t } from '@/_utils/i18n'
import type {
  ApprovalInstance,
  ApprovalInstancesPageRequest,
} from '@/modules/approval/application/models'
import { useApprovalInstancePage, useClaimTask } from '@/modules/approval/application/hooks/useApprovalService'
import type { BasePageRequest } from '@/modules/shared/application/request/types'
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
import type { SignInResponse } from '@/modules/user/application/models'
import { formatted } from '@/modules/shared/presentation/time'
import { useRouter } from 'vue-router'
import StatusTag from './StatusTag'
const router = useRouter()
const searchFormData = ref<ApprovalInstancesPageRequest>({})
const searchData = computed(() => {
  const result: BasePageRequest<ApprovalInstancesPageRequest> = {
    page: pagination.page,
    size: pagination.pageSize,
  }
  if (Object.keys(searchFormData.value).length) {
    result.query = searchFormData.value
  }
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
const instanceQuery = useApprovalInstancePage(searchData.value)
function createColumns({
  approve,
  claim,
}: {
  approve: (rowData: ApprovalInstance<Record<string, unknown>>) => void
  claim: (rowData: ApprovalInstance<Record<string, unknown>>) => void
}): DataTableColumns<ApprovalInstance<Record<string, unknown>>> {
  return [
    {
      title: $t('approval.instance.processName'),
      key: 'processName',
    },
    {
      title: $t('approval.instance.nodeName'),
      key: 'nodeName',
    },
    {
      title: $t('approval.instance.status'),
      key: 'status',
      render: (row) => {
        return h(StatusTag(row.status, 'Instance'))
      },
    },
    {
      title: $t('approval.instance.taskStatus'),
      key: 'taskStatus',
      render: (row) => {
        return h(StatusTag(row.taskStatus, 'Task', isApprovalFinish(row.status)))
      },
    },
    {
      title: $t('approval.instance.assigneeName'),
      key: 'assigneeName',
      render: (row) => {
        return showIncompletedUserName(row.assigneeName)
      },
    },
    {
      title: $t('approval.instance.applicantName'),
      key: 'applicantName',
      render: (row) => {
        return showIncompletedUserName(row.applicantName)
      },
    },
    {
      title: $t('common.createTime'),
      key: 'createTime',
      render: (row) => {
        return formatted(row.createdTime).standard
      },
    },
    {
      title: $t('actions.operate'),
      key: 'operate',
      render(row) {
        return h(
          NSpace,
          {},
          {
            default: () => {
              const currentUser = useAccountStore().account
              const buttonArray = []
              const claimResult = canClaimTask(row, currentUser as SignInResponse)
              buttonArray.push(
                h(
                  NButton,
                  { size: 'small', onClick: () => approve(row) },
                  {
                    default: () =>
                      isApproveBtnVisible(row.status) ? $t('actions.approve') : $t('actions.read'),
                  },
                ),
              )
              if (claimResult.canClaim) {
                buttonArray.push(
                  h(
                    NPopconfirm,
                    {
                      onPositiveClick: () => {
                        claim(row)
                      },
                    },
                    {
                      trigger: () =>
                        h(NButton, { size: 'small' }, { default: () => $t('actions.claim') }),
                      default: () => $t('approval.claim.confirm', { id: row.taskId }),
                    },
                  ),
                )
              }
              return buttonArray
            },
          },
        )
      },
    },
  ]
}
const claimMutation = useClaimTask()
const columns = createColumns({
  approve: (row: ApprovalInstance<Record<string, unknown>>) => {
    router.push({
      name: 'approval-instance-detail',
      query: {
        template: row.processName,
        instanceId: row.id,
      },
    })
  },
  claim: (row: ApprovalInstance<Record<string, unknown>>) => {
    claimMutation.mutate(row.taskId)
  },
})
</script>
<template>
  <n-data-table
    :bordered="false"
    :single-line="false"
    :columns="columns"
    :data="instanceQuery.data.value?.records"
    :pagination="pagination"
    :loading="instanceQuery.isLoading.value"
  />
</template>
