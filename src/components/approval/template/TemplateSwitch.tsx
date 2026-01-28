import type { ApprovalInstance } from '@/components/approval/api/approval'
import { match } from 'ts-pattern'
import { defineComponent } from 'vue'
import type { PropType } from 'vue'
import SignDiffTemplate from '@/components/sign/print/SignDiffTemplate'
import UserAdditionInfoPrintTemplate from '@/components/user_additional_info/print/UserAdditionInfoPrintTemplate'
import '@/components/approval/print/style/PrintCore.css'
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
              <SignDiffTemplate data={props.data}></SignDiffTemplate>
            </>
          )
        })
    }
  },
})
