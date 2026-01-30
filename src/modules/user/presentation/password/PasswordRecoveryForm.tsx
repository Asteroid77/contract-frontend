import { defineComponent, ref, useTemplateRef, type PropType, type ShallowRef } from 'vue'
import { NButton, NForm, NFormItem, NInput } from 'naive-ui'
import { $t } from '@/_utils/i18n'
import {
  InfoCircleFilled,
  IdcardOutlined,
  KeyOutlined,
  MailOutlined,
  SendOutlined,
} from '@vicons/antd'
import { NTooltip, NIcon } from 'naive-ui'
import clsx from 'clsx'
import type { PasswordRecoveryRequest } from '@/modules/user/application/models'
import { RouterLink } from 'vue-router'
import { useSMS } from '@/modules/captcha/application/hooks/useSMS'
import type { FormInst } from 'naive-ui/lib'
import { passwordRecoveryFormValidation } from '@/modules/access/application/validation'
const { getSendBtnLabelText, getSMSCoolDownSecond, sendSMSCode } = useSMS()
export default defineComponent({
  props: {
    initialValues: {
      type: Object as PropType<PasswordRecoveryRequest>,
    },
    isSubmitBtnLoading: {
      type: Boolean,
    },
  },
  emits: {
    submit: null,
  },
  setup(props, { emit }) {
    const useSMSCode = sendSMSCode()
    const formRef: Readonly<ShallowRef<FormInst | null>> = useTemplateRef<FormInst>('formRef')
    const formData = ref<FormInput<PasswordRecoveryRequest>>({})
    const validation = passwordRecoveryFormValidation(formData)
    if (props.initialValues) {
      formData.value = { ...props.initialValues }
    }
    const sendBtnClick = () => {
      useSMSCode.mutate(formData.value.phone as string)
    }
    const onSubmit = () => {
      formRef.value?.validate((errors) => {
        if (!errors) {
          emit('submit', {
            ...formData.value,
            bizId: useSMSCode.data.value?.bizId,
          } as PasswordRecoveryRequest)
        }
      })
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
          class={clsx('login-form', 'bg-background', 'p-section', 'sm:mb-section', 'sm:rounded-lg')}
        >
          <h2
            class={clsx('mb-content', 'text-center', 'text-3xl', 'font-medium', 'text-gray-800')}
          >{`${$t('common.brand.name')} ${$t('auth.recovery.title')}`}</h2>
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
          <NFormItem path="password" label={$t('auth.field.newPassword')}>
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
          <NFormItem
            path="dbCheckPassword"
            label={$t('auth.field.confirmNewPassword')}
            required={true}
          >
            <NInput
              type="password"
              show-password-on="mousedown"
              v-model:value={formData.value.dbCheckPassword}
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
          <NFormItem path="code" label={$t('auth.field.captcha')} required={true}>
            <NInput
              type="text"
              v-model:value={formData.value.code}
              class={'mr-content'}
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
              }}
            ></NInput>
            <NButton
              type="primary"
              v-slots={{
                icon: () => <NIcon>{<SendOutlined class="send-icon"></SendOutlined>}</NIcon>,
              }}
              disabled={
                formData.value.phone ? getSMSCoolDownSecond(formData.value.phone).value > 0 : true
              }
              onClick={sendBtnClick}
              loading={useSMSCode.isPending.value}
            >
              {formData.value.phone
                ? getSendBtnLabelText(formData.value.phone).value
                : $t('common.action.send')}
            </NButton>
          </NFormItem>
          <div class={clsx('flex', 'flex-col', 'justify-center', 'align-middle', 'gap-content')}>
            {
              <NButton
                type={'primary'}
                strong
                size={'large'}
                class={'h-12!'}
                onClick={onSubmit}
                loading={props.isSubmitBtnLoading}
              >
                <div class={clsx('p-content', 'text-xl')}>{$t('auth.action.changePassword')}</div>
              </NButton>
            }
            {
              <RouterLink
                to={{ name: 'login' }}
                class="font-medium ml-2 text-center cursor-pointer text-routelink underline hover-shake"
              >
                {$t('auth.register.hasAccount')}
              </RouterLink>
            }
          </div>
        </NForm>
      </div>
    )
  },
})
