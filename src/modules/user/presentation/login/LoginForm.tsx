import {
  defineComponent,
  ref,
  renderSlot,
  useTemplateRef,
  type PropType,
  type ShallowRef,
} from 'vue'
import { loginFormValidation } from '@/modules/access/application/validation'
import { NButton, NDivider, NForm, NFormItem, NImage, NInput, NSpace, NSpin } from 'naive-ui'
import { $t } from '@/_utils/i18n'
import { InfoCircleFilled, IdcardOutlined, KeyOutlined, MailOutlined } from '@vicons/antd'
import { useCaptcha } from '@/modules/captcha/application/hooks/useCaptcha'
import { NTooltip, NIcon } from 'naive-ui'
import clsx from 'clsx'
import type { SignInForm } from '@/modules/user/application/models'
import { RouterLink } from 'vue-router'
import type { FormInst } from 'naive-ui/lib'
import { createSignInModel } from '@/modules/user/application/ui-mappers'

export default defineComponent({
  props: {
    initialValues: {
      type: Object as PropType<SignInForm>,
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
    // 使用 Factory Function 初始化表单模型
    const formData = ref<SignInForm>(createSignInModel(props.initialValues))
    const validation = loginFormValidation(formData)
    const onSubmit = () => {
      formRef.value?.validate((errors) => {
        if (!errors) {
          emit('submit', {
            ...formData.value,
            captchaKey: captchaData.value?.id || '',
          })
        }
      })
    }
    if (props.initialValues) {
      formData.value = createSignInModel(props.initialValues)
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
          rules={validation.rules}
          class={clsx('flex', 'flex-col', 'sm:mb-content', 'sm:rounded-lg')}
        >
          <NFormItem path="phone" label={$t('auth.field.phone')}>
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
                      default: () => $t('auth.hint.phoneSupport'),
                    }}
                  ></NTooltip>
                ),
              }}
            ></NInput>
          </NFormItem>
          <NFormItem path="password" label={$t('auth.field.password')}>
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
                      default: () => $t('auth.validation.passwordLength'),
                    }}
                  ></NTooltip>
                ),
              }}
            ></NInput>
          </NFormItem>
          <NFormItem path="captcha" label={$t('auth.field.captcha')}>
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
                      default: () => $t('auth.captcha.refreshHint'),
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
                <div class={clsx('p-content', 'text-xl')}>{$t('auth.login.title')}</div>
              </NButton>
            }
            {
              <RouterLink
                to={{ name: 'password-recovery' }}
                class="font-medium ml-2 text-center cursor-pointer text-routelink underline hover-shake"
              >
                {$t('auth.action.forgotPassword')}
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
            {$t('auth.login.noAccount')}
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
              {<p class={clsx('text-xl', 'font-medium')}>{$t('auth.register.title')}</p>}
            </RouterLink>
          }
        </div>
      </div>
    )
  },
})
