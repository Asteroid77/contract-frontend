<script setup lang="ts">
import { useRoute } from 'vue-router'
import { $t } from '@/_utils/i18n/'
import { ref } from 'vue'
const token: string | undefined = useRoute().query.token?.toString()
const error: string | undefined = useRoute().query.error?.toString()
const title = ref<string>($t('account.login.oauth2.callback.title'))
if (token) {
  const host = window.location.hostname
  window.opener.postMessage(
    {
      token,
      url: useRoute().fullPath,
    },
    `https://${host}:${import.meta.env.VITE_CLIENT_PORT}/unauth/login`,
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
