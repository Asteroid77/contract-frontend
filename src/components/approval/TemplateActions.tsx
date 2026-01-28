import { dialog } from '@/_utils/discrete_naive_api'
import { $t } from '@/_utils/i18n'
import type { ApprovalInstance, ApprovalOpinionRequest } from '@/components/approval/api/approval'
import {
  useCancelApprovalInstance,
  useClaimTask,
  useHandleTask,
} from '@/hooks/approval/useApprovalService'
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
import { approvalOpinionRequestRule } from './rules'
import { useRouter } from 'vue-router'
import { isApproveBtnVisible, isCancelAccessible, isClaimBtnVisible } from './utils'
import { useAccountStore } from '@/stores/useAccountStore'
import { usePrint } from './hook/usePrint'
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
      const approvalOptionData = ref<FormInput<ApprovalOpinionRequest>>({
        taskId: props.data?.taskId,
      })
      approvalOptionData.value = {
        taskId: props.data?.taskId,
        approved: undefined,
        comment: '',
      }
      dialog.create({
        title: $t('approval.handleTask.title'),
        positiveText: $t('actions.submit'),
        negativeText: $t('actions.cancel'),
        maskClosable: true,
        onPositiveClick: () => {
          approvalOptionFormRef.value?.validate((errors) => {
            if (!errors?.length) {
              handleTask.mutate(approvalOptionData.value as ApprovalOpinionRequest)
            }
          })
        },
        content: () => (
          <NForm ref={approvalOptionFormRef} rules={formRule} model={approvalOptionData.value}>
            <NFormItem>
              <NRadioGroup v-model:value={approvalOptionData.value.approved} name="radiogroup">
                <NSpace>
                  <NRadio value={true}>{$t('approval.handleTask.pass')}</NRadio>
                  <NRadio value={false}>{$t('approval.handleTask.reject')}</NRadio>
                </NSpace>
              </NRadioGroup>
            </NFormItem>
            <NFormItem label={$t('approval.handleTask.title')}>
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
              trigger: () => <NButton type="info">{$t('actions.claim')}</NButton>,
              default: () => $t('approval.claim.confirm', { id: props.data?.taskId }),
            }}
          />
        )}
        {isApprovalBtnAccess.value && (
          <NButton type="info" onClick={approveBtnClick}>
            {$t('actions.approve')}
          </NButton>
        )}
        <NButton type="primary" onClick={printBtnClick}>
          {$t('actions.print')}
        </NButton>
        {isCancelAccess.value && (
          <NPopconfirm
            onPositiveClick={cancelBtnClick}
            positiveText={$t('actions.confirm')}
            negativeText={$t('actions.cancel')}
            v-slots={{
              trigger: () => <NButton type="error">{$t('actions.cancel')}</NButton>,
            }}
          >
            {$t('approval.handleTask.cancel')}
          </NPopconfirm>
        )}
        <NButton type="warning" onClick={returnBtnClick}>
          {$t('actions.return')}
        </NButton>
      </NSpace>
    )
  },
})
