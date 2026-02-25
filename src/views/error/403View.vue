<script setup lang="ts">
import { NResult, NButton } from 'naive-ui'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

const router = useRouter()
const { t: $t } = useI18n()

const goBack = () => {
  router.back()
}

const goHome = () => {
  router.push({ name: 'dashboard' })
}
</script>

<template>
  <div class="flex items-center justify-center h-full">
    <n-result
      status="403"
      :title="$t('common.error.403')"
      :description="$t('common.error.403Desc')"
    >
      <template #footer>
        <n-button @click="goBack">{{ $t('common.action.back') }}</n-button>
        <n-button type="primary" @click="goHome" class="ml-2">
          {{ $t('common.action.home') }}
        </n-button>
      </template>
    </n-result>
  </div>
</template>
