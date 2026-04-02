import { defineComponent, computed, type PropType, useTemplateRef, type Ref } from 'vue'
import { NButton, NCard, NFlex, NResult, NSkeleton } from 'naive-ui'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useMutation, useQueryClient } from '@tanstack/vue-query'
import UserAdditionalInfoUiForm, {
  type UserAdditionalInfoFormExpose,
} from '@/modules/user/presentation/user_additional_info/UserAdditionalInfoForm'
import type { UserAdditionalInfoForm } from '@/modules/user/application/models'
import { useUserInfoById, userQueryKeys } from '@/modules/user/application/hooks/useUserPage'
import { convertUIToUserAdditionalInfoForm } from '@/modules/user/application/ui-mappers'
import { userService } from '@/modules/user/application/service'
import { usePermission } from '@/modules/access/application/hooks/useCan'

export default defineComponent({
  name: 'ManageUserAdditionalInfoPage',
  props: {
    userId: {
      type: Number as PropType<number | null>,
      required: false,
      default: null,
    },
    mode: {
      type: String as PropType<'edit' | 'detail'>,
      required: true,
    },
  },
  setup(props) {
    const { t: $t } = useI18n()
    const router = useRouter()
    const queryClient = useQueryClient()
    const formRef: Ref<UserAdditionalInfoFormExpose | null> =
      useTemplateRef<UserAdditionalInfoFormExpose>('formRef')

    const canView = usePermission('read', 'User')
    const canEdit = usePermission('update', 'User')

    const currentUserId = computed(() => props.userId ?? null)
    const userInfoQuery = useUserInfoById(currentUserId)

    const formInitialValue = computed<FormInput<UserAdditionalInfoForm> | undefined>(() => {
      if (!userInfoQuery.data.value) return undefined
      return {
        ...userInfoQuery.data.value,
        userId: currentUserId.value ?? userInfoQuery.data.value.userId,
      } as FormInput<UserAdditionalInfoForm>
    })

    const isDetailMode = computed(() => props.mode === 'detail')
    const canGoEdit = computed(() => isDetailMode.value && canEdit.value)
    const canSubmit = computed(() => !isDetailMode.value && canEdit.value)

    const updateMutation = useMutation({
      mutationFn: (form: UserAdditionalInfoForm) => userService.additionalInfoRequest(form),
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: userQueryKeys.lists() })
        if (currentUserId.value) {
          await queryClient.invalidateQueries({
            queryKey: userQueryKeys.detail(currentUserId.value),
          })
          await router.replace({
            name: 'manage-user-detail',
            params: { userId: currentUserId.value },
          })
        }
      },
    })

    const handleBack = () => {
      router.push({ name: 'manage-user-list' })
    }

    const handleGoEdit = () => {
      if (!currentUserId.value) return
      router.push({
        name: 'manage-user-edit',
        params: { userId: currentUserId.value },
      })
    }

    const handleSave = () => {
      if (!canSubmit.value || !formRef.value) return

      const formInstance = formRef.value.getFormInstance()
      if (!formInstance.validate) return

      formInstance.validate((errors) => {
        if (errors?.length) return

        const formData = formInstance.values as FormInput<UserAdditionalInfoForm>
        const submitData = convertUIToUserAdditionalInfoForm(formData as UserAdditionalInfoForm)
        submitData.userId = currentUserId.value ?? submitData.userId
        updateMutation.mutate(submitData)
      })
    }

    return () => (
      <NFlex vertical size={16} class="max-w-4xl">
        <div class="text-2xl font-bold text-[var(--color-text-main)]">
          {$t('layout.menu.users')}
        </div>

        {!currentUserId.value && (
          <NResult
            status="error"
            title={$t('common.error.invalidParams')}
            description={$t('common.error.pageLoadMeta')}
          />
        )}

        {currentUserId.value && !canView.value && (
          <NResult
            status="403"
            title={$t('common.error.403')}
            description={$t('common.error.403Desc')}
          />
        )}

        {currentUserId.value && canView.value && (
          <NCard bordered={false} class="notion-card" title={$t('layout.profile.baseInformation')}>
            <NFlex vertical size={12}>
              {userInfoQuery.isLoading.value && (
                <NFlex vertical>
                  <NSkeleton repeat={8} height="30px" width="80%" />
                </NFlex>
              )}

              {userInfoQuery.isError.value && (
                <NResult
                  status="error"
                  title={$t('common.error.title')}
                  description={$t('common.error.server')}
                />
              )}

              {!userInfoQuery.isLoading.value && !userInfoQuery.isError.value && (
                <>
                  <UserAdditionalInfoUiForm
                    ref="formRef"
                    initialValue={formInitialValue.value}
                    type={isDetailMode.value ? 'detail' : 'edit'}
                  />
                  <NFlex size={12}>
                    {canSubmit.value && (
                      <NButton
                        type="primary"
                        loading={updateMutation.isPending.value}
                        onClick={handleSave}
                      >
                        {$t('common.action.save')}
                      </NButton>
                    )}
                    {canGoEdit.value && (
                      <NButton type="primary" onClick={handleGoEdit}>
                        {$t('common.action.edit')}
                      </NButton>
                    )}
                    <NButton onClick={handleBack} disabled={updateMutation.isPending.value}>
                      {$t('common.action.back')}
                    </NButton>
                  </NFlex>
                </>
              )}
            </NFlex>
          </NCard>
        )}
      </NFlex>
    )
  },
})
