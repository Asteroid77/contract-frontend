<script setup lang="ts">
import { NResult, NButton } from 'naive-ui'
import { useRouter } from 'vue-router'

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
      title="500 服务器错误"
      description="抱歉，服务器出现了一些问题"
    >
      <template #footer>
        <n-button @click="reload">刷新页面</n-button>
        <n-button type="primary" @click="goHome" class="ml-2">
          返回首页
        </n-button>
      </template>
    </n-result>
  </div>
</template>
