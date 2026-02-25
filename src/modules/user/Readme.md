# User 模块

用户账户生命周期模块，负责注册、登录（含 OAuth2 第三方登录）、TOTP 两步验证、密码管理、设备会话管理、用户附加信息提交，以及后台用户分页查询。

## 目录结构

```
user/
├── domain/                    # 领域层
│   ├── types.ts               # 核心类型（User, UserInfoVo, UserPageVo, OAuth2ExchangeVo, TOTP VO）
│   ├── dto.ts                 # 请求 DTO（登录、注册、改密、TOTP、设备撤销等）
│   ├── repositories.ts        # 仓储接口（IUserRepository, ITotpRepository）
│   └── enums.ts               # RegisterType（个人/法人）、PlatformEnum（NATIVE/GITHUB/WECHAT）
├── application/               # 应用层
│   ├── service.ts             # UserService，封装用户核心操作，导出单例 userService
│   ├── totp-service.ts        # TotpService，封装 TOTP 两步验证流程，导出单例 totpService
│   ├── models.ts              # 视图模型（SignInForm, SignInResponse, UserPageItem 等）
│   ├── mappers.ts             # domain ↔ view 双向映射
│   ├── ui-mappers.ts          # UI 专用映射（展示格式化）
│   ├── validation.ts          # 用户附加信息表单校验规则
│   ├── constants.ts           # RegisterType 常量与选项
│   ├── utils/platform.ts      # 平台判断工具
│   ├── stores/
│   │   └── useAccountStore.ts # Pinia store：登录态、token、角色、权限管理
│   └── hooks/
│       ├── useLogin.ts        # 登录流程 hook
│       ├── useRegister.ts     # 注册流程 hook
│       ├── usePassword.ts     # 密码相关 hook
│       ├── useChangePassword.ts
│       ├── useLoadUserInfo.ts # 加载当前用户信息
│       ├── useUserPage.ts     # 用户分页查询 hook
│       ├── useUserDevices.ts  # 设备会话管理 hook
│       ├── useOauth2AuthorizationUrl.ts
│       ├── useTotpVerify.ts   # TOTP 验证 hook
│       └── useTotpManagement.ts # TOTP 启用/禁用管理
├── infrastructure/            # 基础设施层
│   ├── user-repository.ts     # IUserRepository 实现
│   ├── totp-repository.ts     # ITotpRepository 实现
│   ├── user-endpoints.ts      # /user/* API 路径常量
│   ├── oauth-endpoints.ts     # OAuth2 API 路径常量
│   └── totp-endpoints.ts      # TOTP API 路径常量
└── presentation/              # 展示层
    ├── login/LoginForm.tsx                          # 登录表单
    ├── register/RegisterForm.tsx                    # 注册表单
    ├── password/PasswordRecoveryForm.tsx             # 忘记密码/密码找回
    ├── manage/
    │   ├── UserListPage.tsx                         # 后台用户列表（分页、高级查询）
    │   └── ManageUserAdditionalInfoPage.tsx         # 后台用户详情管理
    ├── user_additional_info/UserAdditionalInfoForm.tsx  # 用户附加信息提交表单
    └── print/UserAdditionInfoPrintTemplate.tsx      # 用户附加信息打印模板
```

## 主要能力

### 认证与登录

`UserService.login()` 处理手机号+密码登录，返回联合类型 `SignInResponse`。当后端要求两步验证时返回 `SignInResponseTwoFactor`（含 `twoFactorToken`），否则返回完整用户信息。

OAuth2 第三方登录通过 `exchangeOAuth2Code()` 完成授权码交换。

### TOTP 两步验证

`TotpService` 提供完整的 TOTP 生命周期：查询状态、生成密钥（含二维码 URI 和备份码）、启用、禁用、验证、重新生成备份码。

### 账户状态管理

`useAccountStore`（Pinia）是全局登录态的唯一入口，管理：

- token / refreshToken 持久化与同步
- 用户基本信息与附加信息
- 角色列表与权限列表（联动 CASL ability）
- 登出流程（含超时兜底）

### 用户附加信息

用户注册后需补充附加信息（姓名/公司名、银行账户、身份证/统一社会信用代码等），提交后走审批流程（`ApprovalInstance`）。校验规则根据 `RegisterType`（个人/法人）动态调整必填项。

### 设备会话

`listCurrentUserDevices()` 列出当前用户的活跃设备，`revokeCurrentUserDevices()` 支持批量撤销指定设备的会话。

### 用户分页查询

后台管理页通过 `UserService.getUserPage()` 查询用户列表，支持传统条件查询和高级 `QueryFilters` 两种模式。

## 典型使用

```typescript
// 登录
import { userService } from '@/modules/user/application/service'
const response = await userService.login({ phone, password, captchaKey, captcha })

// 访问登录态
import { useAccountStore } from '@/modules/user/application/stores/useAccountStore'
const account = useAccountStore()
if (account.isAuth) {
  console.log(account.user.phone)
}

// TOTP 验证
import { totpService } from '@/modules/user/application/totp-service'
const result = await totpService.verify({
  twoFactorToken,
  code,
  rememberMe: true,
  rememberDevice: false,
})

// 用户分页（后台）
const page = await userService.getUserPage({ page: 1, size: 20, query: { filters: [] } })
```

## 注意事项

- 仓储接口在 `domain/repositories.ts`，实现在 `infrastructure/`。新增接口必须遵守此分层。
- `useAccountStore` 的状态结构变更会影响路由守卫和权限系统，需谨慎评估。
- 表单校验规则集中在 `application/validation.ts`，不要在组件内部重复定义。
- 改动后运行 `pnpm test:unit` 验证，各子目录的 `__tests__/` 下有对应测试。
