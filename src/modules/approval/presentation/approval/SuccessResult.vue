<script setup lang="ts">
import { $t } from '@/_utils/i18n'
import { NResult, NButton } from 'naive-ui'
import { useRouter } from 'vue-router'
const router = useRouter()
const handleReturn = () => {
  router.go(-1)
}
</script>
<template>
  <n-result
    status="success"
    :title="$t('common.status.success')"
    :description="$t('approval.messages.approveSuccess')"
  >
    <template #footer>
      <n-button @click="handleReturn">{{ $t('common.action.back') }}</n-button>
    </template>
  </n-result>
</template>
