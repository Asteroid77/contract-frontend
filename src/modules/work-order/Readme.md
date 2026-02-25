# work-order 工单模块

## 概述

工单模块实现了完整的工单生命周期管理，包含两个视角：

- **用户侧**：提交工单、查看进度、回复沟通、评分、取消/重开。
- **处理人侧**：认领工单、处理回复、完成工单、查看绩效统计。

此外，模块还包含工单分类的 CRUD 管理能力。

## 目录结构

```
work-order/
├── domain/                 # 领域层
│   ├── types.ts            # VO、DTO、查询参数类型定义
│   └── enums.ts            # WorkOrderStatus（PENDING/PROCESSING/COMPLETED/CANCELLED）
│                           # WorkOrderUserType（USER/HANDLER）
│
├── application/            # 应用层
│   ├── work-order-service.ts       # 服务门面，统一聚合用户侧、处理人侧、分类管理三组操作
│   ├── hooks/
│   │   ├── useWorkOrderService.ts  # Vue Query hooks（查询 + 变更），覆盖用户侧与处理人侧
│   │   ├── useCategoryService.ts   # 分类 CRUD 的 Vue Query hooks
│   │   └── useWorkOrderUpload.ts   # 工单内容图片上传（OSS 直传）
│   └── rules/
│       └── categoryRules.ts        # 分类表单校验规则
│
├── infrastructure/         # 基础设施层
│   ├── work-order-endpoints.ts     # REST 端点常量（WORK_ORDER_ENDPOINTS、HANDLER_ENDPOINTS）
│   ├── work-order-repository.ts    # 用户侧工单 API 调用
│   ├── handler-repository.ts       # 处理人侧工单 API 调用
│   └── category-repository.ts      # 分类 CRUD API 调用
│
└── presentation/           # 展示层
    ├── WorkOrderListPage.vue       # 工单列表页
    ├── WorkOrderDetailPage.vue     # 工单详情页
    ├── WorkOrderCreateModal.vue    # 创建工单弹窗
    ├── WorkOrderScoreSection.vue   # 评分区块
    ├── WorkOrderStatusBadge.tsx    # 状态徽章组件
    └── WorkOrderCategorySelect.tsx # 分类选择器组件
```

## 主要能力

| 能力       | 入口                                                                                | 说明                             |
| ---------- | ----------------------------------------------------------------------------------- | -------------------------------- |
| 工单 CRUD  | `workOrderService.create / getList / getDetail`                                     | 用户提交和查看工单               |
| 工单流转   | `workOrderService.cancel / complete / reopen / rejectHandler`                       | 用户侧状态操作                   |
| 回复沟通   | `workOrderService.addReply / getReplies`                                            | 工单内对话                       |
| 评分       | `workOrderService.score / updateScore`                                              | 用户对处理结果打分               |
| 处理人操作 | `workOrderService.claim / release / handlerComplete`                                | 认领、释放、完成                 |
| 处理人统计 | `workOrderService.getPerformance / getHandlerPendingCount`                          | 绩效与待处理数                   |
| 分类管理   | `workOrderService.getCategories / createCategory / updateCategory / deleteCategory` | 工单分类的增删改查               |
| 图片上传   | `useWorkOrderUpload().onUploadImg`                                                  | Markdown 编辑器内的图片 OSS 直传 |

## 典型使用

```typescript
// 在页面中使用工单列表查询
import { useWorkOrderList } from '@/modules/work-order/application/hooks/useWorkOrderService'

const params = ref({ page: 1, size: 10, status: 'PENDING' })
const { data, loading } = useWorkOrderList(params)
```

```typescript
// 创建工单
import { useCreateWorkOrder } from '@/modules/work-order/application/hooks/useWorkOrderService'

const { mutateAsync } = useCreateWorkOrder()
await mutateAsync({ categoryId: 1, title: '问题标题', content: '详细描述' })
```

## 外部依赖

- `@/modules/shared` : useRequest、IPage、api-prefix-generator、共享校验规则
- `@tanstack/vue-query` : 数据查询与缓存管理
- `@/app/infrastructure/query` : Vue Query 请求上下文
