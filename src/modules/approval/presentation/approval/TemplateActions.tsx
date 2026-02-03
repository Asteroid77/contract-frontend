import { dialog } from '@/_utils/discrete_naive_api'
import { $t } from '@/_utils/i18n'
import type { ApprovalInstance, ApprovalOpinionForm } from '@/modules/approval/application/models'
import {
  useCancelApprovalInstance,
  useClaimTask,
  useHandleTask,
} from '@/modules/approval/application/hooks/useApprovalService'
import {
  NButton,
  NForm,
  NFormItem,
  NInput,
  NPopconfirm,
  NRadio,
  NRadioGroup,
  NSpace,
} from 'naive-ui'
import type { FormInst } from 'naive-ui/lib'
import type { Ref } from 'vue'
import { computed, defineComponent, ref, type PropType } from 'vue'
import { approvalOpinionRequestRule } from '@/modules/approval/application/validation'
import { useRouter } from 'vue-router'
import { isApproveBtnVisible, isCancelAccessible, isClaimBtnVisible } from '@/modules/approval/application/utils'
import { useAccountStore } from '@/modules/user/application/stores/useAccountStore'
import { usePrint } from '@/modules/approval/application/hooks/usePrint'
export default defineComponent({
  name: 'template-actions',
  props: {
    data: Object as PropType<ApprovalInstance<Record<string, unknown>>>,
  },
  setup(props) {
    const router = useRouter()
    const handleTask = useHandleTask()
    const cancelInstance = useCancelApprovalInstance()
    const account = useAccountStore()
    const claimMutation = useClaimTask()
    const formRule = approvalOpinionRequestRule()
    const { print } = usePrint()
    const isCancelAccess = computed(() => {
      return isCancelAccessible(
        props.data?.status,
        props.data?.applicantId,
        account.profile?.userId,
      )
    })
    const isApprovalBtnAccess = computed(() => {
      return isApproveBtnVisible(props.data?.status)
    })
    const isClaimBtnAccess = computed(() => {
      return isClaimBtnVisible(props.data?.taskStatus, props.data?.status)
    })
    const approveBtnClick = () => {
      const approvalOptionFormRef: Ref<FormInst | null> = ref<FormInst | null>(null)
      const approvalOptionData = ref<FormInput<ApprovalOpinionForm>>({
        taskId: props.data?.taskId,
      })
      approvalOptionData.value = {
        taskId: props.data?.taskId,
        approved: undefined,
        comment: '',
      }
      dialog.create({
        title: $t('domain.approval.section.opinion'),
        positiveText: $t('common.action.submit'),
        negativeText: $t('common.action.cancel'),
        maskClosable: true,
        onPositiveClick: () => {
          approvalOptionFormRef.value?.validate((errors) => {
            if (!errors?.length) {
              handleTask.mutate(approvalOptionData.value as ApprovalOpinionForm)
            }
          })
        },
        content: () => (
          <NForm ref={approvalOptionFormRef} rules={formRule} model={approvalOptionData.value}>
            <NFormItem>
              <NRadioGroup v-model:value={approvalOptionData.value.approved} name="radiogroup">
                <NSpace>
                  <NRadio value={true}>{$t('domain.approval.action.pass')}</NRadio>
                  <NRadio value={false}>{$t('domain.approval.action.reject')}</NRadio>
                </NSpace>
              </NRadioGroup>
            </NFormItem>
            <NFormItem label={$t('domain.approval.section.opinion')}>
              <NInput
                v-model:value={approvalOptionData.value.comment}
                type={'textarea'}
                maxlength="300"
                show-count
              ></NInput>
            </NFormItem>
          </NForm>
        ),
      })
    }
    const returnBtnClick = () => {
      router.go(-1)
    }
    const cancelBtnClick = () => {
      cancelInstance.mutate(props.data?.id as number)
    }
    const claimBtnClick = () => {
      if (props.data?.taskId) {
        claimMutation.mutate(props.data?.taskId)
      }
    }
    const printBtnClick = () => {
      print('printable-approval-area')
    }
    return () => (
      <NSpace reverse justify={'center'}>
        {isClaimBtnAccess.value && (
          <NPopconfirm
            onPositiveClick={() => claimBtnClick()}
            v-slots={{
              trigger: () => <NButton type="info">{$t('common.action.claim')}</NButton>,
              default: () => $t('domain.approval.message.claimConfirm', { id: props.data?.taskId }),
            }}
          />
        )}
        {isApprovalBtnAccess.value && (
          <NButton type="info" onClick={approveBtnClick}>
            {$t('common.action.approve')}
          </NButton>
        )}
        <NButton type="primary" onClick={printBtnClick}>
          {$t('common.action.print')}
        </NButton>
        {isCancelAccess.value && (
          <NPopconfirm
            onPositiveClick={cancelBtnClick}
            positiveText={$t('common.action.confirm')}
            negativeText={$t('common.action.cancel')}
            v-slots={{
              trigger: () => <NButton type="error">{$t('common.action.cancel')}</NButton>,
            }}
          >
            {$t('domain.approval.message.cancelConfirm')}
          </NPopconfirm>
        )}
        <NButton type="warning" onClick={returnBtnClick}>
          {$t('common.action.back')}
        </NButton>
      </NSpace>
    )
  },
})
