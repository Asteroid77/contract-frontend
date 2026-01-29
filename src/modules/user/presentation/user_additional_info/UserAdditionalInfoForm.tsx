import { NFormItem, NInput, NSelect, NForm, type FormInst } from 'naive-ui'
import type { UserAdditionalInfoRequest } from '@/modules/user/application/models'
import { computed, defineComponent, toRef, useTemplateRef, type PropType, type Ref } from 'vue'
import { $t } from '@/_utils/i18n'
import { RegisterType, RegisterTypeOption } from '@/modules/user/application/constants'
import { UserAdditionalInfoFormRules } from '@/modules/user/application/validation'
import PCACascader from '@/modules/shared/presentation/widget/PCACascader'
import BankSelect from '@/modules/shared/presentation/widget/BankSelect'
import type { FormValidate } from 'naive-ui/lib/form/src/interface'
import { useSubscribeForm } from '@/modules/shared/application/form'

export const userAdditionalInfoFormProps = {
  initialValue: {
    type: Object as PropType<FormInput<UserAdditionalInfoRequest>>,
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
    values: FormInput<UserAdditionalInfoRequest>
  }
}
export default defineComponent({
  name: 'user-additional-info-form',
  props: userAdditionalInfoFormProps,
  setup(props, { expose }) {
    const { formValue } = useSubscribeForm<FormInput<UserAdditionalInfoRequest>>(
      toRef(props, 'initialValue'),
      props.type === 'detail',
    )
    const isLegalRepresentative = computed(
      () => formValue.value.registerType === RegisterType.LEGAL_REPRESENTATIVE,
    )
    const isIndividual = computed(() => formValue.value.registerType === RegisterType.INDIVIDUAL)
    const isNew = computed(() => !formValue.value.id)
    const formRef: Ref<FormInst | null> = useTemplateRef('formRef')
    const exposeDefined: UserAdditionalInfoFormExpose = {
      getFormInstance: () => {
        return {
          validate: formRef.value?.validate,
          restoreValidation: formRef.value?.restoreValidation,
          values: formValue.value,
        }
      },
    }
    expose(exposeDefined)
    const legalRepresentativeGroup = () => (
      <>
        <NFormItem label={$t('account.additionalInfo.companyName')} path="name">
          <NInput v-model:value={formValue.value.name}></NInput>
        </NFormItem>
        <NFormItem label={$t('account.additionalInfo.pca')} path="pca">
          <PCACascader v-model:value={formValue.value.pca}></PCACascader>
        </NFormItem>
        <NFormItem label={$t('account.additionalInfo.companyAddress')} path="companyAddress">
          <NInput v-model:value={formValue.value.companyAddress} />
        </NFormItem>
        <NFormItem label={$t('account.additionalInfo.contactPerson')} path="contactPerson">
          <NInput v-model:value={formValue.value.contactPerson} />
        </NFormItem>
        <NFormItem
          label={$t('account.additionalInfo.contactPersonPhone')}
          path="contactPersonPhone"
        >
          <NInput v-model:value={formValue.value.contactPersonPhone} />
        </NFormItem>
        <NFormItem label={$t('account.additionalInfo.usci')} path="identity">
          <NInput v-model:value={formValue.value.identity} />
        </NFormItem>
      </>
    )
    const individualGroup = () => (
      <>
        <NFormItem label={$t('account.additionalInfo.name')} path="name">
          <NInput v-model:value={formValue.value.name}></NInput>
        </NFormItem>
        <NFormItem label={$t('account.additionalInfo.pca')} path="pca">
          <PCACascader v-model:value={formValue.value.pca}></PCACascader>
        </NFormItem>
        <NFormItem label={$t('account.additionalInfo.identity')} path="identity">
          <NInput v-model:value={formValue.value.identity} />
        </NFormItem>
      </>
    )
    const commonBottomGroup = () => (
      <>
        <NFormItem label={$t('account.additionalInfo.bankName')} path="bankName">
          <BankSelect v-model:value={formValue.value.bankName}></BankSelect>
        </NFormItem>
        <NFormItem label={$t('account.additionalInfo.bankAccount')} path="bankAccount">
          <NInput v-model:value={formValue.value.bankAccount}></NInput>
        </NFormItem>
        {isNew.value && (
          <NFormItem label={$t('account.additionalInfo.invitationCode')} path="invitationCode">
            <NInput v-model:value={formValue.value.invitationCode}></NInput>
          </NFormItem>
        )}
      </>
    )
    return () => (
      <>
        <NForm ref="formRef" rules={UserAdditionalInfoFormRules(formValue)} model={formValue.value}>
          <NFormItem label={$t('account.register.type.text')} path="registerType">
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
