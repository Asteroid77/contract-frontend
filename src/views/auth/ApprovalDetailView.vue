<script setup lang="ts">
import type { ApprovalProcessName } from '@/modules/approval/application/models'
import ApprovalTemplate from '@/modules/approval/presentation/approval/ApprovalTemplate'
import { computed, type Ref } from 'vue'
import { useRoute } from 'vue-router'
import { NResult, NButton } from 'naive-ui'
import { $t } from '@/_utils/i18n'
const route = useRoute()
const instanceId: Ref<number | null> = computed(() => {
  const id = route.query.instanceId
  let parsedId = NaN
  if (id && !(id instanceof Array)) {
    parsedId = parseInt(id, 10)
  }
  if (isNaN(parsedId)) {
    return null
  }

  return parsedId
})
const template = route.query.template as ApprovalProcessName[keyof ApprovalProcessName]
</script>
<template>
  <n-result
    v-if="!instanceId || !template"
    status="418"
    :title="$t('common.error.pageLoad')"
    :description="$t('common.error.pageLoadMeta')"
  >
    <template #footer>
      <n-button>{{ $t('common.action.back') }}</n-button>
    </template>
  </n-result>
  <ApprovalTemplate v-else :instanceId="instanceId" :template="template"></ApprovalTemplate>
</template>
