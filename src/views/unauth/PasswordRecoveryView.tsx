import type { PasswordRecoveryForm } from '@/modules/user/application/models'
import PasswordRecoveryUiForm from '@/modules/user/presentation/password/PasswordRecoveryForm'
import { usePasswordRecovery } from '@/modules/user/application/hooks/usePassword'
import { defineComponent } from 'vue'
import { convertUIToPasswordRecoveryForm } from '@/modules/user/application/ui-mappers'

export default defineComponent({
  name: 'password-recovery-view',
  setup() {
    const recoveryMutation = usePasswordRecovery()
    const onSubmit = (formData: PasswordRecoveryForm) => {
      const submitData = convertUIToPasswordRecoveryForm(formData)
      recoveryMutation.mutate(submitData)
    }
    return () => (
      <div>
        <PasswordRecoveryUiForm onSubmit={onSubmit}></PasswordRecoveryUiForm>
      </div>
    )
  },
})
