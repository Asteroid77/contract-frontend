<script setup lang="ts">
import { computed, h, ref } from 'vue'
import {
  NFlex,
  NButton,
  NCard,
  NDivider,
  NSelect,
  NSwitch,
  NForm,
  NFormItem,
  NInput,
  NDataTable,
  NTag,
  type DataTableColumns,
  type DataTableRowKey,
  type FormInst,
  type FormRules,
} from 'naive-ui'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { message, dialog } from '@/_utils/discrete_naive_api'
import { useTheme, type Theme } from '@/app/presentation/theme/hooks/useTheme'
import { language, setLanguage, type AppLocale } from '@/_utils/i18n'
import { useChangePassword } from '@/modules/user/application/hooks/useChangePassword'
import { useAccountStore } from '@/modules/user/application/stores/useAccountStore'
import { requireRule } from '@/modules/shared/application/rules/RequireRule'
import {
  useCurrentUserDevicesQuery,
  useRevokeCurrentUserDevicesMutation,
} from '@/modules/user/application/hooks/useUserDevices'
import type { UserDeviceSession } from '@/modules/user/application/models'
import { formatted } from '@/modules/shared/presentation/time'
import TotpSettingsSection from './components/TotpSettingsSection.vue'
import { useIsMobile } from '@/app/presentation/hooks/useIsMobile'

const { t: $t } = useI18n()
const { currentTheme, setTheme } = useTheme()
const router = useRouter()
const accountStore = useAccountStore()
const changePasswordMutation = useChangePassword()
const userDevicesQuery = useCurrentUserDevicesQuery()
const revokeDevicesMutation = useRevokeCurrentUserDevicesMutation()

const pushNotificationsEnabled = ref(false)
const changePasswordFormRef = ref<FormInst | null>(null)
const changePasswordFormValue = ref({
  oldPassword: '',
  newPassword: '',
  confirmNewPassword: '',
})
const selectedDeviceIds = ref<string[]>([])

const changePasswordRules = computed<FormRules>(() => ({
  oldPassword: [
    {
      required: true,
      validator: (rule, value: string) => requireRule(rule, $t('auth.field.oldPassword'), value),
      trigger: ['blur'],
    },
  ],
  newPassword: [
    {
      required: true,
      validator: (rule, value: string) => requireRule(rule, $t('auth.field.newPassword'), value),
      trigger: ['blur'],
    },
    {
      validator: (_rule, value: string) => {
        if (!value) {
          return true
        }
        if (value.length < 8) {
          return new Error($t('auth.validation.passwordMin'))
        }
        if (value.length > 16) {
          return new Error($t('auth.validation.passwordMax'))
        }
        return true
      },
      trigger: ['blur'],
    },
  ],
  confirmNewPassword: [
    {
      required: true,
      validator: (rule, value: string) =>
        requireRule(rule, $t('auth.field.confirmNewPassword'), value),
      trigger: ['blur'],
    },
    {
      validator: (_rule, value: string) => {
        if (!value) {
          return true
        }
        if (value !== changePasswordFormValue.value.newPassword) {
          return new Error($t('auth.validation.passwordMismatch'))
        }
        return true
      },
      trigger: ['blur'],
    },
  ],
}))

const themeOptions = computed(() => [
  { label: $t('layout.theme.light'), value: 'light' },
  { label: $t('layout.theme.dark'), value: 'dark' },
  { label: $t('layout.theme.sakura'), value: 'sakura' },
])

const localeOptions = [
  { label: '简体中文', value: 'zh-CN' },
  { label: 'English', value: 'en' },
]

const currentLocale = computed(() => language.value)
const isMobile = useIsMobile(768)

const renderCurrentDevice = (row: UserDeviceSession) =>
  row.currentDevice
    ? h(
        NTag,
        {
          type: 'success',
          bordered: false,
        },
        { default: () => $t('layout.profile.security.devices.currentDevice') },
      )
    : '-'

