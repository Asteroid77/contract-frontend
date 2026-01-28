<script setup lang="ts">
import type { ApprovalProcessName } from '@/components/approval/api/approval'
import ApprovalTemplate from '@/components/approval/ApprovalTemplate'
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
    :title="$t('common.pageLoadError')"
    :description="$t('common.pageLoadErrorMeta')"
  >
    <template #footer>
      <n-button>{{ $t('actions.return') }}</n-button>
    </template>
  </n-result>
  <ApprovalTemplate v-else :instanceId="instanceId" :template="template"></ApprovalTemplate>
</template>
