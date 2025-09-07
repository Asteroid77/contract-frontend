<script lang="ts" setup>
import clsx from 'clsx'
import { ref } from 'vue'
import { NFlex, NAvatar, NBadge } from 'naive-ui'
const badgeMessageCount = ref<number>(1)
</script>
<template>
  <n-flex :class="clsx('zw-header--feature')" align="center">
    <n-badge :value="badgeMessageCount" dot processing>
      <n-avatar :class="clsx('text-background', 'bg-[var(--n-primary-color)]')"> N </n-avatar>
    </n-badge>
  </n-flex>
</template>