const deviceColumns = computed<DataTableColumns<UserDeviceSession>>(() => {
  const unknown = $t('common.label.unknown')

  if (isMobile.value) {
    return [
      {
        type: 'selection',
      },
      {
        title: $t('layout.profile.security.devices.field.deviceId'),
        key: 'deviceId',
        render: (row) => {
          const lastActiveAt = formatted(row.lastActiveAt).standard || unknown

          return h('div', { class: 'settings-device-session-cell min-w-0' }, [
            h(
              'div',
              { class: 'text-sm font-medium text-[var(--color-text-main)] truncate' },
              row.deviceId || unknown,
            ),
            h(
              'div',
              { class: 'text-xs text-[var(--color-text-light)] truncate mt-1' },
              `${$t('layout.profile.security.devices.field.clientIp')}: ${row.clientIp || unknown}`,
            ),
            h(
              'div',
              { class: 'text-xs text-[var(--color-text-light)] truncate mt-1' },
              row.userAgent || unknown,
            ),
            h(
              'div',
              { class: 'text-xs text-[var(--color-text-light)] truncate mt-1' },
              `${$t('layout.profile.security.devices.field.lastActiveAt')}: ${lastActiveAt}`,
            ),
          ])
        },
      },
      {
        title: $t('layout.profile.security.devices.field.currentDevice'),
        key: 'currentDevice',
        render: (row) => renderCurrentDevice(row),
      },
    ]
  }

  return [
    {
      type: 'selection',
    },
    {
      title: $t('layout.profile.security.devices.field.deviceId'),
      key: 'deviceId',
    },
    {
      title: $t('layout.profile.security.devices.field.clientIp'),
      key: 'clientIp',
      render: (row) => row.clientIp || unknown,
    },
    {
      title: $t('layout.profile.security.devices.field.userAgent'),
      key: 'userAgent',
      render: (row) => row.userAgent || unknown,
    },
    {
      title: $t('layout.profile.security.devices.field.lastActiveAt'),
      key: 'lastActiveAt',
      render: (row) => formatted(row.lastActiveAt).standard,
    },
    {
      title: $t('layout.profile.security.devices.field.currentDevice'),
      key: 'currentDevice',
      render: (row) => renderCurrentDevice(row),
    },
  ]
})

const hasSelectedDevices = computed(() => selectedDeviceIds.value.length > 0)

const handleThemeChange = (value: Theme) => {
  setTheme(value)
}

const handleLanguageChange = (value: AppLocale) => {
  setLanguage(value)
}

const resetChangePasswordForm = () => {
  changePasswordFormValue.value = {
    oldPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  }
  changePasswordFormRef.value?.restoreValidation?.()
}

const submitChangePassword = async () => {
  await changePasswordFormRef.value?.validate()

  try {
    const changed = await changePasswordMutation.mutateAsync({
      oldPassword: changePasswordFormValue.value.oldPassword,
      newPassword: changePasswordFormValue.value.newPassword,
    })

    if (!changed) {
      message.error($t('common.status.error'))
      return
    }

    resetChangePasswordForm()
    message.success($t('layout.profile.security.changePassword.success'))
    accountStore.logout()
    router.replace({ name: 'login' })
  } catch {
    // 全局错误处理已处理提示
  }
}

const handleDeleteAccount = () => {
  dialog.warning({
    title: $t('layout.profile.danger.confirmTitle'),
    content: $t('layout.profile.danger.confirmContent'),
    positiveText: $t('layout.profile.danger.action'),
    negativeText: $t('common.action.cancel'),
    onPositiveClick: () => {
      message.warning($t('layout.profile.danger.todo'))
    },
  })
}

const handleDeviceCheck = (rowKeys: DataTableRowKey[]) => {
  selectedDeviceIds.value = rowKeys as string[]
}

const handleRefreshDevices = () => {
  userDevicesQuery.refetch()
}

const handleRevokeSelectedDevices = async () => {
  if (!selectedDeviceIds.value.length) {
    message.warning($t('common.validation.selectAtLeast'))
    return
  }

  const selectedCount = selectedDeviceIds.value.length

  dialog.warning({
    title: $t('layout.profile.security.devices.revokeConfirmTitle'),
    content: $t('layout.profile.security.devices.revokeConfirmContent', { count: selectedCount }),
    positiveText: $t('layout.profile.security.devices.revokeAction'),
    negativeText: $t('common.action.cancel'),
    async onPositiveClick() {
      const result = await revokeDevicesMutation.mutateAsync({
        deviceIds: [...selectedDeviceIds.value],
        allowCurrentDevice: false,
      })

      selectedDeviceIds.value = []

      if (result.revokedCount > 0) {
        message.success(
          $t('layout.profile.security.devices.revokeSuccess', { count: result.revokedCount }),
        )
      }

      if (result.skippedCurrentDeviceCount > 0) {
        message.warning(
          $t('layout.profile.security.devices.revokeSkippedCurrentDevice', {
            count: result.skippedCurrentDeviceCount,
          }),
        )
      }
    },
  })
}
</script>

