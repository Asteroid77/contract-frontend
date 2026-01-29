# Commit Plan (File-level)

本文件仅用于确认拆分计划，不会自动提交到 git。
如需把本文件纳入提交，请告知我。

## 0) (optional) chore(docs): add commit plan
Files:
- docs/commit-plan.md

## 1) refactor(shared): migrate shared module
Add:
- src/modules/shared/application/constants/BankConstant.ts
- src/modules/shared/application/constants/IndustriesContant.ts
- src/modules/shared/application/constants/PCA.json
- src/modules/shared/application/constants/response-code.ts
- src/modules/shared/application/exception/types.ts
- src/modules/shared/application/form/index.ts
- src/modules/shared/application/form/__tests__/pruneEmpty.spec.ts
- src/modules/shared/application/form/useSubscribeForm.ts
- src/modules/shared/application/query/legacy-query-adapter.ts
- src/modules/shared/application/request/types.ts
- src/modules/shared/application/rules/ChinaMobilePhoneNumRule.ts
- src/modules/shared/application/rules/RequireRule.ts
- src/modules/shared/domain/errors.ts
- src/modules/shared/domain/index.ts
- src/modules/shared/domain/page.ts
- src/modules/shared/domain/query.ts
- src/modules/shared/domain/response.ts
- src/modules/shared/infrastructure/api/api-prefix-generator.ts
- src/modules/shared/infrastructure/exception/exception-recorder.ts
- src/modules/shared/infrastructure/useRequest.ts
- src/modules/shared/presentation/lookup.ts
- src/modules/shared/presentation/time/index.ts
- src/modules/shared/presentation/utils.ts
- src/modules/shared/presentation/widget/AppFormItem.tsx
- src/modules/shared/presentation/widget/BankSelect.tsx
- src/modules/shared/presentation/widget/FormSkeleton.tsx
- src/modules/shared/presentation/widget/IndustriesSelect.tsx
- src/modules/shared/presentation/widget/PCACascader.tsx
- src/modules/shared/presentation/widget/search/SearchLayout.vue
- src/modules/shared/presentation/widget/ZwIcon.vue
Remove:
- src/_utils/api/api-prefix-generator.ts
- src/api/api-prefix-generator.ts
- src/_utils/exception/exception-recorder.ts
- src/_utils/form/index.ts
- src/_utils/form/__tests__/pruneEmpty.spec.ts
- src/_utils/rules/ChinaMobilePhoneNumRule.ts
- src/_utils/rules/RequireRule.ts
- src/_utils/time/index.ts
- src/constant/response_code/business_code.ts
- src/hooks/form/useSubcribeForm.ts
- src/hooks/request/useRequest.ts
- src/hooks/request/__tests__/useRequest.spec.ts
- src/types/exception/index.d.ts
- src/types/request/index.d.ts
- src/components/widget/AppFormItem.tsx
- src/components/widget/BankSelect.tsx
- src/components/widget/FormSkeleton.tsx
- src/components/widget/IndustriesSelect.tsx
- src/components/widget/PCACascader.tsx
- src/components/widget/SearchComponent.tsx
- src/components/widget/ZwIcon.vue
- src/components/widget/_utils/SelectLookup.tsx
- src/components/widget/_utils/TreeLookup.tsx
- src/components/widget/constant/BankConstant.ts
- src/components/widget/constant/IndustriesContant.ts
- src/components/widget/constant/PCA.json
- src/components/widget/search/SearchLayout.vue

