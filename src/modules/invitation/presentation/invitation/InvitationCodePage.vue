<script setup lang="ts">
import {
  NButton,
  NSpace,
  type DataTableColumns,
  NDataTable,
  type DataTableRowKey,
  NPopconfirm,
  NInput,
} from 'naive-ui'
import { computed, h, ref } from 'vue'
import { formatted } from '@/modules/shared/presentation/time'
import type { InvitationCode } from '@/modules/invitation/application/models'
import {
  useCreateInvitationCodeMutation,
  useDeleteInvitationCodeMutation,
  useInvitationCodeListQuery,
  useUpdateInvitationCodeMutation,
} from '@/modules/invitation/application/hooks/useInvitationService'
import clsx from 'clsx'
import { invitationCodeStatus } from '@/modules/invitation/application/constants'
import { useI18n } from 'vue-i18n'
const { t: $t } = useI18n()
const invitationListQuery = useInvitationCodeListQuery()
function createColumns(): DataTableColumns<InvitationCode> {
  return [
    {
      type: 'selection',
    },
    {
      title: $t('domain.invitation.field.code'),
      key: 'code',
    },
    {
      title: $t('common.label.status'),
      key: 'status',
      render(row) {
        return row.status === invitationCodeStatus.active
          ? $t('domain.invitation.status.active')
          : $t('domain.invitation.status.inactive')
      },
    },
    {
      title: $t('common.field.remark'),
      key: 'remark',
      render(row) {
        return h(NInput, {
          value: row.remark || updateDataMap.value[row.id],
          placeholder: '',
          onUpdateValue(v: string) {
            updateDataMap.value = { ...updateDataMap.value, [row.id]: v }
          },
        })
      },
    },
    {
      title: $t('common.time.created'),
      key: 'createdTime',
      render: (rowData: InvitationCode) => {
        return formatted(rowData.createdTime).standard
      },
    },
  ]
}
const createMutation = useCreateInvitationCodeMutation()
const updateMutation = useUpdateInvitationCodeMutation(clean)
const deleteMutation = useDeleteInvitationCodeMutation(clean)

const updateDataMap = ref<{ [key: number]: string }>({})
const selectedKeys = ref<number[]>([])
const isDelOrSaveBtnDisabled = computed(() => !selectedKeys.value.length)

const update = () => {
  const data = invitationListQuery.data.value?.filter((item) =>
    selectedKeys.value.includes(item.id),
  )
  if (data && data.length) {
    const updateData = data.map((e) => {
      return { id: e.id, remark: updateDataMap.value[e.id] ? updateDataMap.value[e.id] : e.remark }
    })
    updateMutation.mutate(updateData)
  }
}
const deleteFn = () => {
  deleteMutation.mutate(selectedKeys.value)
}

function handleCheck(rowKeys: DataTableRowKey[]) {
  console.log('rowKeys', rowKeys)
  selectedKeys.value = rowKeys as number[]
}
function clean() {
  selectedKeys.value = []
}

const columns = createColumns()
</script>
<template>
  <n-space :class="clsx('my-content')">
    <n-button @click="() => createMutation.mutate()" :loading="createMutation.isPending.value">{{
      $t('common.action.add')
    }}</n-button>
    <n-popconfirm @positive-click="update">
      <template #trigger>
        <n-button
          :disabled="isDelOrSaveBtnDisabled"
          type="primary"
          :loading="updateMutation.isPending.value"
          >{{ $t('common.action.save') }}</n-button
        >
      </template>
      {{ $t('common.message.saveConfirm') }}
    </n-popconfirm>
    <n-popconfirm @positive-click="deleteFn">
      <template #trigger>
        <n-button
          :disabled="isDelOrSaveBtnDisabled"
          type="error"
          :loading="deleteMutation.isPending.value"
          >{{ $t('common.action.delete') }}</n-button
        >
      </template>
      {{ $t('common.message.deleteConfirm') }}
    </n-popconfirm>
  </n-space>
  <n-data-table
    :bordered="false"
    :single-line="false"
    :columns="columns"
    :data="invitationListQuery.data.value"
    :loading="invitationListQuery.isLoading.value"
    @update:checked-row-keys="handleCheck"
    :row-key="(row) => row.id"
    :checked-row-keys="selectedKeys"
  />
</template>