<template>
  <n-flex vertical :size="16" class="max-w-4xl">
    <div class="text-2xl font-bold text-[var(--color-text-main)]">
      {{ $t('layout.profile.settings') }}
    </div>

    <n-card class="notion-card" :bordered="false">
      <n-flex vertical :size="16">
        <div class="text-lg font-semibold text-[var(--color-text-main)]">
          {{ $t('layout.profile.appearance.title') }}
        </div>

        <div class="flex items-center justify-between gap-4">
          <div>
            <div class="text-base font-medium text-[var(--color-text-main)]">
              {{ $t('layout.profile.appearance.themeTitle') }}
            </div>
            <div class="text-sm text-[var(--color-text-light)] mt-1">
              {{ $t('layout.profile.appearance.themeDescription') }}
            </div>
          </div>
          <n-select
            :value="currentTheme"
            :options="themeOptions"
            style="width: 180px"
            @update:value="handleThemeChange"
          />
        </div>

        <n-divider class="!my-0" />

        <div class="flex items-center justify-between gap-4">
          <div>
            <div class="text-base font-medium text-[var(--color-text-main)]">
              {{ $t('layout.profile.appearance.languageTitle') }}
            </div>
            <div class="text-sm text-[var(--color-text-light)] mt-1">
              {{ $t('layout.profile.appearance.languageDescription') }}
            </div>
          </div>
          <n-select
            :value="currentLocale"
            :options="localeOptions"
            style="width: 180px"
            @update:value="handleLanguageChange"
          />
        </div>
      </n-flex>
    </n-card>

    <n-card class="notion-card" :bordered="false">
      <n-flex vertical :size="16">
        <div class="text-lg font-semibold text-[var(--color-text-main)]">
          {{ $t('layout.profile.notifications.title') }}
        </div>

        <div class="flex items-center justify-between gap-4">
          <div>
            <div class="text-base font-medium text-[var(--color-text-main)]">
              {{ $t('layout.profile.notifications.push.title') }}
            </div>
            <div class="text-sm text-[var(--color-text-light)] mt-1">
              {{ $t('layout.profile.notifications.push.description') }}
            </div>
          </div>
          <n-switch v-model:value="pushNotificationsEnabled" />
        </div>
      </n-flex>
    </n-card>

    <n-card class="notion-card" :bordered="false">
      <n-flex vertical :size="16">
        <div>
          <div class="text-lg font-semibold text-[var(--color-text-main)]">
            {{ $t('layout.profile.security.title') }}
          </div>
          <div class="text-sm text-[var(--color-text-light)] mt-1">
            {{ $t('layout.profile.security.description') }}
          </div>
        </div>

        <div>
          <div class="text-base font-medium text-[var(--color-text-main)]">
            {{ $t('layout.profile.security.changePassword.title') }}
          </div>
          <div class="text-sm text-[var(--color-text-light)] mt-1">
            {{ $t('layout.profile.security.changePassword.description') }}
          </div>
        </div>

        <div class="w-full">
          <div class="settings-password-form-shell">
            <n-form
              ref="changePasswordFormRef"
              :model="changePasswordFormValue"
              :rules="changePasswordRules"
              class="w-full settings-password-form-grid"
            >
              <n-form-item path="oldPassword" :label="$t('auth.field.oldPassword')">
                <n-input
                  v-model:value="changePasswordFormValue.oldPassword"
                  type="password"
                  show-password-on="click"
                  :placeholder="
                    $t('common.placeholder.input', { label: $t('auth.field.oldPassword') })
                  "
                />
              </n-form-item>

              <n-form-item path="newPassword" :label="$t('auth.field.newPassword')">
                <n-input
                  v-model:value="changePasswordFormValue.newPassword"
                  type="password"
                  show-password-on="click"
                  :placeholder="
                    $t('common.placeholder.input', { label: $t('auth.field.newPassword') })
                  "
                />
              </n-form-item>

              <n-form-item path="confirmNewPassword" :label="$t('auth.field.confirmNewPassword')">
                <n-input
                  v-model:value="changePasswordFormValue.confirmNewPassword"
                  type="password"
                  show-password-on="click"
                  :placeholder="
                    $t('common.placeholder.input', { label: $t('auth.field.confirmNewPassword') })
                  "
                  @keyup.enter="submitChangePassword"
                />
              </n-form-item>

              <n-flex class="settings-password-form-actions" justify="end" :size="8">
                <n-button
                  :disabled="changePasswordMutation.isPending.value"
                  @click="resetChangePasswordForm"
                >
                  {{ $t('common.action.reset') }}
                </n-button>
                <n-button
                  type="primary"
                  :loading="changePasswordMutation.isPending.value"
                  @click="submitChangePassword"
                >
                  {{ $t('layout.profile.security.changePassword.action') }}
                </n-button>
              </n-flex>
            </n-form>
          </div>
        </div>

        <n-divider class="!my-0" />

        <div>
          <div class="text-base font-medium text-[var(--color-text-main)]">
            {{ $t('layout.profile.security.devices.title') }}
          </div>
          <div class="text-sm text-[var(--color-text-light)] mt-1">
            {{ $t('layout.profile.security.devices.description') }}
          </div>
        </div>

        <div class="w-full">
          <n-flex class="mb-3" justify="space-between" align="center" :size="8">
            <div class="text-sm text-[var(--color-text-light)]">
              {{
                $t('layout.profile.security.devices.selectedCount', {
                  count: selectedDeviceIds.length,
                })
              }}
            </div>
            <n-flex :size="8">
              <n-button
                secondary
                :loading="userDevicesQuery.isFetching.value"
                @click="handleRefreshDevices"
              >
                {{ $t('layout.profile.security.devices.refreshAction') }}
              </n-button>
              <n-button
                type="error"
                secondary
                :disabled="!hasSelectedDevices || revokeDevicesMutation.isPending.value"
                :loading="revokeDevicesMutation.isPending.value"
                @click="handleRevokeSelectedDevices"
              >
                {{ $t('layout.profile.security.devices.revokeAction') }}
              </n-button>
            </n-flex>
          </n-flex>

          <n-data-table
            :bordered="false"
            :single-line="false"
            :columns="deviceColumns"
            :data="userDevicesQuery.data.value || []"
            :loading="userDevicesQuery.isLoading.value"
            :checked-row-keys="selectedDeviceIds"
            :row-key="(row) => row.deviceId"
            @update:checked-row-keys="handleDeviceCheck"
          />
        </div>

        <n-divider class="!my-0" />

        <TotpSettingsSection />
      </n-flex>
    </n-card>

    <n-card class="notion-card" :bordered="false">
      <n-flex vertical :size="12">
        <div class="text-lg font-semibold text-red-600">
          {{ $t('layout.profile.danger.title') }}
        </div>
        <div class="flex items-center justify-between gap-4">
          <div class="text-sm text-[var(--color-text-light)]">
            {{ $t('layout.profile.danger.description') }}
          </div>
          <n-button type="error" ghost @click="handleDeleteAccount">
            {{ $t('layout.profile.danger.action') }}
          </n-button>
        </div>
      </n-flex>
    </n-card>
  </n-flex>
