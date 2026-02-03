import LoginForm from '@/modules/user/presentation/login/LoginForm'
import type { SignInForm } from '@/modules/user/application/models'
import { defineComponent, onMounted, onUnmounted, ref } from 'vue'
import { useLogin } from '@/modules/user/application/hooks/useLogin'
import { notification } from '@/_utils/discrete_naive_api'
import { $t } from '@/_utils/i18n'
import { NButton, NIcon } from 'naive-ui'
import clsx from 'clsx'
import { GithubFilled, QqCircleFilled } from '@vicons/antd'
import { useOauth2AuthorizationUrl } from '@/modules/user/application/hooks/useOauth2AuthorizationUrl'
import { convertUIToSignInForm } from '@/modules/user/application/ui-mappers'
import { getFrontendOrigin } from '@/app/infrastructure/request/get-frontend-url'

export default defineComponent({
  name: 'login-view',
  setup() {
    const login = useLogin()
    const authWindowRef = ref<Window | null>(null)
    const handleMessage = (event: MessageEvent) => {
      // 校验消息来源是否为当前应用的前端 Origin
      if (event.origin !== getFrontendOrigin()) {
        console.error(`未知origin发送的message:${event.origin},已拦截`)
        return
      }
      if (event.data && event.data.token) {
        const token = event.data.token
        login.mutate({ mode: 'oauth2', token })
      } else {
        if (event.data.url && event.data.url.includes('callback')) {
          notification['error']({
            title: $t('auth.oauth.error'),
            content: $t('auth.oauth.errorMeta'),
            duration: 2500,
          })
        }
      }
      if (authWindowRef.value) authWindowRef.value.close()
    }
    onMounted(() => {
      window.addEventListener('message', handleMessage)
    })
    onUnmounted(() => {
      window.removeEventListener('message', handleMessage)
    })
    const oauth2BtnClick = (platform: string) => {
      authWindowRef.value = useOauth2AuthorizationUrl(platform)
    }
    const onSubmit = (formData: SignInForm) => {
      const submitData = convertUIToSignInForm(formData)
      login.mutate({ mode: 'local', data: submitData })
    }
    return () => (
      <div>
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
                    default: () => $t('auth.login.qq'),
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
                    default: () => $t('auth.login.github'),
                  }}
                ></NButton>
              </div>
            ),
          }}
        ></LoginForm>
      </div>
    )
  },
})
