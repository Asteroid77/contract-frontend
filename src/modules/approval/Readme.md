# approval 模块

## 概述

审批流程模块，负责审批实例的完整生命周期管理。支持任务领取、审批（通过/驳回）、撤销、历史记录查询，以及审批数据的差异对比和打印预览。

当前承载两类审批流程：**用户信息审批**和**备案/签约信息审批**。审批数据为泛型结构（`ApprovalInstance<T>`），模块本身不关心具体业务数据的内容。

## 目录结构

```
approval/
├── domain/                # 领域层
│   ├── types.ts           # ApprovalInstance、ApprovalHistory、ApprovalInstancePage
│   ├── enums.ts           # 状态枚举：ApprovalInstanceStatus、ApprovalTaskStatus、ApprovalProcessName
│   └── dto.ts             # ApprovalCommentDTO、ApprovalInstancesPageDTO
├── application/           # 应用层
│   ├── service.ts         # approvalService：统一业务入口，DTO 转换
│   ├── models.ts          # 视图模型与类型再导出（对外暴露的主要类型入口）
│   ├── utils.ts           # 审批权限判断：canClaimTask、canApproveTask、状态可见性
│   ├── validation.ts      # 表单校验规则
│   ├── constants.ts       # ApprovalProcessNameEnum
│   ├── hooks/             # Vue Query 封装
│   │   ├── useApprovalService.ts  # useClaimTask、useHandleTask、useApprovalInstancePage 等
│   │   └── usePrint.ts
│   └── print/             # 打印数据处理：字段渲染、列表差异算法
├── infrastructure/        # 基础设施层
│   └── approval-repository.ts     # HTTP 请求封装，端点定义
└── presentation/          # 展示层
    ├── approval/          # 审批主界面
    │   ├── ApprovalInstancePage.vue   # 审批实例列表页
    │   ├── ApprovalTemplate.tsx       # 审批模板渲染
    │   ├── StatusTag.tsx              # 状态标签组件
    │   ├── TemplateActions.tsx        # 模板操作按钮
    │   ├── TemplateNode.tsx           # 流程节点渲染
    │   ├── TemplateRecord.tsx         # 审批记录展示
    │   ├── DocumentSection.tsx        # 文档区域
    │   ├── diff-check/               # 数据变更对比组件
    │   ├── template/                  # 模板子组件
    │   └── styles/                    # CSS 样式
    └── print/             # 打印预览
        ├── PrintTemplateSwitch.tsx    # 打印模板切换
        ├── DiffRenderer.tsx           # 差异渲染器
        ├── ApprovalPrintFileDiffSection.tsx
        ├── ApprovalPrintFileItemCard.tsx
        ├── printUtils.ts
        ├── utils/                     # 打印工具组件
        └── style/                     # 打印样式
```

## 主要能力

### 审批操作

- **领取任务** `useClaimTask()` - 将待处理任务分配给当前用户
- **处理任务** `useHandleTask()` - 提交审批意见（通过或驳回）
- **撤销实例** `useCancelApprovalInstance()` - 申请人撤销自己的审批

### 数据查询

- **分页查询** `useApprovalInstancePage(params)` - 支持高级查询过滤
- **实例详情** `useApprovalInstanceDetail(instanceId)` - 获取完整审批数据（含 approvalData 和 sourceData）
- **审批历史** `useApprovalHistoryQuery(instanceId)` - 查看流程流转记录
- **补充信息状态** `useLatestAdditionalInfoInstanceStatus()` - 获取最新补充信息审批状态

### 权限判断

- `canClaimTask(instance, currentUser)` - 检查用户是否有权领取任务（角色、状态、分配状态）
- `canApproveTask(...)` - 检查用户是否有权审批（必须是领取人且任务处于 handling 状态）
- `isClaimBtnVisible()`、`isApproveBtnVisible()` - UI 层按钮可见性判断

### 差异对比与打印

- diff-check 组件支持审批数据、基础信息、历史记录、打印内容的前后对比
- print 组件支持审批表单的打印预览，包含文件列表差异展示

## 典型使用

```typescript
// 在其他模块中引用审批类型
import type {
  ApprovalInstance,
  ApprovalInstanceStatus,
} from '@/modules/approval/application/models'

// 使用审批查询 hooks
import {
  useApprovalInstancePage,
  useHandleTask,
} from '@/modules/approval/application/hooks/useApprovalService'

// 使用权限判断工具
import { canClaimTask, isClaimBtnVisible } from '@/modules/approval/application/utils'
```

## 测试

模块各层均有对应的 `__tests__/` 目录，运行：

```bash
pnpm test:unit
```
