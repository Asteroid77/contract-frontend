import type { ApprovalInstance } from '@/modules/approval/application/models'
import { match } from 'ts-pattern'
import { defineComponent } from 'vue'
import type { PropType } from 'vue'
import SignDiffTemplate from '@/modules/service-agreement/presentation/print/SignDiffTemplate'
import UserAdditionInfoPrintTemplate from '@/modules/user/presentation/print/UserAdditionInfoPrintTemplate'
import '@/modules/approval/presentation/print/style/PrintCore.css'
import type { ServiceAgreementRequestDTO } from '@/modules/service-agreement/application/models'
export const templateSwitch = defineComponent({
  props: {
    name: { type: String, required: true },
    data: { type: Object as PropType<ApprovalInstance<Record<string, unknown>>>, required: true },
  },
  setup(props) {
    return () => {
      return match(props.name)
        .with('用户信息审批', () => {
          return <UserAdditionInfoPrintTemplate data={props.data} />
        })
        .otherwise(() => {
          return (
            <>
              <SignDiffTemplate
                data={props.data as ApprovalInstance<ServiceAgreementRequestDTO>}
              ></SignDiffTemplate>
            </>
          )
        })
    }
  },
})
