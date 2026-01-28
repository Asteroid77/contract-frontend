import type { ApprovalInstance, ApprovalProcessName } from '@/components/approval/api/approval'
import { match } from 'ts-pattern'
import UserAdditionInfoPrintTemplate from '@/components/user_additional_info/print/UserAdditionInfoPrintTemplate'
import { defineComponent, type PropType } from 'vue'
import SignDiffTemplate from '@/components/sign/print/SignDiffTemplate'

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
          return <SignDiffTemplate data={props.data}></SignDiffTemplate>
        })
  },
})
