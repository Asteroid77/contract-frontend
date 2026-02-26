import { defineComponent, ref, shallowRef, watch, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { NForm, NFormItem, NInput, NButton, NCheckbox, NDivider } from 'naive-ui'
import { LogoGithub, LogoWechat, RefreshOutline } from '@vicons/ionicons5'
import type { SignInForm } from '@/modules/user/application/models'
import { useLogin } from '@/modules/user/application/hooks/useLogin'
import { useOauth2AuthorizationUrl } from '@/modules/user/application/hooks/useOauth2AuthorizationUrl'
import { convertUIToSignInForm } from '@/modules/user/application/ui-mappers'
import { getFrontendOrigin } from '@/app/infrastructure/request/get-frontend-url'
import { useCaptcha } from '@/modules/captcha/application/hooks/useCaptcha'
import { notification } from '@/_utils/discrete_naive_api'

export default defineComponent({
  name: 'login-view-vdts',
  setup() {
    const { t } = useI18n()
    const router = useRouter()
    const login = useLogin()

    const formData = ref<FormInput<SignInForm>>({
      phone: '',
      password: '',
      captcha: '',
      captchaKey: '',
      remember: false,
    })

    const { data: captchaData, refetch: refreshCaptcha, isLoading: captchaLoading } = useCaptcha()

    watch(
      captchaData,
      (data) => {
        formData.value.captchaKey = data?.id || ''
      },
      { immediate: true },
    )

    const authWindowRef = shallowRef<Window | null>(null)
    const oauthRememberMeRef = ref(false)

    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== getFrontendOrigin()) {
        console.error(`未知origin发送的message:${event.origin},已拦截`)
        return
      }

      if (!authWindowRef.value) {
        return
      }
      if (!event.source || event.source !== authWindowRef.value) {
        return
      }

      const authCode = typeof event.data?.authCode === 'string' ? event.data.authCode.trim() : ''
      const hasOauthError =
        typeof event.data?.error === 'string' && event.data.error.trim().length > 0
      const hasCallbackUrl =
        typeof event.data?.url === 'string' && event.data.url.includes('callback')

      if (hasOauthError) {
        notification['error']({
          title: t('auth.oauth.error'),
          content: t('auth.oauth.errorMeta'),
          duration: 2500,
        })
      } else if (authCode.length > 0) {
        login.mutate({
          mode: 'oauth2',
          authCode,
          rememberMe: oauthRememberMeRef.value,
        })
      } else if (hasCallbackUrl) {
        notification['error']({
          title: t('auth.oauth.error'),
          content: t('auth.oauth.errorMeta'),
          duration: 2500,
        })
      }

      if (authWindowRef.value) {
        authWindowRef.value.close()
        authWindowRef.value = null
      }
    }

    onMounted(() => {
      window.addEventListener('message', handleMessage)
    })

    onUnmounted(() => {
      window.removeEventListener('message', handleMessage)
    })

    const oauth2BtnClick = (platform: string) => {
      oauthRememberMeRef.value = Boolean(formData.value.remember)
      authWindowRef.value = useOauth2AuthorizationUrl(platform, oauthRememberMeRef.value)
    }

    const handleSubmit = () => {
      const payload: SignInForm = {
        phone: formData.value.phone?.trim() || '',
        password: formData.value.password || '',
        captcha: formData.value.captcha?.trim() || '',
        captchaKey: formData.value.captchaKey || '',
        remember: !!formData.value.remember,
      }

      const submitData = convertUIToSignInForm(payload)
      login.mutate({ mode: 'local', data: submitData })
    }

    return () => (
      <div class="notion-card w-full p-6 md:p-8">
        <div class="text-center mb-8">
          <h1 class="text-2xl font-bold mb-2">{t('auth.login.title')}</h1>
          <p class="text-[var(--color-text-light)]">{t('auth.login.meta')}</p>
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
            <NInput
              v-model:value={formData.value.password}
              type="password"
              showPasswordOn="click"
              placeholder={t('common.placeholder.input', { label: t('auth.field.password') })}
              size="large"
            />
          </NFormItem>

          <NFormItem>
            <div class="flex gap-3 w-full">
              <NInput
                v-model:value={formData.value.captcha}
                placeholder={t('common.placeholder.input', { label: t('auth.field.captcha') })}
                size="large"
                class="flex-1"
              />
              <div
                class="h-10 w-28 rounded-md overflow-hidden cursor-pointer border border-[var(--color-border)] flex items-center justify-center bg-[var(--color-bg-body)]"
                onClick={() => refreshCaptcha()}
              >
                {captchaLoading.value || !captchaData.value?.image ? (
                  <RefreshOutline
                    class="animate-spin text-[var(--color-text-light)]"
                    style={{ width: 'var(--spacing-16)', height: 'var(--spacing-16)' }}
                  />
                ) : (
                  <img
                    src={captchaData.value.image}
                    alt="captcha"
                    class="h-full w-full object-cover"
                  />
                )}
              </div>
            </div>
          </NFormItem>

          <div class="flex justify-between items-center mb-6">
            <NCheckbox v-model:checked={formData.value.remember}>
              <span class="text-sm text-[var(--color-text-body)]">{t('auth.login.remember')}</span>
            </NCheckbox>
            <a
              class="text-sm text-[var(--color-accent)] hover:text-[var(--color-accent-hover)] cursor-pointer"
              onClick={() => router.push({ name: 'password-recovery' })}
            >
              {t('auth.action.forgotPassword')}
            </a>
          </div>

          <NButton
            type="primary"
            block
            size="large"
            loading={login.isPending.value}
            onClick={handleSubmit}
          >
            {t('auth.action.login')}
          </NButton>
        </NForm>

        <NDivider>
          <span class="text-xs text-[var(--color-text-light)]">OR</span>
        </NDivider>

        <div class="flex gap-4 justify-center flex-wrap">
          <button
            class="flex items-center justify-center gap-2 px-6 py-2.5 border border-[var(--color-border)] rounded-lg hover:bg-[var(--color-border)] transition-colors"
            onClick={() => oauth2BtnClick('github')}
          >
            <LogoGithub class="w-5 h-5" />
            <span class="text-sm">GitHub</span>
          </button>
          <button class="flex items-center justify-center gap-2 px-6 py-2.5 border border-[var(--color-border)] rounded-lg hover:bg-[var(--color-border)] transition-colors text-green-600">
            <LogoWechat class="w-5 h-5" />
            <span class="text-sm">QQ</span>
          </button>
        </div>

        <p class="text-center mt-6 text-sm text-[var(--color-text-light)]">
          {t('auth.login.noAccount')}{' '}
          <a
            class="text-[var(--color-accent)] hover:text-[var(--color-accent-hover)] cursor-pointer font-medium"
            onClick={() => router.push({ name: 'register' })}
          >
            {t('auth.action.signup')}
          </a>
        </p>
      </div>
    )
  },
})
