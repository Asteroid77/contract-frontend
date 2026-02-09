<script setup lang="ts">
import { computed, ref } from 'vue'
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

const { t: $t } = useI18n()
const { currentTheme, setTheme } = useTheme()
const router = useRouter()
const accountStore = useAccountStore()
const changePasswordMutation = useChangePassword()

const pushNotificationsEnabled = ref(false)
const changePasswordFormRef = ref<FormInst | null>(null)
const changePasswordFormValue = ref({
  oldPassword: '',
  newPassword: '',
  confirmNewPassword: '',
})

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

const handleSetup2FA = () => {
  message.info($t('layout.profile.twoFactor.todo'))
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
          <div class="w-full" style="max-width: 560px">
            <n-form
              ref="changePasswordFormRef"
              :model="changePasswordFormValue"
              :rules="changePasswordRules"
              label-placement="top"
              class="w-full"
            >
              <n-form-item path="oldPassword" :label="$t('auth.field.oldPassword')">
                <n-input
                  v-model:value="changePasswordFormValue.oldPassword"
                  type="password"
                  show-password-on="click"
                  :placeholder="$t('common.placeholder.input', { label: $t('auth.field.oldPassword') })"
                />
              </n-form-item>

              <n-form-item path="newPassword" :label="$t('auth.field.newPassword')">
                <n-input
                  v-model:value="changePasswordFormValue.newPassword"
                  type="password"
                  show-password-on="click"
                  :placeholder="$t('common.placeholder.input', { label: $t('auth.field.newPassword') })"
                />
              </n-form-item>

              <n-form-item path="confirmNewPassword" :label="$t('auth.field.confirmNewPassword')">
                <n-input
                  v-model:value="changePasswordFormValue.confirmNewPassword"
                  type="password"
                  show-password-on="click"
                  :placeholder="$t('common.placeholder.input', { label: $t('auth.field.confirmNewPassword') })"
                  @keyup.enter="submitChangePassword"
                />
              </n-form-item>

              <n-flex justify="end" :size="8">
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

        <div class="flex items-center justify-between gap-4">
          <div>
            <div class="text-base font-medium text-[var(--color-text-main)]">
              {{ $t('layout.profile.twoFactor.title') }}
            </div>
            <div class="text-sm text-[var(--color-text-light)] mt-1">
              {{ $t('layout.profile.twoFactor.description') }}
            </div>
          </div>
          <n-button secondary @click="handleSetup2FA">
            {{ $t('layout.profile.twoFactor.action') }}
          </n-button>
        </div>
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
