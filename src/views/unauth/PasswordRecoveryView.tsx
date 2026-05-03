import { defineComponent, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { NForm, NFormItem, NInput, NButton } from 'naive-ui'
import { ArrowLeft } from 'lucide-vue-next'
import { useSMS } from '@/modules/captcha/application/hooks/useSMS'
import { message } from '@/_utils/discrete_naive_api'
import type { PasswordRecoveryForm } from '@/modules/user/application/models'
import { usePasswordRecovery } from '@/modules/user/application/hooks/usePassword'
import { convertUIToPasswordRecoveryForm } from '@/modules/user/application/ui-mappers'

export default defineComponent({
  name: 'password-recovery-view-vdts',
  setup() {
    const { t } = useI18n()
    const router = useRouter()
    const recoveryMutation = usePasswordRecovery()
    const { getSendBtnLabelText, getSMSCoolDownSecond, sendSMSCode } = useSMS()

    const formData = ref<FormInput<PasswordRecoveryForm>>({
      phone: '',
      code: '',
      password: '',
      dbCheckPassword: '',
      bizId: '',
    })

    const useSMSCode = sendSMSCode()

    const sendBtnLabel = computed(() =>
      formData.value.phone
        ? getSendBtnLabelText(formData.value.phone).value
        : t('common.action.send'),
    )

    const canSendCode = computed(() => {
      if (!formData.value.phone) return false
      return getSMSCoolDownSecond(formData.value.phone).value <= 0
    })

    const passwordsMatch = computed(() => {
      if (!formData.value.dbCheckPassword) return true
      return formData.value.password === formData.value.dbCheckPassword
    })

    const handleSendCode = () => {
      if (!formData.value.phone) {
        message.warning(t('auth.validation.verifyPhoneFirst'))
        return
      }

      useSMSCode.mutate(formData.value.phone)
    }

    const handleSubmit = () => {
      if (!passwordsMatch.value) {
        message.error(t('auth.validation.passwordMismatch'))
        return
      }

      const payload: PasswordRecoveryForm = {
        phone: formData.value.phone?.trim() || '',
        password: formData.value.password || '',
        dbCheckPassword: formData.value.dbCheckPassword || '',
        code: formData.value.code?.trim() || '',
        bizId: useSMSCode.data.value?.bizId || formData.value.bizId || '',
      }

      const submitData = convertUIToPasswordRecoveryForm(payload)
      recoveryMutation.mutate(submitData)
    }

    return () => (
      <div class="notion-card w-full p-6 md:p-8">
        <button
          class="flex items-center gap-1 text-[var(--color-text-light)] hover:text-[var(--color-text-main)] mb-6 transition-colors"
          onClick={() => router.push({ name: 'login' })}
        >
          <ArrowLeft style={{ width: 'var(--spacing-16)', height: 'var(--spacing-16)' }} />
          <span class="text-sm">{t('auth.action.backToLogin')}</span>
        </button>

        <div class="text-center mb-8">
          <h1 class="text-2xl font-bold mb-2">{t('auth.recovery.title')}</h1>
          <p class="text-[var(--color-text-light)]">{t('auth.recovery.meta')}</p>
        </div>

        <NForm showLabel={false}>
          <NFormItem>
            <NInput
              v-model:value={formData.value.phone}
              placeholder={t('common.placeholder.input', { label: t('auth.field.phone') })}
              size="large"
            />
          </NFormItem>

          <NFormItem>
            <div class="flex gap-3 w-full">
              <NInput
                v-model:value={formData.value.code}
                placeholder={t('common.placeholder.input', { label: t('auth.field.smsCode') })}
                size="large"
                class="flex-1"
              />
              <NButton
                size="large"
                disabled={!canSendCode.value}
                loading={useSMSCode.isPending.value}
                onClick={handleSendCode}
              >
                {sendBtnLabel.value}
              </NButton>
            </div>
          </NFormItem>

          <NFormItem>
            <NInput
              v-model:value={formData.value.password}
              type="password"
              showPasswordOn="click"
              placeholder={t('common.placeholder.input', { label: t('auth.field.newPassword') })}
              size="large"
            />
          </NFormItem>

          <NFormItem validationStatus={passwordsMatch.value ? undefined : 'error'}>
            <NInput
              v-model:value={formData.value.dbCheckPassword}
              type="password"
              showPasswordOn="click"
              placeholder={t('common.placeholder.input', {
                label: t('auth.field.confirmNewPassword'),
              })}
              size="large"
            />
          </NFormItem>

          {!passwordsMatch.value && (
            <p class="text-red-500 text-sm -mt-4 mb-4">{t('auth.validation.passwordMismatch')}</p>
          )}

          <NButton
            type="primary"
            block
            size="large"
            loading={recoveryMutation.isPending.value}
            disabled={!passwordsMatch.value}
            onClick={handleSubmit}
          >
            {t('auth.action.changePassword')}
          </NButton>
        </NForm>
      </div>
    )
  },
})
