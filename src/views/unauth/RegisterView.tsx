import RegisterForm from '@/modules/user/presentation/register/RegisterForm'
import { useRegister } from '@/modules/user/application/hooks/useRegister'
import type { RegisterRequest } from '@/modules/user/application/models'
import { defineComponent } from 'vue'
import { buildSubmitData } from '@/modules/shared/application/form'
export default defineComponent({
  name: 'register-view',
  setup() {
    const register = useRegister()
    const onSubmit = ({
      valid,
      formData,
      requiredKeys,
    }: {
      valid: boolean
      formData: boolean extends true ? RegisterRequest : FormInput<RegisterRequest>
      requiredKeys: readonly (keyof RegisterRequest)[]
    }) => {
      if (valid) {
        const submitData = buildSubmitData<RegisterRequest>(formData, requiredKeys)
        if (!submitData) return
        register.mutate(submitData)
      }
    }
    return () => (
      <div>
        <RegisterForm
          isSubmitBtnLoading={register.isPending.value}
          onSubmit={onSubmit}
        ></RegisterForm>
      </div>
    )
  },
})
