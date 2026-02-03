<script setup lang="ts">
import { NResult, NButton } from 'naive-ui'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
const router = useRouter()
const { t: $t } = useI18n()
const handleReturn = () => {
  router.go(-1)
}
</script>
<template>
  <n-result
    status="success"
    :title="$t('common.status.success')"
    :description="$t('domain.approval.message.approveSuccess')"
  >
    <template #footer>
      <n-button @click="handleReturn">{{ $t('common.action.back') }}</n-button>
    </template>
  </n-result>
</template>
