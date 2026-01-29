import type { ApprovalInstance, ApprovalProcessName } from '@/modules/approval/application/models'
import { match } from 'ts-pattern'
import UserAdditionInfoPrintTemplate from '@/modules/user/presentation/print/UserAdditionInfoPrintTemplate'
import { defineComponent, type PropType } from 'vue'
import SignDiffTemplate from '@/modules/service-agreement/presentation/print/SignDiffTemplate'
import type { ServiceAgreementRequestDTO } from '@/modules/service-agreement/application/models'

export default defineComponent({
  name: 'PrintTemplateSwitch',
  props: {
    name: {
      type: Object as PropType<ApprovalProcessName[keyof ApprovalProcessName]>,
      required: true,
    },
    data: {
      type: Object as PropType<ApprovalInstance<Record<string, unknown>>>,
      required: true,
    },
  },
  setup(props) {
    return () =>
      match(props.name)
        .with('用户信息审批', () => {
          return <UserAdditionInfoPrintTemplate data={props.data}></UserAdditionInfoPrintTemplate>
        })
        .otherwise(() => {
          return (
            <SignDiffTemplate
              data={props.data as ApprovalInstance<ServiceAgreementRequestDTO>}
            ></SignDiffTemplate>
          )
        })
  },
})
