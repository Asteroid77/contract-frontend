<script setup lang="ts">
import { NResult, NButton } from 'naive-ui'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

const { t: $t } = useI18n()
const router = useRouter()

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
      status="404"
      :title="$t('common.error.404')"
      :description="$t('common.error.404Desc')"
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
