<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  NFlex,
  NButton,
  NTag,
  NModal,
  NSteps,
  NStep,
  NQrCode,
  NInput,
  NForm,
  NFormItem,
  NAlert,
  NSpin,
} from 'naive-ui'
import { useI18n } from 'vue-i18n'
import { message } from '@/_utils/discrete_naive_api'
import {
  useTotpStatusQuery,
  useTotpSetupMutation,
  useTotpEnableMutation,
  useTotpDisableMutation,
  useTotpBackupCodesMutation,
} from '@/modules/user/application/hooks/useTotpManagement'

const { t: $t } = useI18n()
const statusQuery = useTotpStatusQuery()
const setupMutation = useTotpSetupMutation()
const enableMutation = useTotpEnableMutation()
const disableMutation = useTotpDisableMutation()
const backupCodesMutation = useTotpBackupCodesMutation()

const isEnabled = computed(() => statusQuery.data.value?.enabled ?? false)

// --- Setup flow state ---
const showSetupModal = ref(false)
const setupStep = ref(1)
const verifyCode = ref('')
const backupCodes = ref<string[]>([])

// --- Disable flow state ---
const showDisableModal = ref(false)
const disablePassword = ref('')

// --- Regenerate flow state ---
const showRegenerateModal = ref(false)
const regeneratedCodes = ref<string[]>([])

const startSetup = async () => {
  setupStep.value = 1
  verifyCode.value = ''
  backupCodes.value = []

  try {
    const result = await setupMutation.mutateAsync()
    backupCodes.value = result.backupCodes
    showSetupModal.value = true
  } catch {
    // 全局错误处理已处理提示
  }
}

const confirmEnable = async () => {
  if (!verifyCode.value.trim()) return

  try {
    await enableMutation.mutateAsync({ code: verifyCode.value.trim() })
    setupStep.value = 3
  } catch {
    // 全局错误处理已处理提示
  }
}

const closeSetupModal = () => {
  showSetupModal.value = false
  verifyCode.value = ''
}

const confirmDisable = async () => {
  if (!disablePassword.value) return

  try {
    await disableMutation.mutateAsync({ password: disablePassword.value })
    showDisableModal.value = false
    disablePassword.value = ''
  } catch {
    // 全局错误处理已处理提示
  }
}

const openDisableModal = () => {
  disablePassword.value = ''
  showDisableModal.value = true
}

const startRegenerate = async () => {
  regeneratedCodes.value = []
  showRegenerateModal.value = true
}

const confirmRegenerate = async () => {
  try {
    const codes = await backupCodesMutation.mutateAsync()
    regeneratedCodes.value = codes
  } catch {
    // 全局错误处理已处理提示
  }
}

const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
    message.success($t('layout.profile.twoFactor.setup.copied'))
  } catch {
    // fallback ignored
  }
}

const copyBackupCodes = (codes: string[]) => {
  copyToClipboard(codes.join('\n'))
}
</script>

