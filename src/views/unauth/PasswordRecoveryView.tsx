import type { PasswordRecoveryRequest } from '@/modules/user/application/models'
import PasswordRecoveryForm from '@/modules/user/presentation/password/PasswordRecoveryForm'
import { usePassword } from '@/modules/user/application/hooks/usePassword'
import { defineComponent } from 'vue'
export default defineComponent({
  name: 'password-recovery-view',
  setup() {
    const { recoveryBySMS } = usePassword()
    const useRecoveryBySMS = recoveryBySMS()
    const onSubmit = ({
      valid,
      formData,
    }: {
      valid: boolean
      formData: boolean extends true ? PasswordRecoveryRequest : FormInput<PasswordRecoveryRequest>
    }) => {
      if (valid) {
        useRecoveryBySMS.mutate(formData as PasswordRecoveryRequest)
      }
    }
    return () => (
      <template>
        <PasswordRecoveryForm onSubmit={onSubmit}></PasswordRecoveryForm>
      </template>
    )
  },
})
