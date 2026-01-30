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
    const onSubmit = ({
      valid,
      formData,
    }: {
      valid: boolean
      formData: FormInput<RegisterRequest>
    }) => {
      // 临时兼容：RegisterForm 还没改，所以它还是由 emit 复杂对象
      // 但我们需要在这里做转换。
      // 等等，用户之前重构 LoginForm 是改了子组件的。
      // 我也应该修改 RegisterForm 的 emit 行为，使其跟 LoginForm 一致。
    }
        ></RegisterForm>
      </div>
    )
  },
})
