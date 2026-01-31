<script setup lang="ts">
import UserAdditionalInfoUiForm, {
  type UserAdditionalInfoFormExpose,
} from '@/modules/user/presentation/user_additional_info/UserAdditionalInfoForm'
import { computed, useTemplateRef } from 'vue'
import { NFlex, NButton, NSkeleton, NResult } from 'naive-ui'
import { $t } from '@/_utils/i18n'
import type { Ref } from 'vue'
import type { UserAdditionalInfoForm } from '@/modules/user/application/models'
import { useUserAdditionalInfoRequest } from '@/modules/user/application/hooks/useUserAdditionalInfoRequest'
import { useLatestAdditionalInfoInstanceStatus } from '@/modules/approval/application/hooks/useApprovalService'
import { useRouter } from 'vue-router'
import { useAccountStore } from '@/modules/user/application/stores/useAccountStore'
import { useLoadUserInfo } from '@/modules/user/application/hooks/useLoadUserInfo'

const $form: Ref<UserAdditionalInfoFormExpose | null> =
  useTemplateRef<UserAdditionalInfoFormExpose>('formRef')
const req = useUserAdditionalInfoRequest(() => {})
const status = useLatestAdditionalInfoInstanceStatus()
const router = useRouter()
const account = useAccountStore()
const loadUserInfo = useLoadUserInfo(account.token as string)
const formInitialValue = computed<FormInput<UserAdditionalInfoForm> | undefined>(() => {
  const profile = loadUserInfo.data.value?.profile
  return (profile ?? undefined) as FormInput<UserAdditionalInfoForm> | undefined
})
const pageStatus = computed(() => {
  if (!status.data.value || loadUserInfo.isLoading.value) {
    return 'loading'
  }
  if (['rejected', 'approved', 'canceled'].includes(status.data.value.status)) {
    return 'visible'
  }
  return 'approving'
})
const submitBtnLoading = computed(() => req.isPending.value)
import { convertUIToUserAdditionalInfoForm } from '@/modules/user/application/ui-mappers'

const submit = () => {
  if ($form.value) {
    const formInstance = $form.value?.getFormInstance()
    if (formInstance.validate) {
      formInstance.validate((errors) => {
        if (!errors?.length) {
          const formData = formInstance.values as FormInput<UserAdditionalInfoForm>
          // 在这里进行转换
          const submitData = convertUIToUserAdditionalInfoForm(formData as UserAdditionalInfoForm)
          req.mutate(submitData)
        }
      })
    }
  }
}
const handleClick = () => {
  router.push({
    name: 'approval-instance-detail',
    query: {
      template: '用户信息审批',
      instanceId: status.data.value?.id,
    },
  })
}
</script>
<template>
  <n-flex vertical v-if="pageStatus === 'loading'">
    <n-skeleton :repeat="8" height="30px" width="80%" />
  </n-flex>
  <n-result
    status="info"
    :title="$t('domain.user.approval.title')"
    :description="$t('domain.user.approval.content')"
    v-if="pageStatus === 'approving'"
  >
    <template #footer>
      <n-button @click="handleClick">{{ $t('domain.user.approval.btn') }}</n-button>
    </template>
  </n-result>
  <UserAdditionalInfoUiForm
    ref="formRef"
    v-if="pageStatus === 'visible'"
    :initial-value="formInitialValue"
  ></UserAdditionalInfoUiForm>
  <n-flex v-if="pageStatus === 'visible'">
    <n-button @click="submit" :loading="submitBtnLoading">{{
      $t('common.action.confirm')
    }}</n-button>
  </n-flex>
</template>