## 2) refactor(app): introduce app plugins/infrastructure/layout
Add:
- src/app/plugins/index.d.ts
- src/app/plugins/usePiniaPlugin.ts
- src/app/plugins/usePlugins.ts
- src/app/plugins/useRequestPlugin.ts
- src/app/plugins/useRouterPlugin.ts
- src/app/infrastructure/query/tanstack_query_persist_with_dexie/index.ts
- src/app/infrastructure/request/get-backend-url.ts
- src/app/infrastructure/request/http-client.ts
- src/app/infrastructure/storage/dexie/defineExceptions.ts
- src/app/infrastructure/storage/dexie/defineQueryCache.ts
- src/app/infrastructure/storage/dexie/defineRestSMSCd.ts
- src/app/infrastructure/storage/dexie/defineUserInfo.ts
- src/app/infrastructure/storage/dexie/index.ts
- src/app/infrastructure/storage/dexie/QueryCache.d.ts
- src/app/infrastructure/storage/dexie/__tests__/test.spec.ts
- src/app/infrastructure/storage/dexie/types.ts
- src/app/presentation/constants/route-icons.ts
- src/app/presentation/layout/InitializeStyle.vue
- src/app/presentation/layout/auth/AuthHeader.vue
- src/app/presentation/layout/auth/AuthHeaderAvatar.vue
- src/app/presentation/layout/auth/AuthHeaderLogo.vue
- src/app/presentation/layout/auth/BreadCrumb.vue
- src/app/presentation/layout/utils/BreadCrumbBuilder.ts
- src/app/presentation/layout/utils/MenuBuilder.ts
Modify:
- src/_utils/widget/renderIcon.ts
- src/main.ts (仅插件注册相关 hunk)
Remove:
- src/plugins/index.d.ts
- src/plugins/usePiniaPlugin.ts
- src/plugins/usePlugins.ts
- src/plugins/useRequestPlugin.ts
- src/plugins/useRouterPlugin.ts
- src/_utils/dexie/__tests__/test.spec.ts
- src/_utils/dexie/index.ts
- src/_utils/dexie/table/defineExceptions.ts
- src/_utils/dexie/table/defineQueryCache.ts
- src/_utils/dexie/table/defineRestSMSCd.ts
- src/_utils/dexie/table/defineUserInfo.ts
- src/_utils/dexie/table/types/QueryCache.d.ts
- src/_utils/dexie/table/types/RestSmsCd.d.ts
- src/_utils/dexie/types.ts
- src/_utils/tanstack_query_persist_with_dexie/index.ts
- src/_utils/request/business-error.strategy.ts
- src/_utils/request/critical-error.filter.ts
- src/_utils/request/get-backend-url.ts
- src/_utils/request/http-client.ts
- src/_utils/request/http-error.strategy.ts
- src/_utils/request/minor-err.filter.ts
- src/_utils/request/notification.service.ts
- src/components/layout/InitializeStyle.vue
- src/components/layout/_utils/BreadCrumbBuilder.ts
- src/components/layout/_utils/MenuBuilder.ts
- src/components/layout/auth/AuthHeader.vue
- src/components/layout/auth/AuthHeaderAvatar.vue
- src/components/layout/auth/AuthHeaderLogo.vue
- src/components/layout/auth/BreadCrumb.vue
- src/components/layout/constant/RouteIcons.ts

## 3) refactor(theme): move theme tokens/hooks/styles
Add:
- src/app/presentation/theme/ThemeToken.ts
- src/app/presentation/theme/hooks/useCssVar.ts
- src/app/presentation/theme/hooks/useTheme.ts
- src/app/presentation/theme/styles/generated-theme.css
- src/app/presentation/theme/styles/token.css
Modify:
- src/App.vue
- vite-plugin/ThemeGeneratorVitePlugin.ts
Remove:
- src/components/theme/ThemeToken.ts
- src/components/theme/hooks/useCssVar.ts
- src/components/theme/hooks/useTheme.ts
- src/components/theme/styles/generated-theme.css
- src/components/theme/styles/token.css

