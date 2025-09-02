import RegisterForm from '@/components/register/RegisterForm'
import { useRegister } from '@/hooks/account/useRegister'
import type { RegisterRequest } from '@/types/account'
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
      <template>
        <RegisterForm
          isSubmitBtnLoading={register.isPending.value}
          onSubmit={onSubmit}
        ></RegisterForm>
      </template>
    )
  },
})
