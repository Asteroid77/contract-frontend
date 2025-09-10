<script setup lang="ts">
import UserAdditionalInfoForm, {
  type UserAdditionalInfoFormExpose,
} from '@/components/user_additional_info/UserAdditionalInfoForm'
import { computed, useTemplateRef } from 'vue'
import { NFlex, NButton } from 'naive-ui'
import { $t } from '@/_utils/i18n'
import type { Ref } from 'vue'
import type { UserAdditionalInfoRequest } from '@/types/account'
import { useUserAdditionalInfoRequest } from '@/hooks/account/useUserAdditionalInfoRequest'
const $form: Ref<UserAdditionalInfoFormExpose | null> =
  useTemplateRef<UserAdditionalInfoFormExpose>('formRef')
const req = useUserAdditionalInfoRequest(() => {})
const submitBtnLoading = computed(() => req.isPending.value)
const submit = () => {
  if ($form.value) {
    const formInstance = $form.value?.getFormInstance()
    if (formInstance.validate) {
      formInstance.validate((errors) => {
        if (!errors?.length) {
          const formData = formInstance.values as UserAdditionalInfoRequest
          req.mutate(formData)
        }
      })
    }
  }
}
</script>
<template>
  <UserAdditionalInfoForm ref="formRef"></UserAdditionalInfoForm>
  <n-flex>
    <n-button @click="submit" :loading="submitBtnLoading">{{ $t('actions.confirm') }}</n-button>
  </n-flex>
</template>
