<script setup lang="ts">
import { computed, ref } from 'vue'
import { NFlex, NButton, NCard, NDivider, NSelect, NSwitch } from 'naive-ui'
import { useI18n } from 'vue-i18n'
import { message, dialog } from '@/_utils/discrete_naive_api'
import { useTheme, type Theme } from '@/app/presentation/theme/hooks/useTheme'
import { language, setLanguage, type AppLocale } from '@/_utils/i18n'

const { t: $t } = useI18n()
const { currentTheme, setTheme } = useTheme()

const pushNotificationsEnabled = ref(false)

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

const handleChangePassword = () => {
  message.info($t('layout.profile.security.changePassword.todo'))
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

        <div class="flex items-center justify-between gap-4">
          <div>
            <div class="text-base font-medium text-[var(--color-text-main)]">
              {{ $t('layout.profile.security.changePassword.title') }}
            </div>
            <div class="text-sm text-[var(--color-text-light)] mt-1">
              {{ $t('layout.profile.security.changePassword.description') }}
            </div>
          </div>
          <n-button secondary @click="handleChangePassword">
            {{ $t('layout.profile.security.changePassword.action') }}
          </n-button>
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
