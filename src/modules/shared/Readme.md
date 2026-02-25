# Shared 模块

跨业务的公共基础模块，提供通用类型定义、请求封装、表单工具和可复用 UI 组件。

## 目录结构

```
shared/
├── domain/                 # 通用领域类型
│   ├── response.ts         # RFC 7807 统一响应格式
│   ├── errors.ts           # BusinessError 业务异常
│   ├── page.ts             # 分页请求与响应类型
│   ├── query.ts            # 查询过滤条件（FilterOp, QueryGroup）
│   └── advanced-query/     # 高级查询扩展
├── application/            # 应用层工具
│   ├── mapper-utils.ts     # DTO 映射辅助（trim, 时间戳转换, ID 提取）
│   ├── form/               # 表单订阅 hook
│   ├── rules/              # 表单校验规则（手机号, 必填）
│   ├── constants/          # 静态数据（银行, 行业, 省市区）
│   ├── query/              # 旧版查询适配器
│   └── request/types.ts    # 自定义 Axios 请求配置类型
├── infrastructure/         # 基础设施
│   ├── useRequest.ts       # 统一 HTTP 请求（解包, 401 自动重试, requestId）
│   └── api/                # API 前缀生成
└── presentation/           # UI 层
    ├── widget/             # 通用组件
    │   ├── AppFormItem.tsx
    │   ├── CrudSelect.tsx
    │   ├── BankSelect.tsx
    │   ├── IndustriesSelect.tsx
    │   ├── PCACascader.tsx
    │   ├── FormSkeleton.tsx
    │   ├── ZwIcon.vue
    │   └── search/SearchLayout.vue
    ├── lookup.ts           # SelectLookup / TreeLookup 查找表
    ├── time/               # 时间格式化（dayjs 封装）
    ├── diff-check/         # 数据变更对比组件
    └── utils.ts            # 树搜索, CSS 提取, 对象对比工具
```

## 主要能力

### 统一请求

`useRequest<T>(config)` 封装了项目的 HTTP 请求流程：

- 自动注入 `requestId` 和认证令牌
- RFC 7807 响应体解包（`unWrap` 参数控制）
- 401 状态码自动刷新 token 并重试
- 异常统一转换为 `BusinessError`

### 通用类型

- `RFC7807Response<T>` / `RFC7807SuccessResponse<T>`：后端统一响应格式
- `IPage<T>` / `BasePageRequest<T>`：分页查询
- `FilterOp` / `QueryGroup` / `QueryFilters`：动态过滤条件构建

### 表单与校验

- `useSubscribeForm`：表单状态订阅
- `RequireRule` / `ChinaMobilePhoneNumRule`：可复用校验规则
- `mapper-utils`：DTO 转换辅助函数

### 通用组件

- `CrudSelect`：支持远程搜索的下拉选择
- `PCACascader`：省市区级联选择
- `BankSelect` / `IndustriesSelect`：银行、行业选择器
- `SearchLayout`：搜索页面布局
- `DiffCheckScope`：字段变更对比展示

### 查找表

- `SelectLookup`：value 到 label 的快速映射
- `TreeLookup`：树形数据的节点查找和全路径拼接

## 使用方式

```typescript
// 请求
import { useRequest } from '@/modules/shared/infrastructure/useRequest'
const res = await useRequest<MyData>({ url: '/api/foo', method: 'GET' })

// 类型
import type { IPage, RFC7807SuccessResponse } from '@/modules/shared/domain'

// 工具
import { trimString, toTimestampOrNull } from '@/modules/shared/application/mapper-utils'

// 组件
import CrudSelect from '@/modules/shared/presentation/widget/CrudSelect'
```

## 注意事项

- 本模块只存放被多个业务模块共同使用的能力。单一模块专用的逻辑应放在对应业务模块内。
- `domain/` 层不依赖任何框架，保持纯 TypeScript 类型和函数。
- 修改 `useRequest` 或 `BusinessError` 会影响所有业务模块，请充分测试。
