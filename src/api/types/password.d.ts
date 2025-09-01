export type PasswordRecoveryRequest = {
  // 手机号
  phone: string
  // 新密码
  password: string
  // 验证码
  code: string
  // bizId(发送验证码后，后端传回)
  bizId: string
}

export type PasswordRecoveryInput = PasswordRecoveryRequest & {
  confirmPassword: string
}
export type PasswordRecoveryResponse = ServerResponse<true>
