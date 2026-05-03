<script setup lang="ts">
import UserAdditionalInfoUiForm from '@/modules/user/presentation/user_additional_info/UserAdditionalInfoForm'
import { computed } from 'vue'
import {
  NFlex,
  NButton,
  NSkeleton,
  NCard,
  NGrid,
  NGridItem,
  NAvatar,
  NStatistic,
  NResult,
} from 'naive-ui'
import { useI18n } from 'vue-i18n'
import { Camera, LogOut } from 'lucide-vue-next'
import type { UserAdditionalInfoForm } from '@/modules/user/application/models'
import { useLatestAdditionalInfoInstanceStatus } from '@/modules/approval/application/hooks/useApprovalService'
import { useRouter } from 'vue-router'
import { useAccountStore } from '@/modules/user/application/stores/useAccountStore'
import { useLoadUserInfo } from '@/modules/user/application/hooks/useLoadUserInfo'
import { message } from '@/_utils/discrete_naive_api'
import { resolvePlatformLabelKey } from '@/modules/user/application/utils/platform'
import { resolveUserDisplayName } from '@/modules/user/application/utils/displayName'
import { useServiceAgreementPage } from '@/modules/service-agreement/application/hooks/useSignService'
import { ServiceAgreementStatusEnum } from '@/modules/service-agreement/application/constants'
import type { ServiceAgreementPageQuery } from '@/modules/service-agreement/application/models'
import type { BasePageRequest } from '@/modules/shared/application/request/types'
import { useTabsStore } from '@/app/application/stores/useTabsStore'

const { t: $t } = useI18n()

const router = useRouter()
const account = useAccountStore()
const tabsStore = useTabsStore()
const status = useLatestAdditionalInfoInstanceStatus()
const loadUserInfo = useLoadUserInfo(() => account.token)

const filingPageRequest = computed<BasePageRequest<ServiceAgreementPageQuery>>(() => ({
  page: 1,
  size: 1,
  query: {
    status: {
      condition: 'eq',
      value: ServiceAgreementStatusEnum.Record,
    },
  },
}))

const signPageRequest = computed<BasePageRequest<ServiceAgreementPageQuery>>(() => ({
  page: 1,
  size: 1,
  query: {
    status: {
      condition: 'eq',
      value: ServiceAgreementStatusEnum.Sign,
    },
  },
}))

const filingPage = useServiceAgreementPage(filingPageRequest)
const signPage = useServiceAgreementPage(signPageRequest)

const currentUser = computed(() => loadUserInfo.data.value?.user ?? account.user)
const currentProfile = computed(() => loadUserInfo.data.value?.profile ?? account.profile)

const resolvedProfileName = computed(() => resolveUserDisplayName({ name: currentUser.value.name }))
const profileName = computed(() => resolvedProfileName.value || '-')
const phoneNumber = computed(() => currentUser.value.phone || '-')
const platformLabel = computed(() => $t(resolvePlatformLabelKey(currentUser.value.platform)))
const shouldShowPlatform = computed(() => currentUser.value.platform !== 'NATIVE')
const avatarText = computed(() => {
  if (!resolvedProfileName.value) return 'U'
  return resolvedProfileName.value.slice(0, 1)
})
const actionIconSize = 'var(--spacing-16)'
const avatarUploadActionSize = 'var(--spacing-32)'

const signedCount = computed(() => signPage.data.value?.total ?? 0)
const filingCount = computed(() => filingPage.data.value?.total ?? 0)
const profileCompleted = computed(() => !!currentProfile.value)
const profileCompletedText = computed(() =>
  profileCompleted.value
    ? $t('layout.profile.status.completed')
    : $t('layout.profile.status.uncompleted'),
)
const monthlyRevenueText = computed(() => $t('layout.profile.stats.revenuePlaceholder'))

const formInitialValue = computed<FormInput<UserAdditionalInfoForm> | undefined>(() => {
  const profile = currentProfile.value
  return (profile ?? undefined) as FormInput<UserAdditionalInfoForm> | undefined
})

const pageStatus = computed<'loading' | 'visible' | 'approving'>(() => {
  if (!status.data.value || loadUserInfo.isLoading.value) {
    return 'loading'
  }
  if (['rejected', 'approved', 'canceled'].includes(status.data.value.status)) {
    return 'visible'
  }
  return 'approving'
})

const approvalInstanceId = computed(() => {
  const instanceId = status.data.value?.id
  return typeof instanceId === 'number' && instanceId > 0 ? instanceId : null
})

const handleAvatarUpload = () => {
  message.info($t('layout.profile.avatar.uploadTodo'))
}

const handleLogout = () => {
  account.logout()
  tabsStore.clearTabs()
  router.push({ name: 'login' })
}

