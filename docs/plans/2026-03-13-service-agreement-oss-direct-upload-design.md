# Service Agreement OSS 直传设计

**背景**
- 当前 `service-agreement` 附件上传走业务后端 `/service_agreement/upload`。
- 当前 `work-order` 模块已存在可工作的 OSS 表单直传实现：前端先请求 `/file/policy`，再直传 OSS，并从直传最终响应中拿到文件 `id`。
- 本次目标是在不改变 `service-agreement` 表单结构的前提下，将附件上传切换为 OSS 直传。

**目标**
- 将 `service-agreement` 的合同扫描件、电费单、补充附件三类上传切换为 OSS 直传。
- 保持现有 UI 组件接口与表单数据结构不变，附件字段仍保存 `number[]` 文件 ID。
- 上传成功后继续返回 `OssCallbackView`，以兼容现有 `ImagesUploader` 和查询缓存逻辑。

**非目标**
- 不抽取跨模块共享 OSS 上传基础设施。
- 不修改 `work-order` 模块。
- 不实现 callback 失败后的补偿查询，仅补 `TODO`。

**方案**
- 在 `service-agreement-repository` 内将 `uploadFile()` 改为两步：
  1. `POST /file/policy` 获取 `accessId/policy/signature/dir/host/expire/callback`
  2. 使用 `axios.post(policy.host, formData)` 直传 OSS，并读取 OSS 最终返回的 `OssCallbackDTO`
- `serviceAgreementService.uploadFile()` 继续将 DTO 映射为 `OssCallbackView`。
- `useUploadFileMutation()` 与 `ImagesUploader` 保持当前调用协议不变。
- 在仓储实现中添加 `TODO`：callback 失败时可考虑通过 `ossObjectKey/fileHash` 做补偿反查。

**风险与约束**
- 直传成功依赖后端 callback 在 OSS 限时内返回业务文件记录。
- 若 callback 失败，OSS 文件可能已存在但前端拿不到 `id`；本次仅记录 `TODO`，不做补偿。
- 现有测试需从“后端直传接口”调整为“policy + OSS 上传”模式。

**验证**
- 仓储层测试覆盖 `/file/policy` 请求与 OSS 表单上传字段。
- 应用层测试验证 service 仍返回 `OssCallbackView`。
- 运行 `pnpm test:unit -- src/modules/service-agreement/infrastructure/__tests__/service-agreement-repository.spec.ts src/modules/service-agreement/application/__tests__/service.spec.ts`。
