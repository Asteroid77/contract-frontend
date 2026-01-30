import RegisterForm from '@/modules/user/presentation/register/RegisterForm'
import { useRegister } from '@/modules/user/application/hooks/useRegister'
import type { RegisterRequest } from '@/modules/user/application/models'
import { defineComponent } from 'vue'
import { convertUIToRegisterRequest } from '@/modules/user/application/ui-mappers'

export default defineComponent({
  name: 'register-view',
  setup() {
    const register = useRegister()
    const onSubmit = (formData: RegisterRequest) => {
      const submitData = convertUIToRegisterRequest(formData)
      register.mutate(submitData)
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