</template>

<style scoped>
.settings-device-session-cell {
  min-width: 16rem;
}

.settings-password-form-shell {
  width: 100%;
  max-inline-size: 35rem;
}

.settings-password-form-grid {
  container-name: settings-password-form-grid;
  container-type: inline-size;
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  column-gap: var(--spacing-16);
  row-gap: var(--spacing-16);
}

.settings-password-form-grid :deep(.n-form-item) {
  grid-column: 1 / -1;
  display: grid;
  grid-template-columns: subgrid;
  column-gap: var(--spacing-16);
  margin-bottom: 0;
}

.settings-password-form-grid :deep(.n-form-item .n-form-item-label) {
  grid-column: span 4;
  margin-bottom: 0;
}

.settings-password-form-grid :deep(.n-form-item .n-form-item-blank) {
  grid-column: span 8;
  min-width: 0;
}

.settings-password-form-actions {
  grid-column: 5 / span 8;
  min-width: 0;
}

@container settings-password-form-grid (max-width: 48rem) {
  .settings-password-form-grid :deep(.n-form-item .n-form-item-label),
  .settings-password-form-grid :deep(.n-form-item .n-form-item-blank) {
    grid-column: 1 / -1;
  }

  .settings-password-form-actions {
    grid-column: 1 / -1;
  }
}
</style>
