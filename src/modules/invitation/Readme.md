# Invitation 模块

邀请码管理模块，提供邀请码的增删改查和邀请记录的分页浏览。

## 目录结构

```
invitation/
├── domain/                          # 领域类型
│   ├── types.ts                     # InvitationCode, InvitationRecord 实体
│   └── dto.ts                       # EditRemarkDTO（编辑备注请求体）
├── application/                     # 应用层
│   ├── service.ts                   # 业务编排（委托 repository 执行）
│   ├── models.ts                    # 应用层类型重导出与别名
│   ├── constants.ts                 # 邀请码状态常量（active / inactive）
│   └── hooks/
│       └── useInvitationService.ts  # Vue Query hooks（查询 + 变更）
├── infrastructure/                  # 基础设施
│   └── invitation-repository.ts     # HTTP 仓储（/invitation, /invitation_record 端点）
└── presentation/                    # UI 层
    └── invitation/
        └── InvitationCodePage.vue   # 邀请码管理页面
```

## 主要能力

### 邀请码管理

- 创建邀请码（`createInvitationCode`）
- 批量更新备注（`updateInvitationCode`，接收 `EditRemarkDTO[]`）
- 批量软删除（`deleteInvitationCode`，接收 id 数组）
- 查询当前用户的邀请码列表（`getInvitationCodeList`）

### 邀请记录

- 查询已邀请人数（`getInvitedCount`）
- 分页查询邀请记录（`getInvitationRecordPage`）

### Vue Query Hooks

所有数据访问都封装为 Vue Query hooks，支持自动缓存和失效：

- `useInvitationCodeListQuery` / `useInvitatedCountQuery`：查询 hooks
- `useCreateInvitationCodeMutation` / `useUpdateInvitationCodeMutation` / `useDeleteInvitationCodeMutation`：变更 hooks，成功后自动刷新列表缓存

## 使用方式

```typescript
// 在组合式 API 中使用查询
import {
  useInvitationCodeListQuery,
  useCreateInvitationCodeMutation,
} from '@/modules/invitation/application/hooks/useInvitationService'

const listQuery = useInvitationCodeListQuery()
const createMutation = useCreateInvitationCodeMutation()

// 类型导入
import type { InvitationCode } from '@/modules/invitation/application/models'

// 状态常量
import { invitationCodeStatus } from '@/modules/invitation/application/constants'
```

## 注意事项

- 本模块逻辑较轻，核心操作都是标准 CRUD，没有复杂领域规则。
- `domain/` 层保持纯 TypeScript 类型，不依赖任何框架。
- API 端点通过 `createPrefixedEndpoints` 生成，前缀分别为 `/invitation` 和 `/invitation_record`。
- 分页查询使用 shared 的 `toDomainPageRequest` 适配器做参数转换。
