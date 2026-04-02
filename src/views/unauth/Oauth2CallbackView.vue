<script setup lang="ts">
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ref } from 'vue'
import { getFrontendOrigin } from '@/app/infrastructure/request/get-frontend-url'

const route = useRoute()
const authCode: string | undefined = route.query.authCode?.toString()
const error: string | undefined = route.query.error?.toString()
const { t: $t } = useI18n()
const title = ref<string>($t('auth.oauth.callback'))

const canPostToOpener = Boolean(window.opener && typeof window.opener.postMessage === 'function')
const callbackPath = route.path || route.fullPath.split('?')[0] || '/oauth2/callback'

if (error) {
  title.value = error

  if (canPostToOpener) {
    window.opener!.postMessage(
      {
        error,
        url: callbackPath,
      },
      // postMessage 目标应使用 origin，避免路径变更（/login vs /unauth/login）导致消息被丢弃
      getFrontendOrigin(),
    )
  }
} else if (authCode && canPostToOpener) {
  window.opener!.postMessage(
    {
      authCode,
    },
    getFrontendOrigin(),
  )
}
</script>

<template>
  <div>{{ title }}</div>
</template>
