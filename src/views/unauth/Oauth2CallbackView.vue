<script setup lang="ts">
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ref } from 'vue'
import { getFrontendOrigin } from '@/app/infrastructure/request/get-frontend-url'

const token: string | undefined = useRoute().query.token?.toString()
const error: string | undefined = useRoute().query.error?.toString()
const { t: $t } = useI18n()
const title = ref<string>($t('auth.oauth.callback'))
if (token) {
  window.opener.postMessage(
    {
      token,
      url: useRoute().fullPath,
    },
    // postMessage 目标应使用 origin，避免路径变更（/login vs /unauth/login）导致消息被丢弃
    getFrontendOrigin(),
  )
}
if (error) {
  title.value = error
}
</script>

<template>
  <div>{{ title }}</div>
</template>

<style scoped lang="scss"></style>
