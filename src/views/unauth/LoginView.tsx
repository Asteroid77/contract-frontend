import LoginForm from '@/modules/user/presentation/login/LoginForm'
import type { SignInRequest } from '@/modules/user/application/models'
import { defineComponent, onMounted, onUnmounted, ref } from 'vue'
import { useLogin } from '@/modules/user/application/hooks/useLogin'
import { notification } from '@/_utils/discrete_naive_api'
import { $t } from '@/_utils/i18n'
import { NButton, NIcon } from 'naive-ui'
import clsx from 'clsx'
import { GithubFilled, QqCircleFilled } from '@vicons/antd'
import { useOauth2AuthorizationUrl } from '@/modules/user/application/hooks/useOauth2AuthorizationUrl'
import { buildSubmitData } from '@/modules/shared/application/form'
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
            title: $t('account.login.oauth2.error.title'),
            content: $t('account.login.oauth2.error.meta'),
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
    const onSubmit = ({
      valid,
      formData,
      requiredKeys,
    }: {
      valid: boolean
      formData: boolean extends true ? SignInRequest : FormInput<SignInRequest>
      requiredKeys: readonly (keyof SignInRequest)[]
    }) => {
      if (valid) {
        const submitData = buildSubmitData<SignInRequest>(formData, requiredKeys)
        if (!submitData) return
        login.mutate({ mode: 'local', data: submitData })
      }
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
      </div>
    )
  },
})
