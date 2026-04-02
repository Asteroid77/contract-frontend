<script setup lang="ts">
import { useUserPage } from '@/modules/user/application/hooks/useUserPage'
import {
  useAssignedUsersByRole,
  useAssignRoleToUsers,
} from '@/modules/access/application/hooks/useUserRoleService'
import { NTransfer, NCard, NSpace, NButton, NPopconfirm } from 'naive-ui'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { resolveUserDisplayName } from '@/modules/user/application/utils/displayName'
const { t: $t } = useI18n()
const props = defineProps<{
  roleId: number
}>()
// Get all users who have completed additional info
const userPageQuery = useUserPage({
  page: 1,
  size: -1,
  query: {
    name: {
      condition: 'isNotNull',
    },
  },
})
// Get all users who have been assigned this role
const assignedUsersHook = useAssignedUsersByRole(props.roleId)

// options
const options = computed(() => {
  return (
    userPageQuery.data.value?.records.map((item) => {
      return {
        label: resolveUserDisplayName(item),
        value: item.id,
      }
    }) ?? []
  )
})
// Build a transfer showing the users, with the ability to assign a role by checking a selection.
const selectedUserIds = ref<number[]>([])
watch(assignedUsersHook.data, (value) => {
  if (value) {
    selectedUserIds.value = value.map((item) => item.id)
  }
})
const assign = useAssignRoleToUsers()
const submit = () => {
  assign.mutate({ roleId: props.roleId, userIds: selectedUserIds.value })
}
</script>
<template>
  <n-card :title="$t('system.role.action.assign')">
    <n-transfer v-model:value="selectedUserIds" :options="options" :virtual-scroll="true" />
    <template #action>
      <n-space justify="end">
        <n-popconfirm @positive-click="submit">
          <template #trigger>
            <n-button> {{ $t('common.action.submit') }}</n-button>
          </template>
          {{}}
        </n-popconfirm>
      </n-space>
    </template>
  </n-card>
</template>
