import RegisterUiForm from '@/modules/user/presentation/register/RegisterForm'
import { useRegister } from '@/modules/user/application/hooks/useRegister'
import type { RegisterForm } from '@/modules/user/application/models'
import { defineComponent } from 'vue'
import { convertUIToRegisterForm } from '@/modules/user/application/ui-mappers'

export default defineComponent({
  name: 'register-view',
  setup() {
    const register = useRegister()
    const onSubmit = (formData: RegisterForm) => {
      const submitData = convertUIToRegisterForm(formData)
      register.mutate(submitData)
    }
    return () => (
      <div>
        <RegisterUiForm
          isSubmitBtnLoading={register.isPending.value}
          onSubmit={onSubmit}
        ></RegisterUiForm>
      </div>
    )
  },
})
