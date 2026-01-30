import type {
  PasswordRecoveryRequest,
  RegisterRequest,
  SignInRequest,
  UserAdditionalInfoRequest,
} from './models'

/**
 * 创建登录表单的初始 UI 模型
 * 确保所有字段都有默认值，避免 controlled/uncontrolled 切换警告
 */
export const createSignInModel = (initialPartial: Partial<SignInRequest> = {}): SignInRequest => {
  return {
    phone: initialPartial.phone ?? '',
    password: initialPartial.password ?? '',
    captcha: initialPartial.captcha ?? '',
    captchaKey: initialPartial.captchaKey ?? '',
    remember: initialPartial.remember ?? false,
  }
}

/**
 * 将 UI 模型转换为提交给 Service 的请求对象
 * 在这里进行最后的数据清洗（如 trim）
 */
export const convertUIToSignInRequest = (uiModel: SignInRequest): SignInRequest => {
  // 对于登录，通常需要 trim 手机号和验证码，密码一般不 trim（虽然用户可能无意输入空格）
  // 这里做简单的 trim
  const request: SignInRequest = {
    phone: uiModel.phone?.trim(),
    password: uiModel.password, // 密码保留原始输入
    captcha: uiModel.captcha?.trim(),
    captchaKey: uiModel.captchaKey,
    remember: uiModel.remember,
  }

  // 如果需要更严格的清洗（例如移除空值），可以使用 pruneEmpty
  // 但登录接口通常字段都是必填的，null/undefined 会在 validation 阶段拦截
  return request
}

export const convertUIToRegisterRequest = (uiModel: RegisterRequest): RegisterRequest => {
  return {
    phone: uiModel.phone?.trim(),
    password: uiModel.password,
    code: uiModel.code?.trim(),
    bizId: uiModel.bizId,
    dbCheckPassword: uiModel.dbCheckPassword,
  }
}

export const convertUIToPasswordRecoveryRequest = (
  uiModel: PasswordRecoveryRequest,
): PasswordRecoveryRequest => {
  return {
    phone: uiModel.phone?.trim(),
    password: uiModel.password,
    dbCheckPassword: uiModel.dbCheckPassword,
    code: uiModel.code?.trim(),
    bizId: uiModel.bizId,
  }
}

export const convertUIToUserAdditionalInfoRequest = (
  uiModel: UserAdditionalInfoRequest,
): UserAdditionalInfoRequest => {
  return {
    // 必填项，不做空检查，交给 Validation 处理
    registerType: uiModel.registerType,
    name: uiModel.name?.trim(),
    pca: uiModel.pca,
    identity: uiModel.identity?.trim(),
    bankName: uiModel.bankName?.trim(),
    bankAccount: uiModel.bankAccount?.trim(),

    // 选填项，如果为空字符串则转为 undefined，或者保留空字符串视后端处理逻辑而定
    // 这里采用 safe trim 策略
    id: uiModel.id,
    userId: uiModel.userId,
    invitationCode: uiModel.invitationCode?.trim(),
    companyAddress: uiModel.companyAddress?.trim(),
    contactPerson: uiModel.contactPerson?.trim(),
    contactPersonPhone: uiModel.contactPersonPhone?.trim(),
    referrer: uiModel.referrer,
  }
}
