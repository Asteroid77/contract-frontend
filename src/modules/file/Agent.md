# file 模块 Agent 指令

## 全局规则引用

本模块内改动仍以本模块边界与分层规则为先；但 UI（discrete / theme）、文案（i18n）与搜索（advanced_query，`ModernQueryBuilder`）规则统一遵循 `Rule.md`。

## 定位

`src/modules/file` 是文件元数据与访问地址的只读查询模块。它向其他业务模块提供"根据文件 ID 获取文件信息（含 OSS 临时访问 URL）"的能力。本模块不负责文件上传、删除或内容处理。

## 目录与职责

```
file/
├── domain/           # 领域类型与仓储接口
│   ├── types.ts      # FileStorage, FileResponse, FileUploadResponse, OssCallbackDTO
│   ├── enums.ts      # FileSourceType, FileStatus（EnumValue 泛型）
│   └── repositories.ts  # FileRepository 接口（getById, getByIds, getMetaByIds）
├── application/      # 应用服务与 hooks
│   ├── file-service.ts  # fileService：对 repository 的薄封装
│   ├── models.ts        # OssCallbackView 视图模型及映射函数
│   └── hooks/
│       └── useFileService.ts  # Vue Query hooks（useFileDetailQuery, useFilesDetailQuery, useFilesMetaDetailQuery）
├── infrastructure/   # 仓储实现
│   └── file-repository.ts  # fileRepository：基于 useRequest 的 HTTP 实现
```

## 依赖约束

### 允许

- 本模块 infrastructure 依赖 `@/modules/shared/infrastructure`（useRequest, api-prefix-generator）。
- 本模块 application/hooks 依赖 `@tanstack/vue-query` 和 `@/app/infrastructure/query`。
- 其他业务模块通过 `@/modules/file/application` 导入 fileService 或 hooks。

### 禁止

- domain 层禁止依赖 infrastructure、shared/infrastructure、Vue、axios 等框架实现。
- 本模块禁止依赖其他业务模块（contract、access 等）。
- 禁止在本模块内添加文件上传、删除等写操作（这些属于后端 OSS 直传流程，不经过本模块）。

## 修改本模块的规则

1. **只读语义**：本模块只做查询。如果需要增加写操作，先确认是否应该放在其他模块或新建模块。
2. **缓存策略**：hooks 中的 `staleTime` 与 `gcTime` 与 OSS URL 过期时间紧密关联。修改前理解 `expireTime` 的含义，避免产生过期 URL 仍被使用的问题。
3. **批量查询填充单条缓存**：`useFilesDetailQuery` 会将批量结果逐条写入单条缓存（`queryClient.setQueryData`）。修改批量接口时保持此行为一致。
4. **domain 纯净**：types.ts 和 enums.ts 只包含纯 TypeScript 类型，不引入运行时依赖。
5. 改动后运行 `pnpm test:unit` 验证。
