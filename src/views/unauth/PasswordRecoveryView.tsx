import type { PasswordRecoveryRequest } from '@/modules/user/application/models'
import PasswordRecoveryForm from '@/modules/user/presentation/password/PasswordRecoveryForm'
import { usePassword } from '@/modules/user/application/hooks/usePassword'
import { defineComponent } from 'vue'
import { convertUIToPasswordRecoveryRequest } from '@/modules/user/application/ui-mappers'

export default defineComponent({
  name: 'password-recovery-view',
  setup() {
    const { recoveryBySMS } = usePassword()
    const useRecoveryBySMS = recoveryBySMS()
    const onSubmit = (formData: PasswordRecoveryRequest) => {
      const submitData = convertUIToPasswordRecoveryRequest(formData)
      useRecoveryBySMS.mutate(submitData)
    }
    return () => (
      <div>
        <PasswordRecoveryForm onSubmit={onSubmit}></PasswordRecoveryForm>
      </div>
    )
  },
})
