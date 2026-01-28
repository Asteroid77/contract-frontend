<script setup lang="ts">
import { $t } from '@/_utils/i18n'
import { useUserPage } from '@/hooks/account/useUserPage'
import { useAssignedUsersByRole, useAssignRoleToUsers } from '@/hooks/account/useUserRoleService'
import { NTransfer, NCard, NSpace, NButton, NPopconfirm } from 'naive-ui'
import { computed, watch } from 'vue'
import { ref } from 'vue'
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
  return userPageQuery.data.value?.records.map((item) => {
    return {
      label: `${item.name}#${item.discriminator}`,
      value: item.id,
    }
  })
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
  <n-card :title="$t('userRole.assign')">
    <n-transfer v-model:value="selectedUserIds" :options="options" :virtual-scroll="true" />
    <template #action>
      <n-space justify="end">
        <n-popconfirm @positive-click="submit">
          <template #trigger>
            <n-button> {{ $t('actions.submit') }}</n-button>
          </template>
          {{}}
        </n-popconfirm>
      </n-space>
    </template>
  </n-card>
</template>
