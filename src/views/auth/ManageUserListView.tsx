import { defineComponent } from 'vue'
import ManageUserListPage from '@/modules/user/presentation/manage/UserListPage'

export default defineComponent({
  name: 'ManageUserListView',
  setup() {
    return () => <ManageUserListPage />
  },
})
