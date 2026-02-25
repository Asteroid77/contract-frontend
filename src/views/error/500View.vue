<script setup lang="ts">
import { NResult, NButton } from 'naive-ui'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

const { t: $t } = useI18n()
const router = useRouter()

const reload = () => {
  window.location.reload()
}

const goHome = () => {
  router.push({ name: 'dashboard' })
}
</script>

<template>
  <div class="flex items-center justify-center h-full">
    <n-result
      status="500"
      :title="`500 ${$t('common.error.unexpected')}`"
      :description="$t('common.error.contactAdmin')"
    >
      <template #footer>
        <n-button @click="reload">{{ $t('observability.errorBoundary.refresh') }}</n-button>
        <n-button type="primary" @click="goHome" class="ml-2">
          {{ $t('common.action.home') }}
        </n-button>
      </template>
    </n-result>
  </div>
</template>
