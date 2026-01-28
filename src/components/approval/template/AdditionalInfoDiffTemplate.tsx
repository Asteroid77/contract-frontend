import { $t } from '@/_utils/i18n'
import type { ApprovalInstance } from '@/components/approval/api/approval'
import UserAdditionalInfoForm from '@/components/user_additional_info/UserAdditionalInfoForm'
import type { UserAdditionalInfo } from '@/types/account'
import { NCard, NSplit } from 'naive-ui'
import { defineComponent, type PropType } from 'vue'

export default defineComponent({
  name: 'user-additional-info-diff-template',
  props: {
    data: {
      type: Object as PropType<ApprovalInstance<UserAdditionalInfo>>,
      required: true,
    },
  },
  setup(props) {
    const approvalData: UserAdditionalInfo = props.data.approvalData
    const sourceData: UserAdditionalInfo = props.data.sourceData
    return () => (
      <>
        {!props.data.sourceData && (
          <UserAdditionalInfoForm
            initialValue={approvalData}
            type={'detail'}
          ></UserAdditionalInfoForm>
        )}
        {props.data.sourceData && (
          <NSplit
            direction={'horizontal'}
            v-slots={{
              '1': () => (
                <NCard title={$t('approval.template.new')}>
                  <UserAdditionalInfoForm
                    initialValue={approvalData}
                    type={'detail'}
                  ></UserAdditionalInfoForm>
                </NCard>
              ),
              '2': () => (
                <NCard title={$t('approval.template.old')}>
                  <UserAdditionalInfoForm
                    initialValue={sourceData}
                    type={'detail'}
                  ></UserAdditionalInfoForm>
                </NCard>
              ),
            }}
          ></NSplit>
        )}
      </>
    )
  },
})
