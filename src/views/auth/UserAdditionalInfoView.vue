<script setup lang="ts">
import UserAdditionalInfoUiForm, {
  type UserAdditionalInfoFormExpose,
} from '@/modules/user/presentation/user_additional_info/UserAdditionalInfoForm'
import { computed, ref, useTemplateRef, type Ref, watch } from 'vue'
import { NFlex, NButton, NSkeleton, NCard } from 'naive-ui'
import { useI18n } from 'vue-i18n'
import type { UserAdditionalInfoForm } from '@/modules/user/application/models'
import { useUserAdditionalInfoRequest } from '@/modules/user/application/hooks/useUserAdditionalInfoRequest'
import { useLatestAdditionalInfoInstanceStatus } from '@/modules/approval/application/hooks/useApprovalService'
import { useRouter } from 'vue-router'
import { useAccountStore } from '@/modules/user/application/stores/useAccountStore'
import { useLoadUserInfo } from '@/modules/user/application/hooks/useLoadUserInfo'
import { convertUIToUserAdditionalInfoForm } from '@/modules/user/application/ui-mappers'

const formRef: Ref<UserAdditionalInfoFormExpose | null> =
  useTemplateRef<UserAdditionalInfoFormExpose>('formRef')
const { t: $t } = useI18n()
const router = useRouter()
const account = useAccountStore()
const status = useLatestAdditionalInfoInstanceStatus()
const loadUserInfo = useLoadUserInfo(() => account.token)
const formRenderKey = ref(0)

const req = useUserAdditionalInfoRequest((data) => {
  formRenderKey.value += 1
  loadUserInfo.refetch()

  router.push({
    name: 'user-additional-info-pending',
    query: {
      instanceId: data.id,
    },
  })
})

const formInitialValue = computed<FormInput<UserAdditionalInfoForm> | undefined>(() => {
  const profile = loadUserInfo.data.value?.profile ?? account.profile
  return (profile ?? undefined) as FormInput<UserAdditionalInfoForm> | undefined
})

const pageStatus = computed<'loading' | 'visible' | 'approving'>(() => {
  if (!status.data.value || loadUserInfo.isLoading.value) {
    return 'loading'
  }

  if (['rejected', 'approved', 'canceled'].includes(status.data.value.status)) {
    return 'visible'
  }

  return 'approving'
})

const submitBtnLoading = computed(() => req.isPending.value)

watch(
  pageStatus,
  (statusValue) => {
    if (statusValue !== 'approving') {
      return
    }

    router.replace({
      name: 'user-additional-info-pending',
      query: {
        instanceId: status.data.value?.id,
      },
    })
  },
  { immediate: true },
)

const submit = () => {
  if (!formRef.value) return

  const formInstance = formRef.value.getFormInstance()
  if (!formInstance.validate) return

  formInstance.validate((errors) => {
    if (errors?.length) return

    const formData = formInstance.values as FormInput<UserAdditionalInfoForm>
    const submitData = convertUIToUserAdditionalInfoForm(formData as UserAdditionalInfoForm)
    req.mutate(submitData)
  })
}

const handleBack = () => {
  router.push({ name: 'user-profile' })
}

const handleSave = () => {
  submit()
}
</script>

<template>
  <n-flex vertical :size="16" class="max-w-4xl">
    <div class="text-2xl font-bold text-[var(--color-text-main)]">
      {{ $t('layout.menu.additional') }}
    </div>

    <n-card class="notion-card" :title="$t('layout.profile.baseInformation')" :bordered="false">
      <n-flex vertical :size="12">
        <n-flex vertical v-if="pageStatus === 'loading' || pageStatus === 'approving'">
          <n-skeleton :repeat="8" height="30px" width="80%" />
        </n-flex>

        <template v-else>
          <UserAdditionalInfoUiForm
            :key="formRenderKey"
            ref="formRef"
            :initial-value="formInitialValue"
            type="edit"
          />

          <n-flex :size="12">
            <n-button type="primary" @click="handleSave" :loading="submitBtnLoading">
              {{ $t('common.action.save') }}
            </n-button>
            <n-button @click="handleBack" :disabled="submitBtnLoading">
              {{ $t('common.action.back') }}
            </n-button>
          </n-flex>
        </template>
      </n-flex>
    </n-card>
  </n-flex>
</template>
