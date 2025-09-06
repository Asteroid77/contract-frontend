<script setup lang="ts">
import clsx from 'clsx'
import BreadCrumb from './BreadCrumb.vue'
import AuthHeaderAvatar from './AuthHeaderAvatar.vue'
import AuthHeaderLogo from './AuthHeaderLogo.vue'
</script>
<template>
  <div
    :class="
      clsx('zw-header', 'w-full', 'h-14', 'p-text', 'flex', 'align-middle', 'gap-4', 'min-w-sm')
    "
  >
    <AuthHeaderLogo></AuthHeaderLogo>
    <div :class="clsx('zw-header--breadcrumb', 'grow','max-sm:justify-center', 'align-middle', 'flex')">
      <BreadCrumb></BreadCrumb>
    </div>
    <AuthHeaderAvatar></AuthHeaderAvatar>
  </div>
</template>