## 4) refactor(approval): migrate approval module
Add:
- src/modules/approval/application/constants.ts
- src/modules/approval/application/hooks/useApprovalService.ts
- src/modules/approval/application/hooks/usePrint.ts
- src/modules/approval/application/models.ts
- src/modules/approval/application/print/ApprovalPrintFieldRenderUtil.tsx
- src/modules/approval/application/print/ApprovalPrintFileDiffSection.tsx
- src/modules/approval/application/print/ApprovalPrintFileItemCard.tsx
- src/modules/approval/application/print/FileListDiff.tsx
- src/modules/approval/application/print/ListDiff.tsx
- src/modules/approval/application/print/printUtils.ts
- src/modules/approval/application/print/style/index.ts
- src/modules/approval/application/print/style/PrintCore.css
- src/modules/approval/application/service.ts
- src/modules/approval/application/utils.ts
- src/modules/approval/application/validation.ts
- src/modules/approval/domain/dto.ts
- src/modules/approval/domain/enums.ts
- src/modules/approval/domain/types.ts
- src/modules/approval/infrastructure/approval-repository.ts
- src/modules/approval/presentation/approval/ApprovalInstancePage.vue
- src/modules/approval/presentation/approval/ApprovalTemplate.tsx
- src/modules/approval/presentation/approval/DocumentSection.tsx
- src/modules/approval/presentation/approval/StatusTag.tsx
- src/modules/approval/presentation/approval/styles/ApprovalTemplate.css
- src/modules/approval/presentation/approval/styles/AttachmentApprovalDiff.css
- src/modules/approval/presentation/approval/styles/FileDiffSection.css
- src/modules/approval/presentation/approval/styles/FileItemCard.css
- src/modules/approval/presentation/approval/styles/Integration.css
- src/modules/approval/presentation/approval/styles/PrintContainer.css
- src/modules/approval/presentation/approval/SuccessResult.vue
- src/modules/approval/presentation/approval/TemplateActions.tsx
- src/modules/approval/presentation/approval/template/AdditionalInfoDiffTemplate.tsx
- src/modules/approval/presentation/approval/TemplateNode.tsx
- src/modules/approval/presentation/approval/TemplateRecord.tsx
- src/modules/approval/presentation/approval/template/TemplateSwitch.tsx
- src/modules/approval/presentation/print/DiffRenderer.tsx
- src/modules/approval/presentation/print/PrintTemplateSwitch.tsx
- src/modules/approval/presentation/print/utils/FileListDiff.tsx
- src/modules/approval/presentation/print/utils/ListDiff.tsx
Remove:
- src/components/approval/ApprovalInstancePage.vue
- src/components/approval/ApprovalTemplate.tsx
- src/components/approval/DocumentSection.tsx
- src/components/approval/StatusTag.tsx
- src/components/approval/SuccessResult.vue
- src/components/approval/TemplateActions.tsx
- src/components/approval/TemplateNode.tsx
- src/components/approval/TemplateRecord.tsx
- src/components/approval/api/approval.api.ts
- src/components/approval/api/approval.d.ts
- src/components/approval/constant/enum.ts
- src/components/approval/hook/usePrint.ts
- src/components/approval/print/DiffRenderer.tsx
- src/components/approval/print/PrintTemplateSwitch.tsx
- src/components/approval/print/style/PrintCore.css
- src/components/approval/print/style/index.ts
- src/components/approval/print/template/AdditionalInfoTemplate.vue
- src/components/approval/print/utils/FileListDiff.tsx
- src/components/approval/print/utils/ListDiff.tsx
- src/components/approval/rules/index.ts
- src/components/approval/styles/ApprovalTemplate.css
- src/components/approval/styles/AttachmentApprovalDiff.css
- src/components/approval/styles/FileDiffSection.css
- src/components/approval/styles/FileItemCard.css
- src/components/approval/styles/Integration.css
- src/components/approval/styles/PrintContainer.css
- src/components/approval/template/AdditionalInfoDiffTemplate.tsx
- src/components/approval/template/TemplateSwitch.tsx
- src/components/approval/utils/ApprovalPrintFieldRenderUtil.tsx
- src/components/approval/utils/ApprovalPrintFileDiffSection.tsx
- src/components/approval/utils/ApprovalPrintFileItemCard.tsx
- src/components/approval/utils/index.ts
- src/components/approval/utils/printUtils.ts
- src/api/types/approval.d.ts
- src/hooks/approval/useApprovalService.ts

