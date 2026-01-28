<script setup lang="ts">
import UserAdditionalInfoForm, {
  type UserAdditionalInfoFormExpose,
} from '@/components/user_additional_info/UserAdditionalInfoForm'
import { computed, useTemplateRef } from 'vue'
import { NFlex, NButton, NSkeleton, NResult } from 'naive-ui'
import { $t } from '@/_utils/i18n'
import type { Ref } from 'vue'
import type { UserAdditionalInfoRequest } from '@/types/account'
import { useUserAdditionalInfoRequest } from '@/hooks/account/useUserAdditionalInfoRequest'
import { useLatestAdditionalInfoInstanceStatus } from '@/hooks/approval/useApprovalService'
import { useRouter } from 'vue-router'
import { useAccountStore } from '@/stores/useAccountStore'
import { useLoadUserInfo } from '@/hooks/account/useLoadUserInfo'
const $form: Ref<UserAdditionalInfoFormExpose | null> =
  useTemplateRef<UserAdditionalInfoFormExpose>('formRef')
const req = useUserAdditionalInfoRequest(() => {})
const status = useLatestAdditionalInfoInstanceStatus()
const router = useRouter()
const account = useAccountStore()
const loadUserInfo = useLoadUserInfo(account.token as string)
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
    :title="$t('account.additionalInfo.approval.title')"
    :description="$t('account.additionalInfo.approval.content')"
    v-if="pageStatus === 'approving'"
  >
    <template #footer>
      <n-button @click="handleClick">{{ $t('account.additionalInfo.approval.btnText') }}</n-button>
    </template>
  </n-result>
  <UserAdditionalInfoForm
    ref="formRef"
    v-if="pageStatus === 'visible'"
    :initial-value="loadUserInfo.data.value?.profile"
  ></UserAdditionalInfoForm>
  <n-flex v-if="pageStatus === 'visible'">
    <n-button @click="submit" :loading="submitBtnLoading">{{ $t('actions.confirm') }}</n-button>
  </n-flex>
</template>
