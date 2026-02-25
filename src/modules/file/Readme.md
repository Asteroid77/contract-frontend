# File 模块

文件元数据查询模块。根据文件 ID 获取文件存储信息和 OSS 临时访问 URL，供业务模块展示附件、预览文件等场景使用。

## 目录结构

```
file/
├── domain/
│   ├── types.ts           # FileStorage, FileResponse, OssCallbackDTO 等核心类型
│   ├── enums.ts           # FileSourceType, FileStatus 枚举值类型
│   └── repositories.ts    # FileRepository 仓储接口
├── application/
│   ├── file-service.ts    # fileService 应用服务
│   ├── models.ts          # OssCallbackView 视图模型及 DTO 映射
│   └── hooks/
│       └── useFileService.ts  # Vue Query 数据获取 hooks
└── infrastructure/
    └── file-repository.ts # HTTP 仓储实现（/file/* 端点）
```

## 主要能力

### 应用服务

`fileService` 提供三个查询方法：

- `getFileById(id)` 获取单个文件的完整信息（含 OSS 访问 URL 和过期时间）
- `getFilesByIds(ids)` 批量获取文件信息
- `getFilesMetaByIds(ids)` 批量获取文件元数据（不含 OSS 访问 URL）

### Vue Query Hooks

| Hook                           | 用途                                                                  |
| ------------------------------ | --------------------------------------------------------------------- |
| `useFileDetailQuery(id)`       | 查询单个文件，`staleTime: Infinity`，依赖批量查询填充缓存             |
| `useFilesDetailQuery(ids)`     | 批量查询文件，自动根据 `expireTime` 计算 stale 时间，结果回填单条缓存 |
| `useFilesMetaDetailQuery(ids)` | 批量查询文件元数据（无 OSS URL），结果同样回填单条缓存                |

`fileKeys` 对象定义了所有 query key，供外部精确失效缓存。

### 视图模型

`OssCallbackView` 将 `OssCallbackDTO` 的 `path` 字段重命名为 `accessUrl`，通过 `toOssCallbackView` / `toOssCallbackViews` 转换。

## 使用方式

```typescript
// 直接调用服务
import { fileService } from '@/modules/file/application/file-service'
const file = await fileService.getFileById(123)

// 在 Vue 组件中使用 hook
import { useFilesDetailQuery } from '@/modules/file/application/hooks/useFileService'
const fileIds = ref([1, 2, 3])
const { data: files, isLoading } = useFilesDetailQuery(fileIds)

// 视图模型转换（OSS 回调场景）
import { toOssCallbackView } from '@/modules/file/application/models'
const view = toOssCallbackView(callbackDto)
```

## 注意事项

- 本模块是纯查询模块，不包含上传、删除等写操作。
- OSS 访问 URL 有过期时间，hooks 通过 `staleTime` 自动在过期前重新获取。
- `getMetaByIds` 返回的 `FileStorage` 不含访问 URL，适合只需文件名、大小等元信息的场景。