## 5) refactor(service-agreement): migrate service agreement module
Add:
- src/modules/service-agreement/application/cleaners.ts
- src/modules/service-agreement/application/constants.ts
- src/modules/service-agreement/application/hooks/useSignService.ts
- src/modules/service-agreement/application/mappers.ts
- src/modules/service-agreement/application/models.ts
- src/modules/service-agreement/application/service.ts
- src/modules/service-agreement/application/transformer-capacity.ts
- src/modules/service-agreement/application/ui-mappers.ts
- src/modules/service-agreement/application/validation.ts
- src/modules/service-agreement/domain/dto.ts
- src/modules/service-agreement/domain/enums.ts
- src/modules/service-agreement/domain/types.ts
- src/modules/service-agreement/infrastructure/service-agreement-repository.ts
- src/modules/service-agreement/presentation/print/ServiceAgreementAttachmentPrint.tsx
- src/modules/service-agreement/presentation/print/ServiceAgreementPrint.tsx
- src/modules/service-agreement/presentation/print/SignDiffTemplate.tsx
- src/modules/service-agreement/presentation/print/styles/FormPrintCSS.module.css
- src/modules/service-agreement/presentation/sign/AttachmentApprovalDiff.tsx
- src/modules/service-agreement/presentation/sign/AttachmentSection.tsx
- src/modules/service-agreement/presentation/sign/CustomerInfoSection.tsx
- src/modules/service-agreement/presentation/sign/ImagesUploader.tsx
- src/modules/service-agreement/presentation/sign/MobileAttachmentPreview.tsx
- src/modules/service-agreement/presentation/sign/PriceGroupWidget.tsx
- src/modules/service-agreement/presentation/sign/ServiceAgreementForm.tsx
- src/modules/service-agreement/presentation/sign/ServiceAgreementPage.tsx
- src/modules/service-agreement/presentation/sign/ServicePointSpecificationGroup.tsx
- src/modules/service-agreement/presentation/sign/ServicePointSpecification.tsx
- src/modules/service-agreement/presentation/sign/SignInfoSection.tsx
- src/modules/service-agreement/presentation/sign/styles/MobileAttachmentPreview.css
- src/modules/service-agreement/presentation/sign/styles/PrintStyle.css
- src/modules/service-agreement/presentation/sign/TimeOfUsePricingWidget.tsx
Remove:
- src/components/sign/AttachmentApprovalDiff.tsx
- src/components/sign/AttachmentSection.tsx
- src/components/sign/CustomerInfoSection.tsx
- src/components/sign/ImagesUploader.tsx
- src/components/sign/MobileAttachmentPreview.tsx
- src/components/sign/PriceGroupWidget.tsx
- src/components/sign/ServiceAgreementForm.tsx
- src/components/sign/ServiceAgreementPage.tsx
- src/components/sign/ServicePointSpecification.tsx
- src/components/sign/ServicePointSpecificationGroup.tsx
- src/components/sign/SignInfoSection.tsx
- src/components/sign/TimeOfUsePricingWidget.tsx
- src/components/sign/api/sign.api.ts
- src/components/sign/api/sign.d.ts
- src/components/sign/constant/enum.ts
- src/components/sign/hooks/useSignService.ts
- src/components/sign/model/index.ts
- src/components/sign/print/ServiceAgreementAttachmentPrint.tsx
- src/components/sign/print/ServiceAgreementPrint.tsx
- src/components/sign/print/SignDiffTemplate.tsx
- src/components/sign/print/styles/FormPrintCSS.module.css
- src/components/sign/rules/index.ts
- src/components/sign/styles/MobileAttachmentPreview.css
- src/components/sign/styles/PrintStyle.css
- src/components/sign/util/index.ts

