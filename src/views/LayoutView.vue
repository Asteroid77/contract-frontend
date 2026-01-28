<script setup lang="ts">
import clsx from 'clsx'
</script>
<template>
  <router-view
    :class="clsx('px-[var(--layout-padding-x-desktop)]')"
  ></router-view>
</template>
