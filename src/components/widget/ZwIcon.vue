<script setup lang="ts">
import { NIcon } from 'naive-ui'
const props = defineProps<{
  name: string
  size?: number
}>()
</script>
<template>
  <n-icon :size="props.size !== undefined ? props.size : 22">
    <svg class="zw-icon" aria-hidden="true">
      <use :xlink:href="`#${props.name}`"></use>
    </svg>
  </n-icon>
</template>
