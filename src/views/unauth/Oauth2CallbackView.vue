<script setup lang="ts">
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ref } from 'vue'
import { getFrontendOrigin } from '@/app/infrastructure/request/get-frontend-url'

const route = useRoute()
const token: string | undefined = route.query.token?.toString()
const refreshToken: string | undefined = route.query.refreshToken?.toString()
const requireTwoFactor: string | undefined = route.query.requireTwoFactor?.toString()
const twoFactorToken: string | undefined = route.query.twoFactorToken?.toString()
const error: string | undefined = route.query.error?.toString()
const { t: $t } = useI18n()
const title = ref<string>($t('auth.oauth.callback'))

if (requireTwoFactor === 'true' && twoFactorToken) {
  // 第三方登录需要 2FA 验证，将 twoFactorToken 传回主窗口
  window.opener.postMessage(
    {
      requireTwoFactor: true,
      twoFactorToken,
      url: route.fullPath,
    },
    getFrontendOrigin(),
  )
} else if (token) {
  window.opener.postMessage(
    {
      token,
      refreshToken,
      url: route.fullPath,
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
