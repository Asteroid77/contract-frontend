import type { PasswordRecoveryRequest } from '@/api/types/password'
import PasswordRecoveryForm from '@/components/password/PasswordRecoveryForm'
import { usePassword } from '@/hooks/account/usePassword'
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