## 6) refactor(user): migrate user module
Add:
- src/modules/user/application/constants.ts
- src/modules/user/application/hooks/useLoadUserInfo.ts
- src/modules/user/application/hooks/useLogin.ts
- src/modules/user/application/hooks/useOauth2AuthorizationUrl.ts
- src/modules/user/application/hooks/usePassword.ts
- src/modules/user/application/hooks/useRegister.ts
- src/modules/user/application/hooks/useUserAdditionalInfoRequest.ts
- src/modules/user/application/hooks/useUserPage.ts
- src/modules/user/application/mappers.ts
- src/modules/user/application/models.ts
- src/modules/user/application/service.ts
- src/modules/user/application/stores/useAccountStore.ts
- src/modules/user/application/validation.ts
- src/modules/user/domain/dto.ts
- src/modules/user/domain/enums.ts
- src/modules/user/domain/types.ts
- src/modules/user/infrastructure/oauth-endpoints.ts
- src/modules/user/infrastructure/user-repository.ts
- src/modules/user/presentation/login/LoginForm.tsx
- src/modules/user/presentation/password/PasswordRecoveryForm.tsx
- src/modules/user/presentation/print/UserAdditionInfoPrintTemplate.tsx
- src/modules/user/presentation/register/RegisterForm.tsx
- src/modules/user/presentation/user_additional_info/UserAdditionalInfoForm.tsx
Remove:
- src/components/login/LoginForm.tsx
- src/components/login/rules/LoginFormRules.ts
- src/components/login/rules/PasswordFormRules.ts
- src/components/login/rules/RegisterFormRules.ts
- src/components/register/RegisterForm.tsx
- src/components/password/PasswordRecoveryForm.tsx
- src/components/user_additional_info/UserAdditionalInfoForm.tsx
- src/components/user_additional_info/constant/RegisterTypeEnum.ts
- src/components/user_additional_info/print/UserAdditionInfoPrintTemplate.tsx
- src/components/user_additional_info/rules/UserAdditionalInfoFormRules.ts
- src/hooks/account/useLoadUserInfo.ts
- src/hooks/account/useLogin.ts
- src/hooks/account/useOauth2AuthorizationUrl.ts
- src/hooks/account/usePassword.ts
- src/hooks/account/useRegister.ts
- src/hooks/account/useUserAdditionalInfoRequest.ts
- src/hooks/account/useUserPage.ts
- src/api/user.api.ts
- src/api/password.api.ts
- src/api/types/password.d.ts
- src/types/account/index.d.ts
- src/stores/useAccountStore.ts

## 7) refactor(invitation): migrate invitation module
Add:
- src/modules/invitation/application/constants.ts
- src/modules/invitation/application/hooks/useInvitationService.ts
- src/modules/invitation/application/models.ts
- src/modules/invitation/application/service.ts
- src/modules/invitation/domain/dto.ts
- src/modules/invitation/domain/types.ts
- src/modules/invitation/infrastructure/invitation-repository.ts
- src/modules/invitation/presentation/invitation/InvitationCodePage.vue
Remove:
- src/components/invitation/InvitationCodePage.vue
- src/components/invitation/api/invitation.api.ts
- src/components/invitation/api/invitation.d.ts
- src/components/invitation/constant/index.ts
- src/hooks/account/useInvitationService.ts

