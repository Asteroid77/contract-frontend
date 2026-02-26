import { NFormItem, NInput, NSelect, NForm, type FormInst } from 'naive-ui'
import type { UserAdditionalInfoForm } from '@/modules/user/application/models'
import { computed, defineComponent, toRef, useTemplateRef, type PropType, type Ref } from 'vue'
import { $t } from '@/_utils/i18n'
import { RegisterType, RegisterTypeOption } from '@/modules/user/application/constants'
import {
  UserAdditionalInfoFormValidation,
  getUserAdditionalInfoRequiredKeys,
} from '@/modules/user/application/validation'
import PCACascader from '@/modules/shared/presentation/widget/PCACascader'
import BankSelect from '@/modules/shared/presentation/widget/BankSelect'
import type { FormValidate } from 'naive-ui/lib/form/src/interface'
import { useSubscribeForm } from '@/modules/shared/application/form/useSubscribeForm'
import './UserAdditionalInfoForm.css'

export const userAdditionalInfoFormProps = {
  initialValue: {
    type: Object as PropType<FormInput<UserAdditionalInfoForm>>,
    required: false,
  },
  type: {
    type: String as PropType<'edit' | 'detail'>,
    default: 'edit',
  },
}
export type UserAdditionalInfoFormExpose = {
  getFormInstance: () => {
    validate: FormValidate | undefined
    restoreValidation: (() => void) | undefined
    values: FormInput<UserAdditionalInfoForm>
  }
  getRequiredKeys: () => (keyof UserAdditionalInfoForm)[]
}
export default defineComponent({
  name: 'user-additional-info-form',
  props: userAdditionalInfoFormProps,
  setup(props, { expose }) {
    const { formValue } = useSubscribeForm<FormInput<UserAdditionalInfoForm>>(
      toRef(props, 'initialValue'),
      props.type === 'detail',
    )
    const isLegalRepresentative = computed(
      () => formValue.value.registerType === RegisterType.LEGAL_REPRESENTATIVE,
    )
    const isIndividual = computed(() => formValue.value.registerType === RegisterType.INDIVIDUAL)
    const isNew = computed(() => !formValue.value.id)
    const formRef: Ref<FormInst | null> = useTemplateRef('formRef')
    const validation = UserAdditionalInfoFormValidation(formValue)
    const exposeDefined: UserAdditionalInfoFormExpose = {
      getFormInstance: () => {
        return {
          validate: formRef.value?.validate,
          restoreValidation: formRef.value?.restoreValidation,
          values: formValue.value,
        }
      },
      getRequiredKeys: () =>
        getUserAdditionalInfoRequiredKeys(formValue.value) as (keyof UserAdditionalInfoForm)[],
    }
    expose(exposeDefined)
    const legalRepresentativeGroup = () => (
      <>
        <NFormItem
          class="user-additional-info-form__item"
          label={$t('domain.user.field.companyName')}
          path="name"
        >
          <NInput v-model:value={formValue.value.name}></NInput>
        </NFormItem>
        <NFormItem
          class="user-additional-info-form__item user-additional-info-form__item--full"
          label={$t('domain.user.field.region')}
          path="pca"
        >
          <PCACascader v-model:value={formValue.value.pca}></PCACascader>
        </NFormItem>
        <NFormItem
          class="user-additional-info-form__item user-additional-info-form__item--full"
          label={$t('domain.user.field.companyAddress')}
          path="companyAddress"
        >
          <NInput v-model:value={formValue.value.companyAddress} />
        </NFormItem>
        <NFormItem
          class="user-additional-info-form__item"
          label={$t('domain.user.field.contactPerson')}
          path="contactPerson"
        >
          <NInput v-model:value={formValue.value.contactPerson} />
        </NFormItem>
        <NFormItem
          class="user-additional-info-form__item"
          label={$t('domain.user.field.contactPhone')}
          path="contactPersonPhone"
        >
          <NInput v-model:value={formValue.value.contactPersonPhone} />
        </NFormItem>
        <NFormItem
          class="user-additional-info-form__item"
          label={$t('domain.user.field.usci')}
          path="identity"
        >
          <NInput v-model:value={formValue.value.identity} />
        </NFormItem>
      </>
    )
    const individualGroup = () => (
      <>
        <NFormItem
          class="user-additional-info-form__item"
          label={$t('domain.user.field.name')}
          path="name"
        >
          <NInput v-model:value={formValue.value.name}></NInput>
        </NFormItem>
        <NFormItem
          class="user-additional-info-form__item user-additional-info-form__item--full"
          label={$t('domain.user.field.region')}
          path="pca"
        >
          <PCACascader v-model:value={formValue.value.pca}></PCACascader>
        </NFormItem>
        <NFormItem
          class="user-additional-info-form__item"
          label={$t('domain.user.field.identity')}
          path="identity"
        >
          <NInput v-model:value={formValue.value.identity} />
        </NFormItem>
      </>
    )
    const commonBottomGroup = () => (
      <>
        <NFormItem
          class="user-additional-info-form__item"
          label={$t('domain.user.field.bankName')}
          path="bankName"
        >
          <BankSelect v-model:value={formValue.value.bankName}></BankSelect>
        </NFormItem>
        <NFormItem
          class="user-additional-info-form__item"
          label={$t('domain.user.field.bankAccount')}
          path="bankAccount"
        >
          <NInput v-model:value={formValue.value.bankAccount}></NInput>
        </NFormItem>
        {isNew.value && (
          <NFormItem
            class="user-additional-info-form__item"
            label={$t('domain.user.field.invitationCode')}
            path="invitationCode"
          >
            <NInput v-model:value={formValue.value.invitationCode}></NInput>
          </NFormItem>
        )}
      </>
    )
    return () => (
      <>
        <NForm
          ref="formRef"
          rules={validation.rules}
          model={formValue.value}
          disabled={props.type === 'detail'}
          class="user-additional-info-form"
        >
          <NFormItem
            class="user-additional-info-form__item"
            label={$t('auth.register.type')}
            path="registerType"
          >
            <NSelect
              v-model:value={formValue.value.registerType}
              options={RegisterTypeOption}
            ></NSelect>
          </NFormItem>
          {isLegalRepresentative.value && legalRepresentativeGroup()}
          {isIndividual.value && individualGroup()}
          {commonBottomGroup()}
        </NForm>
      </>
    )
  },
})