const handleEdit = () => {
  router.push({ name: 'user-additional-info' })
}

const handleViewApproval = () => {
  const instanceId = approvalInstanceId.value

  if (instanceId) {
    router.push({
      name: 'approval-instance-detail',
      query: {
        template: '用户信息审批',
        instanceId,
      },
    })
    return
  }

  router.push({ name: 'approval-my-approval-instance-page' })
}
</script>

<template>
  <n-flex vertical :size="16">
    <n-flex align="center" justify="space-between" :wrap="false">
      <div class="text-2xl font-bold text-[var(--color-text-main)]">
        {{ $t('layout.profile.title') }}
      </div>
      <n-button type="error" ghost @click="handleLogout">
        <template #icon>
          <LogOut :style="{ width: actionIconSize, height: actionIconSize }" />
        </template>
        {{ $t('auth.action.logout') }}
      </n-button>
    </n-flex>

    <n-grid :cols="24" :x-gap="16" :y-gap="16">
      <n-grid-item :span="24" :md="12">
        <n-card class="notion-card" :bordered="false">
          <n-flex align="center" :size="16">
            <div class="relative shrink-0">
              <n-avatar
                :size="100"
                class="cursor-pointer border-4 border-[var(--color-bg-body)]"
                @click="handleAvatarUpload"
              >
                {{ avatarText }}
              </n-avatar>
              <button
                type="button"
                class="absolute bottom-0 right-0 rounded-full bg-[var(--color-primary)] text-[var(--color-bg-card)] flex items-center justify-center hover:bg-[var(--color-primary-hover)] transition-colors"
                :style="{
                  width: avatarUploadActionSize,
                  minWidth: avatarUploadActionSize,
                  height: avatarUploadActionSize,
                }"
                :title="$t('layout.profile.avatar.upload')"
                @click="handleAvatarUpload"
              >
                <Camera :style="{ width: actionIconSize, height: actionIconSize }" />
              </button>
            </div>

            <n-flex vertical :size="8" class="flex-1 min-w-0">
              <div class="text-lg font-semibold truncate text-[var(--color-text-main)]">
                {{ profileName }}
              </div>

              <n-flex vertical :size="4" class="text-sm text-[var(--color-text-body)]">
                <div>{{ $t('layout.profile.field.username') }}：{{ profileName }}</div>
                <div>{{ $t('layout.profile.field.phone') }}：{{ phoneNumber }}</div>
                <div v-if="shouldShowPlatform">
                  {{ $t('layout.profile.field.platform') }}：{{ platformLabel }}
                </div>
              </n-flex>
            </n-flex>
          </n-flex>
        </n-card>
      </n-grid-item>

      <n-grid-item :span="24" :md="12">
        <n-card
          class="notion-card"
          :title="$t('layout.profile.accountStatistics')"
          :bordered="false"
        >
          <n-grid :cols="2" :x-gap="12" :y-gap="12">
            <n-grid-item>
              <n-statistic :label="$t('layout.profile.stats.signedCount')" :value="signedCount" />
            </n-grid-item>
            <n-grid-item>
              <n-statistic :label="$t('layout.profile.stats.filingCount')" :value="filingCount" />
            </n-grid-item>
            <n-grid-item>
              <n-statistic
                :label="$t('layout.profile.stats.profileCompletion')"
                :value="profileCompletedText"
              />
            </n-grid-item>
            <n-grid-item>
              <n-statistic
                :label="$t('layout.profile.stats.monthlyRevenue')"
                :value="monthlyRevenueText"
              />
            </n-grid-item>
          </n-grid>
        </n-card>
      </n-grid-item>
    </n-grid>

    <n-card class="notion-card" :title="$t('layout.profile.baseInformation')" :bordered="false">
      <template #header-extra>
        <n-button v-if="pageStatus === 'visible'" size="small" secondary @click="handleEdit">
          {{ $t('common.action.edit') }}
        </n-button>
      </template>

      <n-flex vertical :size="12">
        <n-flex vertical v-if="pageStatus === 'loading'">
          <n-skeleton :repeat="8" height="30px" width="80%" />
        </n-flex>

        <n-result
          v-else-if="pageStatus === 'approving'"
          status="info"
          :title="$t('domain.user.approval.title')"
          :description="$t('domain.user.approval.content')"
        >
          <template #footer>
            <n-button type="primary" @click="handleViewApproval">
              {{ $t('domain.user.approval.btn') }}
            </n-button>
          </template>
        </n-result>

        <template v-else>
          <UserAdditionalInfoUiForm :initial-value="formInitialValue" type="detail" />
        </template>
      </n-flex>
    </n-card>
  </n-flex>
</template>
