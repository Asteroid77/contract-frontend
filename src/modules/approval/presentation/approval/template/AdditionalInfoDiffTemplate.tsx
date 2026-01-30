import { $t } from '@/_utils/i18n'
import type { ApprovalInstance } from '@/modules/approval/application/models'
import UserAdditionalInfoForm from '@/modules/user/presentation/user_additional_info/UserAdditionalInfoForm'
import type { UserAdditionalInfo } from '@/modules/user/application/models'
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
    const sourceData = props.data.sourceData
    return () => (
      <>
        {!sourceData && (
          <UserAdditionalInfoForm
            initialValue={approvalData}
            type={'detail'}
          ></UserAdditionalInfoForm>
        )}
        {sourceData && (
          <NSplit
            direction={'horizontal'}
            v-slots={{
              '1': () => (
                <NCard title={$t('domain.approval.label.newData')}>
                  <UserAdditionalInfoForm
                    initialValue={approvalData}
                    type={'detail'}
                  ></UserAdditionalInfoForm>
                </NCard>
              ),
              '2': () => (
                <NCard title={$t('domain.approval.label.oldData')}>
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