<template>
  <n-spin :show="statusQuery.isLoading.value">
    <n-flex vertical :size="12">
      <div class="flex items-center justify-between gap-4">
        <div>
          <div class="text-base font-medium text-[var(--color-text-main)]">
            {{ $t('layout.profile.twoFactor.title') }}
          </div>
          <div class="text-sm text-[var(--color-text-light)] mt-1">
            {{ $t('layout.profile.twoFactor.description') }}
          </div>
        </div>
        <n-tag v-if="isEnabled" type="success" :bordered="false">
          {{ $t('layout.profile.twoFactor.status.enabled') }}
        </n-tag>
        <n-tag v-else type="warning" :bordered="false">
          {{ $t('layout.profile.twoFactor.status.disabled') }}
        </n-tag>
      </div>

      <n-flex v-if="!isEnabled" :size="8">
        <n-button
          type="primary"
          secondary
          :loading="setupMutation.isPending.value"
          @click="startSetup"
        >
          {{ $t('layout.profile.twoFactor.enableAction') }}
        </n-button>
      </n-flex>

      <n-flex v-else :size="8">
        <n-button type="error" secondary @click="openDisableModal">
          {{ $t('layout.profile.twoFactor.disableAction') }}
        </n-button>
        <n-button secondary @click="startRegenerate">
          {{ $t('layout.profile.twoFactor.regenerateAction') }}
        </n-button>
      </n-flex>
    </n-flex>
  </n-spin>

  <!-- Setup Modal -->
  <n-modal
    v-model:show="showSetupModal"
    preset="card"
    :title="$t('layout.profile.twoFactor.setup.title')"
    style="width: 520px; max-width: 90vw"
    :mask-closable="false"
    :close-on-esc="false"
  >
    <n-steps :current="setupStep" size="small" class="mb-6">
      <n-step :title="$t('layout.profile.twoFactor.setup.step1Title')" />
      <n-step :title="$t('layout.profile.twoFactor.setup.step2Title')" />
      <n-step :title="$t('layout.profile.twoFactor.setup.step3Title')" />
    </n-steps>

    <!-- Step 1: QR Code -->
    <div v-if="setupStep === 1">
      <p class="text-sm text-[var(--color-text-light)] mb-4">
        {{ $t('layout.profile.twoFactor.setup.step1Description') }}
      </p>
      <div class="flex justify-center mb-4">
        <n-qr-code
          :value="setupMutation.data.value?.qrCodeUri ?? ''"
          :size="200"
          error-correction-level="M"
        />
      </div>
      <div class="text-xs text-[var(--color-text-light)] mb-2">
        {{ $t('layout.profile.twoFactor.setup.step1ManualKey') }}
      </div>
      <div class="flex items-center gap-2 mb-4">
        <code class="flex-1 text-xs bg-[var(--color-bg-body)] p-2 rounded break-all select-all">
          {{ setupMutation.data.value?.secret }}
        </code>
        <n-button
          size="tiny"
          quaternary
          @click="copyToClipboard(setupMutation.data.value?.secret ?? '')"
        >
          {{ $t('common.action.save') }}
        </n-button>
      </div>
      <n-alert type="info" :bordered="false" class="mb-4">
        {{ $t('layout.profile.twoFactor.wechatHint') }}
      </n-alert>
      <n-flex justify="end">
        <n-button @click="closeSetupModal">{{ $t('common.action.cancel') }}</n-button>
        <n-button type="primary" @click="setupStep = 2">
          {{ $t('common.action.next') }}
        </n-button>
      </n-flex>
    </div>

    <!-- Step 2: Verify Code -->
    <div v-if="setupStep === 2">
      <p class="text-sm text-[var(--color-text-light)] mb-4">
        {{ $t('layout.profile.twoFactor.setup.step2Description') }}
      </p>
      <n-form>
        <n-form-item>
          <n-input
            v-model:value="verifyCode"
            :placeholder="$t('auth.twoFactor.codePlaceholder')"
            size="large"
            :maxlength="6"
            @keyup.enter="confirmEnable"
          />
        </n-form-item>
      </n-form>
      <n-flex justify="end">
        <n-button @click="setupStep = 1">{{ $t('common.action.previous') }}</n-button>
        <n-button
          type="primary"
          :loading="enableMutation.isPending.value"
          :disabled="!verifyCode.trim()"
          @click="confirmEnable"
        >
          {{ $t('common.action.confirm') }}
        </n-button>
      </n-flex>
    </div>

    <!-- Step 3: Backup Codes -->
    <div v-if="setupStep === 3">
      <p class="text-sm text-[var(--color-text-light)] mb-2">
        {{ $t('layout.profile.twoFactor.setup.step3Description') }}
      </p>
      <n-alert type="warning" :bordered="false" class="mb-4">
        {{ $t('layout.profile.twoFactor.setup.step3Warning') }}
      </n-alert>
      <div class="grid grid-cols-2 gap-2 mb-4">
        <code
          v-for="code in backupCodes"
          :key="code"
          class="text-center text-sm bg-[var(--color-bg-body)] p-2 rounded select-all font-mono"
        >
          {{ code }}
        </code>
      </div>
      <n-flex justify="end">
        <n-button secondary @click="copyBackupCodes(backupCodes)">
          {{ $t('common.action.save') }}
        </n-button>
        <n-button type="primary" @click="closeSetupModal">
          {{ $t('common.action.confirm') }}
        </n-button>
      </n-flex>
    </div>
  </n-modal>

  <!-- Disable Modal -->
  <n-modal
    v-model:show="showDisableModal"
    preset="card"
    :title="$t('layout.profile.twoFactor.disable.title')"
    style="width: 420px; max-width: 90vw"
  >
    <p class="text-sm text-[var(--color-text-light)] mb-4">
      {{ $t('layout.profile.twoFactor.disable.description') }}
    </p>
    <n-form>
      <n-form-item :label="$t('layout.profile.twoFactor.disable.passwordLabel')">
        <n-input
          v-model:value="disablePassword"
          type="password"
          show-password-on="click"
          :placeholder="$t('common.placeholder.input', { label: $t('auth.field.password') })"
          @keyup.enter="confirmDisable"
        />
      </n-form-item>
    </n-form>
    <n-flex justify="end">
      <n-button @click="showDisableModal = false">{{ $t('common.action.cancel') }}</n-button>
      <n-button
        type="error"
        :loading="disableMutation.isPending.value"
        :disabled="!disablePassword"
        @click="confirmDisable"
      >
        {{ $t('layout.profile.twoFactor.disable.confirmAction') }}
      </n-button>
    </n-flex>
  </n-modal>

  <!-- Regenerate Backup Codes Modal -->
  <n-modal
    v-model:show="showRegenerateModal"
    preset="card"
    :title="$t('layout.profile.twoFactor.regenerate.title')"
    style="width: 420px; max-width: 90vw"
    :mask-closable="regeneratedCodes.length === 0"
  >
    <template v-if="regeneratedCodes.length === 0">
      <p class="text-sm text-[var(--color-text-light)] mb-4">
        {{ $t('layout.profile.twoFactor.regenerate.description') }}
      </p>
      <n-flex justify="end">
        <n-button @click="showRegenerateModal = false">{{ $t('common.action.cancel') }}</n-button>
        <n-button
          type="primary"
          :loading="backupCodesMutation.isPending.value"
          @click="confirmRegenerate"
        >
          {{ $t('layout.profile.twoFactor.regenerate.confirmAction') }}
        </n-button>
      </n-flex>
    </template>
    <template v-else>
      <n-alert type="warning" :bordered="false" class="mb-4">
        {{ $t('layout.profile.twoFactor.setup.step3Warning') }}
      </n-alert>
      <div class="grid grid-cols-2 gap-2 mb-4">
        <code
          v-for="code in regeneratedCodes"
          :key="code"
          class="text-center text-sm bg-[var(--color-bg-body)] p-2 rounded select-all font-mono"
        >
          {{ code }}
        </code>
      </div>
      <n-flex justify="end">
        <n-button secondary @click="copyBackupCodes(regeneratedCodes)">
          {{ $t('common.action.save') }}
        </n-button>
        <n-button type="primary" @click="showRegenerateModal = false">
          {{ $t('common.action.confirm') }}
        </n-button>
      </n-flex>
    </template>
  </n-modal>
</template>
