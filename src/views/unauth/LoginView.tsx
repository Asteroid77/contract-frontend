import LoginForm from '@/components/login/LoginForm'
import type { SignInRequest } from '@/types/account'
import { defineComponent, ref } from 'vue'
import { useLogin } from '@/hooks/account/useLogin'
import { notification } from '@/_utils/discrete_naive_api'
import { $t } from '@/_utils/i18n'
import { NButton, NIcon } from 'naive-ui'
import clsx from 'clsx'
import { GithubFilled, QqCircleFilled } from '@vicons/antd'
import { useOauth2AuthorizationUrl } from '@/hooks/account/useOauth2AuthorizationUrl'
export default defineComponent({
  name: 'login-view',
  setup() {
    const login = useLogin()
    const authWindowRef = ref<Window | null>(null)
    window.addEventListener('message', (event) => {
      if (
        event.origin !== `${import.meta.env.VITE_DOMAIN_URL}:${import.meta.env.VITE_CLIENT_PORT}`
      ) {
        console.error(`未知origin发送的message:${event.origin},已拦截`)
        return
      }
      if (event.data && event.data.token) {
        const token = event.data.token
        login.mutate({ mode: 'oauth2', token })
      } else {
        if (event.data.url && event.data.url.includes('callback')) {
          notification['error']({
            title: $t('account.login.oauth2.error.title'),
            content: $t('account.login.oauth2.error.meta'),
            duration: 2500,
          })
        }
      }
      if (authWindowRef.value) authWindowRef.value.close()
    })
    const oauth2BtnClick = (platform: string) => {
      authWindowRef.value = useOauth2AuthorizationUrl(platform)
    }
    const onSubmit = ({
      valid,
      formData,
    }: {
      valid: boolean
      formData: boolean extends true ? SignInRequest : FormInput<SignInRequest>
    }) => {
      if (valid) {
        login.mutate({ mode: 'local', data: formData as SignInRequest })
      }
    }
    return () => (
      <template>
        <LoginForm
          isSubmitBtnLoading={login.isPending.value}
          onSubmit={onSubmit}
          v-slots={{
            default: () => (
              <div class={clsx('flex', 'gap-content')}>
                <NButton
                  v-slots={{
                    icon: () => (
                      <NIcon>
                        <QqCircleFilled></QqCircleFilled>
                      </NIcon>
                    ),
                    default: () => $t('unauth.login.actions.qq'),
                  }}
                ></NButton>
                <NButton
                  onClick={() => oauth2BtnClick('github')}
                  v-slots={{
                    icon: () => (
                      <NIcon>
                        <GithubFilled></GithubFilled>
                      </NIcon>
                    ),
                    default: () => $t('unauth.login.actions.github'),
                  }}
                ></NButton>
              </div>
            ),
          }}
        ></LoginForm>
      </template>
    )
  },
})
