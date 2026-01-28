import {
  defineComponent,
  ref,
  renderSlot,
  useTemplateRef,
  type PropType,
  type ShallowRef,
} from 'vue'
import { loginFormRules } from './rules/LoginFormRules'
import { NButton, NDivider, NForm, NFormItem, NImage, NInput, NSpace, NSpin } from 'naive-ui'
import { $t } from '@/_utils/i18n'
import { InfoCircleFilled, IdcardOutlined, KeyOutlined, MailOutlined } from '@vicons/antd'
import { useCaptcha } from '@/hooks/captcha/useCaptcha'
import { NTooltip, NIcon } from 'naive-ui'
import clsx from 'clsx'
import type { SignInRequest } from '@/types/account'
import { RouterLink } from 'vue-router'
import type { FormInst } from 'naive-ui/lib'

export default defineComponent({
  props: {
    initialValues: {
      type: Object as PropType<SignInRequest>,
    },
    isSubmitBtnLoading: {
      type: Boolean,
    },
  },
  emits: {
    submit: null,
  },
  setup(props, { emit, slots }) {
    const { isLoading: captchaLoading, data: captchaData, refetch: captchaRefetch } = useCaptcha()
    const formRef: Readonly<ShallowRef<FormInst | null>> = useTemplateRef<FormInst>('formRef')
    const formData = ref<FormInput<SignInRequest>>({})
    const rules = loginFormRules(formData)
    const onSubmit = () => {
      formRef.value?.validate((errors) => {
        emit('submit', {
          valid: !errors?.length,
          formData: { ...formData.value, captchaKey: captchaData.value?.id },
        })
      })
    }
    if (props.initialValues) {
      formData.value = { ...props.initialValues }
    }
    return () => (
      <div
        class={clsx(
          'w-full',
          'h-full',
          'flex',
          'flex-col',
          'sm:justify-center',
          'max-sm:bg-background',
        )}
      >
        <NForm
          ref="formRef"
          model={formData.value}
          rules={rules}
          class={clsx('flex', 'flex-col', 'sm:mb-content', 'sm:rounded-lg')}
        >
          <NFormItem path="phone" label={$t('account.phone.text')}>
            <NInput
              clearable={true}
              v-model:value={formData.value.phone}
              v-slots={{
                prefix: () => (
                  <NIcon>
                    <IdcardOutlined></IdcardOutlined>
                  </NIcon>
                ),
                suffix: () => (
                  <NTooltip
                    placement={'top-start'}
                    trigger={'hover'}
                    v-slots={{
                      trigger: () => (
                        <NIcon class={'logiNForm-suffix-icon'}>
                          <InfoCircleFilled></InfoCircleFilled>
                        </NIcon>
                      ),
                      default: () => $t('account.phone.support'),
                    }}
                  ></NTooltip>
                ),
              }}
            ></NInput>
          </NFormItem>
          <NFormItem path="password" label={$t('account.password.text')}>
            <NInput
              type="password"
              show-password-on="mousedown"
              v-model:value={formData.value.password}
              clearable={true}
              onKeydown={(e: KeyboardEvent) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                }
              }}
              v-slots={{
                prefix: () => (
                  <NIcon>
                    <KeyOutlined></KeyOutlined>
                  </NIcon>
                ),
                suffix: () => (
                  <NTooltip
                    placement="top-start"
                    trigger="hover"
                    v-slots={{
                      trigger: () => (
                        <NIcon class="logiNForm-suffix-icon multi-icon">
                          <InfoCircleFilled></InfoCircleFilled>
                        </NIcon>
                      ),
                      default: () => $t('account.password.regular'),
                    }}
                  ></NTooltip>
                ),
              }}
            ></NInput>
          </NFormItem>
          <NFormItem path="captcha" label={$t('captcha.text')}>
            <NInput
              type="text"
              v-model:value={formData.value.captcha}
              onKeydown={(e: KeyboardEvent) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                }
              }}
              clearable
              v-slots={{
                prefix: () => (
                  <NIcon>
                    <MailOutlined></MailOutlined>
                  </NIcon>
                ),
                suffix: () => (
                  <NTooltip
                    placement="top-start"
                    trigger="hover"
                    v-slots={{
                      trigger: () => (
                        <NIcon class="login-form-suffix-icon">
                          <InfoCircleFilled></InfoCircleFilled>
                        </NIcon>
                      ),
                      default: () => $t('account.refresh'),
                    }}
                  ></NTooltip>
                ),
              }}
            ></NInput>
            <NSpace class={''} {...{ onClick: captchaRefetch }}>
              {captchaLoading.value || !captchaData?.value?.image ? (
                <NSpin size="small" />
              ) : (
                <NImage
                  src={captchaData?.value?.image}
                  alt="captha"
                  class={clsx('cursor-pointer', 'flex!', 'px-content')}
                  preview-disabled
                />
              )}
            </NSpace>
          </NFormItem>
          <div
            class={clsx(
              'flex',
              'flex-col',
              'justify-center',
              'align-middle',
              'gap-content',
              'pt-content',
            )}
          >
            {
              <NButton
                type={'primary'}
                strong
                size={'large'}
                class={'h-12!'}
                onClick={onSubmit}
                loading={props.isSubmitBtnLoading}
              >
                <div class={clsx('p-content', 'text-xl')}>{$t('account.login.text')}</div>
              </NButton>
            }
            {
              <RouterLink
                to={{ name: 'password-recovery' }}
                class="font-medium ml-2 text-center cursor-pointer text-routelink underline hover-shake"
              >
                {$t('actions.forgetPassword')}
              </RouterLink>
            }
          </div>
          {<NDivider>{'or'}</NDivider>}
          {renderSlot(slots, 'default')}
        </NForm>
        <div
          class={clsx(
            `bg-background`,
            'pb-section',
            'px-section',
            'sm:p-section',
            'sm:rounded-lg',
            'flex',
            'flex-col',
          )}
        >
          <h2 class={clsx('mb-content', 'text-center', 'text-2xl', 'font-medium', 'text-gray-800')}>
            {$t('account.login.signIn')}
          </h2>
          {
            <RouterLink
              to={{ name: 'register' }}
              class={clsx(
                'p-text',
                'border-1',
                'cursor-pointer',
                'rounded-xs',
                'text-center',
                `hover:border-[var(--n-primary-color)]`,
                `hover:text-[var(--n-primary-color)]`,
                'transition-all',
                'h-12',
              )}
            >
              {<p class={clsx('text-xl', 'font-medium')}>{$t('account.login.signUp')}</p>}
            </RouterLink>
          }
        </div>
      </div>
    )
  },
})
