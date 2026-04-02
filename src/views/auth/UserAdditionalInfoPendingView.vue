<script setup lang="ts">
import { computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { NButton, NCard, NFlex, NResult, NSkeleton } from 'naive-ui'
import { useLatestAdditionalInfoInstanceStatus } from '@/modules/approval/application/hooks/useApprovalService'

const { t: $t } = useI18n()
const router = useRouter()
const route = useRoute()

const latestStatusQuery = useLatestAdditionalInfoInstanceStatus({
  staleTime: 0,
  gcTime: 0,
  refetchOnWindowFocus: false,
  refetchOnMount: 'always',
})

const approvalInstanceId = computed<number | null>(() => {
  const routeInstanceId = Number(route.query.instanceId)

  if (Number.isFinite(routeInstanceId) && routeInstanceId > 0) {
    return routeInstanceId
  }

  const latestInstanceId = latestStatusQuery.data.value?.id

  if (typeof latestInstanceId === 'number' && latestInstanceId > 0) {
    return latestInstanceId
  }

  return null
})

watch(
  () => latestStatusQuery.data.value?.status,
  (status) => {
    if (!status) {
      return
    }

    if (['approved', 'rejected', 'canceled'].includes(status)) {
      router.replace({ name: 'user-profile' })
    }
  },
  { immediate: true },
)

const handleBack = () => {
  router.replace({ name: 'user-profile' })
}

const handleViewApproval = () => {
  if (!approvalInstanceId.value) {
    return
  }

  router.push({
    name: 'approval-instance-detail',
    query: {
      template: '用户信息审批',
      instanceId: approvalInstanceId.value,
    },
  })
}

const handleRetry = () => {
  latestStatusQuery.refetch()
}
</script>

<template>
  <n-flex vertical :size="16" class="max-w-4xl">
    <div class="text-2xl font-bold text-[var(--color-text-main)]">
      {{ $t('layout.profile.title') }}
    </div>

    <n-card class="notion-card" :bordered="false">
      <n-flex vertical :size="16">
        <n-flex vertical v-if="latestStatusQuery.isLoading.value">
          <n-skeleton :repeat="6" height="30px" width="70%" />
        </n-flex>

        <n-result
          v-else-if="latestStatusQuery.isError.value"
          status="error"
          :title="$t('common.error.title')"
          :description="$t('common.error.server')"
        >
          <template #footer>
            <n-flex :size="8" justify="center">
              <n-button secondary @click="handleBack">{{ $t('common.action.back') }}</n-button>
              <n-button type="primary" @click="handleRetry">{{
                $t('observability.errorBoundary.retry')
              }}</n-button>
            </n-flex>
          </template>
        </n-result>

        <n-result
          v-else
          status="info"
          :title="$t('domain.user.approval.title')"
          :description="$t('domain.user.approval.content')"
        >
          <template #footer>
            <n-flex :size="8" justify="center">
              <n-button secondary @click="handleBack">{{ $t('common.action.back') }}</n-button>
              <n-button type="primary" :disabled="!approvalInstanceId" @click="handleViewApproval">
                {{ $t('domain.user.approval.btn') }}
              </n-button>
            </n-flex>
          </template>
        </n-result>
      </n-flex>
    </n-card>
  </n-flex>
</template>
