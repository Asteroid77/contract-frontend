<script setup lang="ts">
import { NResult, NButton } from 'naive-ui'
import { useRouter } from 'vue-router'

const router = useRouter()

const goBack = () => {
  router.back()
}

const goHome = () => {
  router.push({ name: 'dashboard' })
}
</script>

<template>
  <div class="flex items-center justify-center h-full">
    <n-result
      status="403"
      title="403 无权限"
      description="抱歉，您没有权限访问此页面"
    >
      <template #footer>
        <n-button @click="goBack">返回上一页</n-button>
        <n-button type="primary" @click="goHome" class="ml-2">
          返回首页
        </n-button>
      </template>
    </n-result>
  </div>
</template>