## 8) refactor(access): migrate access module
Add:
- src/modules/access/application/hooks/useRoleService.ts
- src/modules/access/application/hooks/useUserRoleService.ts
- src/modules/access/application/models.ts
- src/modules/access/application/service.ts
- src/modules/access/application/validation.ts
- src/modules/access/domain/dto.ts
- src/modules/access/domain/types.ts
- src/modules/access/infrastructure/access-repository.ts
- src/modules/access/presentation/role/RoleAssign.vue
- src/modules/access/presentation/role/RolePage.vue
Remove:
- src/components/role/RoleAssign.vue
- src/components/role/RolePage.vue
- src/components/role/RolePageSearch.vue
- src/components/role/types/index.d.ts
- src/api/role.api.ts
- src/api/types/role.d.ts
- src/api/types/permission.d.ts
- src/api/user-role.api.ts
- src/api/types/user-role.d.ts
- src/hooks/account/useRoleService.ts
- src/hooks/account/useUserRoleService.ts

## 9) refactor(file): migrate file module
Add:
- src/modules/file/application/file-service.ts
- src/modules/file/application/hooks/useFileService.ts
- src/modules/file/application/models.ts
- src/modules/file/domain/enums.ts
- src/modules/file/domain/repositories.ts
- src/modules/file/domain/types.ts
- src/modules/file/infrastructure/file-repository.ts
Modify:
- src/types/vendor/naive-ui.d.ts
Remove:
- src/components/file/api/file-storage.d.ts
- src/components/file/api/file.api.ts
- src/hooks/file/useFileService.ts

## 10) refactor(captcha): migrate captcha module
Add:
- src/modules/captcha/application/hooks/useCaptcha.ts
- src/modules/captcha/application/hooks/useSMS.ts
- src/modules/captcha/application/models.ts
- src/modules/captcha/application/service.ts
- src/modules/captcha/domain/types.ts
- src/modules/captcha/infrastructure/captcha-repository.ts
Remove:
- src/components/captcha/api/captcha.api.ts
- src/components/captcha/api/captcha.d.ts
- src/api/captcha.api.ts
- src/api/types/captcha.d.ts
- src/hooks/captcha/useCaptcha.ts
- src/hooks/captcha/useSMS.ts

## 11) refactor(views-router): rewire views/router/directives
Modify:
- src/views/auth/ApprovalDetailView.vue
- src/views/auth/ApprovalInstancePageView.vue
- src/views/auth/AuthLayoutView.vue
- src/views/auth/InvitationPageView.vue
- src/views/auth/LayoutSideBar.vue
- src/views/auth/ServiceAgreementDetailView.tsx
- src/views/auth/ServiceAgreementPageView.tsx
- src/views/auth/SignResultView.tsx
- src/views/auth/UserAdditionalInfoView.vue
- src/views/unauth/PreviewAttachments.tsx
- src/views/unauth/LoginView.tsx (仅 import/类型路径改动 hunk)
- src/views/unauth/RegisterView.tsx (仅 import/类型路径改动 hunk)
- src/views/unauth/PasswordRecoveryView.tsx (仅 import/类型路径改动 hunk)
- src/router/guards/SetupAuthGuard.ts
- src/directives/permission.ts
Remove:
- src/views/auth/AuthView.vue

## 12) fix(unauth-view): fix JSX template/fragment roots
Modify:
- src/views/unauth/LoginView.tsx (仅 <template> -> <div> hunk)
- src/views/unauth/RegisterView.tsx (仅 <template> -> <div> hunk)
- src/views/unauth/PasswordRecoveryView.tsx (仅 <template> -> <div> hunk)
- src/views/unauth/UnauthLayoutView.tsx

## 13) fix(theme): restore global theme stylesheet import
Modify:
- src/main.ts (仅 import '@/app/presentation/theme/styles/token.css' hunk)

## 14) chore(cleanup): remove leftover demo store
Remove:
- src/stores/counter.ts

## 15) chore(tests): update test config
Modify:
- vitest.config.ts

## Cross-commit split notes
- src/main.ts 需要分两次提交（插件路径 vs 主题样式 import）。
- src/views/unauth/LoginView.tsx / RegisterView.tsx / PasswordRecoveryView.tsx 需要分两次提交（import 路径改动 vs <template> 修复）。
