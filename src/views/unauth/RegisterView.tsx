import RegisterForm from '@/modules/user/presentation/register/RegisterForm'
import { useRegister } from '@/modules/user/application/hooks/useRegister'
import type { RegisterRequest } from '@/modules/user/application/models'
import { defineComponent } from 'vue'
export default defineComponent({
  name: 'register-view',
  setup() {
    const register = useRegister()
    const onSubmit = ({
      valid,
      formData,
    }: {
      valid: boolean
      formData: boolean extends true ? RegisterRequest : FormInput<RegisterRequest>
    }) => {
      if (valid) {
        register.mutate(formData as RegisterRequest)
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
