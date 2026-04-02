# user 模块 Agent 指令

## 全局规则引用

本模块内改动仍以本模块边界与分层规则为先；但 UI（discrete / theme）、文案（i18n）与搜索（advanced_query，`ModernQueryBuilder`）规则统一遵循 `Rule.md`。

## 定位

`src/modules/user` 是用户账户生命周期模块。覆盖注册、登录（含 OAuth2）、TOTP 两步验证、密码管理、设备会话、用户附加信息提交，以及后台用户分页查询。

## 目录与职责

```
user/
├── domain/           # 领域类型（User, UserInfoVo, DTO, 仓储接口）
├── application/      # 应用服务、视图模型、mapper、校验规则、hooks、Pinia store
├── infrastructure/   # 仓储实现、API endpoint 定义（user-endpoints, oauth-endpoints, totp-endpoints）
├── presentation/     # 页面与表单组件（login, register, password, manage, user_additional_info, print）
```

## 依赖约束

### 允许

- `import` shared 模块下的任何导出（`useRequest`、分页类型、查询类型、mapper-utils、校验规则、通用组件）。
- `domain/types.ts` 可引用 `access/domain/types`（`RoleVo`、`Permission`），因为登录响应包含角色与权限。
- `domain/repositories.ts` 可引用 `approval/domain/types`（`ApprovalInstance`），因为附加信息提交走审批流。
- `application/stores/useAccountStore.ts` 可依赖 `access/application/token-manager` 和 `access/application/ability`（认证令牌与 CASL 权限同步）。
- `infrastructure/` 可依赖 `shared/infrastructure/useRequest` 和 `shared/infrastructure/api/api-prefix-generator`。

### 禁止

- user 模块禁止引用 `contract`、`approval`（仓储接口中的类型引用除外）等其他业务模块的实现代码。
- `domain/` 层禁止依赖 Vue、Pinia、Naive UI、axios 等框架实现。
- 其他业务模块不应直接 `import` user 的 infrastructure 或 presentation 层；如需用户信息，通过 `useAccountStore` 获取。

## 关键文件

| 层             | 文件                                              | 说明                                                                            |
| -------------- | ------------------------------------------------- | ------------------------------------------------------------------------------- |
| domain         | `types.ts`                                        | `User`、`UserInfoVo`、`UserPageVo`、`OAuth2ExchangeVo`、TOTP 相关 VO            |
| domain         | `dto.ts`                                          | 所有请求 DTO（登录、注册、改密、TOTP、设备撤销等）                              |
| domain         | `repositories.ts`                                 | `IUserRepository`、`ITotpRepository` 接口定义                                   |
| domain         | `enums.ts`                                        | `RegisterType`、`PlatformEnum`                                                  |
| application    | `service.ts`                                      | `UserService`：DTO/VO 映射 + 仓储调用，导出单例 `userService`                   |
| application    | `totp-service.ts`                                 | `TotpService`：两步验证流程，导出单例 `totpService`                             |
| application    | `models.ts`                                       | 视图模型（`SignInForm`、`SignInResponse`、`UserPageItem` 等）                   |
| application    | `mappers.ts`                                      | domain ↔ view 双向映射函数                                                      |
| application    | `validation.ts`                                   | 用户附加信息表单校验规则                                                        |
| application    | `stores/useAccountStore.ts`                       | Pinia store，管理登录态、token、角色、权限                                      |
| application    | `hooks/`                                          | `useLogin`、`useRegister`、`usePassword`、`useUserPage`、`useTotpManagement` 等 |
| infrastructure | `user-repository.ts`                              | `IUserRepository` 实现，调用 `useRequest`                                       |
| infrastructure | `totp-repository.ts`                              | `ITotpRepository` 实现                                                          |
| infrastructure | `user-endpoints.ts`                               | `/user/*` API 路径常量                                                          |
| infrastructure | `oauth-endpoints.ts`                              | OAuth2 相关 API 路径常量                                                        |
| infrastructure | `totp-endpoints.ts`                               | TOTP 相关 API 路径常量                                                          |
| presentation   | `login/LoginForm.tsx`                             | 登录表单                                                                        |
| presentation   | `register/RegisterForm.tsx`                       | 注册表单                                                                        |
| presentation   | `password/PasswordRecoveryForm.tsx`               | 忘记密码表单                                                                    |
| presentation   | `manage/UserListPage.tsx`                         | 后台用户列表分页                                                                |
| presentation   | `user_additional_info/UserAdditionalInfoForm.tsx` | 用户附加信息提交表单                                                            |
| presentation   | `print/UserAdditionInfoPrintTemplate.tsx`         | 用户附加信息打印模板                                                            |

## 修改本模块的规则

1. 仓储接口定义在 `domain/repositories.ts`，实现在 `infrastructure/`。新增 API 必须遵守此分层。
2. 新增或修改视图模型（`models.ts`）时，同步更新 `mappers.ts` 中对应的映射函数，并补充单元测试。
3. `useAccountStore` 是全局登录态的唯一入口，修改其状态结构需评估对路由守卫和权限系统的影响。
4. 表单校验规则集中在 `application/validation.ts`，不要在 presentation 层内联校验逻辑。
5. 每个子目录下的 `__tests__/` 包含对应单元测试，改动后运行 `pnpm test:unit` 验证。
