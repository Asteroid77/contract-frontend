import { defineComponent, type PropType } from 'vue'
import ManageUserAdditionalInfoPage from '@/modules/user/presentation/manage/ManageUserAdditionalInfoPage'

export default defineComponent({
  name: 'ManageUserDetailView',
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
    return () => <ManageUserAdditionalInfoPage userId={props.userId} mode={props.mode} />
  },
})
