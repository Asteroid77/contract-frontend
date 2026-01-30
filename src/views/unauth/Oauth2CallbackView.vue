<script setup lang="ts">
import { useRoute } from 'vue-router'
import { $t } from '@/_utils/i18n/'
import { ref } from 'vue'
import { getFrontendLoginUrl } from '@/app/infrastructure/request/get-frontend-url'

const token: string | undefined = useRoute().query.token?.toString()
const error: string | undefined = useRoute().query.error?.toString()
const title = ref<string>($t('auth.oauth.callback'))
if (token) {
  window.opener.postMessage(
    {
      token,
      url: useRoute().fullPath,
    },
    // 指定接收消息的窗口必须位于登录页 URL（实际上通常只需要匹配 Origin，但保持原有逻辑更安全）
    getFrontendLoginUrl(),
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
