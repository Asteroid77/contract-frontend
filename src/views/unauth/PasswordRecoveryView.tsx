import type { PasswordRecoveryRequest } from '@/modules/user/application/models'
import PasswordRecoveryForm from '@/modules/user/presentation/password/PasswordRecoveryForm'
import { usePassword } from '@/modules/user/application/hooks/usePassword'
import { defineComponent } from 'vue'
import { buildSubmitData } from '@/modules/shared/application/form'
export default defineComponent({
  name: 'password-recovery-view',
  setup() {
    const { recoveryBySMS } = usePassword()
    const useRecoveryBySMS = recoveryBySMS()
    const onSubmit = ({
      valid,
      formData,
      requiredKeys,
    }: {
      valid: boolean
      formData: boolean extends true ? PasswordRecoveryRequest : FormInput<PasswordRecoveryRequest>
      requiredKeys: readonly (keyof PasswordRecoveryRequest)[]
    }) => {
      if (valid) {
        const submitData = buildSubmitData<PasswordRecoveryRequest>(formData, requiredKeys)
        if (!submitData) return
        useRecoveryBySMS.mutate(submitData)
      }
    }
    return () => (
      <div>
        <PasswordRecoveryForm onSubmit={onSubmit}></PasswordRecoveryForm>
      </div>
    )
  },
})
