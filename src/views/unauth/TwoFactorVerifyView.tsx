import { computed, defineComponent, ref, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { NForm, NFormItem, NInput, NButton, NCheckbox, NFlex } from 'naive-ui'
import { useTotpVerify } from '@/modules/user/application/hooks/useTotpVerify'

export default defineComponent({
  name: 'two-factor-verify-view',
  setup() {
    const route = useRoute()
    const router = useRouter()
    const { t } = useI18n()
    const verify = useTotpVerify()

    const twoFactorToken = computed(() => (route.query.token as string) || '')
    const redirectTarget = computed(() => (route.query.redirect as string) || '')
    const code = ref('')
    const rememberMe = ref(route.query.rememberMe?.toString() === 'true')
    const rememberDevice = ref(route.query.rememberDevice?.toString() === 'true')
    const useBackupCode = ref(false)

    watchEffect(() => {
      if (!twoFactorToken.value) {
        router.replace({ name: 'login' })
      }
    })

    const handleSubmit = () => {
      if (!code.value.trim()) return
      verify.mutate({
        twoFactorToken: twoFactorToken.value,
        code: code.value.trim(),
        rememberMe: rememberMe.value,
        rememberDevice: rememberDevice.value,
        redirect: redirectTarget.value || undefined,
      })
    }

    const toggleMode = () => {
      useBackupCode.value = !useBackupCode.value
      code.value = ''
    }

    return () => (
      <div class="notion-card w-full p-6 md:p-8">
        <div class="text-center mb-8">
          <h1 class="text-2xl font-bold mb-2">{t('auth.twoFactor.verifyTitle')}</h1>
          <p class="text-[var(--color-text-light)]">{t('auth.twoFactor.verifyDescription')}</p>
        </div>

        <NForm showLabel={false}>
          <NFormItem>
            <NInput
              v-model:value={code.value}
              placeholder={
                useBackupCode.value
                  ? t('auth.twoFactor.backupCodePlaceholder')
                  : t('auth.twoFactor.codePlaceholder')
              }
              size="large"
              maxlength={useBackupCode.value ? 8 : 6}
              onKeyup={(e: KeyboardEvent) => {
                if (e.key === 'Enter') handleSubmit()
              }}
            />
          </NFormItem>

          <div class="flex justify-between items-start mb-6">
            <div class="flex flex-col gap-2">
              <NCheckbox v-model:checked={rememberMe.value}>
                <span class="text-sm text-[var(--color-text-body)]">
                  {t('auth.twoFactor.rememberMe')}
                </span>
              </NCheckbox>
              <NCheckbox v-model:checked={rememberDevice.value}>
                <span class="text-sm text-[var(--color-text-body)]">
                  {t('auth.twoFactor.rememberDevice')}
                </span>
              </NCheckbox>
            </div>
            <a
              class="text-sm text-[var(--color-accent)] hover:text-[var(--color-accent-hover)] cursor-pointer"
              onClick={toggleMode}
            >
              {useBackupCode.value
                ? t('auth.twoFactor.totpCodeToggle')
                : t('auth.twoFactor.backupCodeToggle')}
            </a>
          </div>

          <NFlex vertical size={12}>
            <NButton
              type="primary"
              block
              size="large"
              loading={verify.isPending.value}
              onClick={handleSubmit}
            >
              {t('auth.twoFactor.submitAction')}
            </NButton>

            <NButton block size="large" quaternary onClick={() => router.push({ name: 'login' })}>
              {t('auth.twoFactor.backToLogin')}
            </NButton>
          </NFlex>
        </NForm>
      </div>
    )
  },
})
