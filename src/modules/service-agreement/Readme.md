# Service Agreement 模块

售电服务协议的备案与签约管理模块。支持协议创建、编辑、分页列表、附件上传、审批发起、打印预览和变更对比。

## 目录结构

```
service-agreement/
├── domain/                        # 领域类型
│   ├── types.ts                   # 协议实体（ServiceAgreement）、营销户号（ServicePointSpecification）、附件 VO
│   ├── enums.ts                   # 状态/价格模式/价格类型/用电类别/文件分类 枚举
│   └── dto.ts                     # 请求 DTO（ServiceAgreementRequestDTO、分页查询、文件上传、预览附件）
├── application/                   # 应用层
│   ├── service.ts                 # 服务门面：uploadFile、sign、record、get、page、duplicateCheck
│   ├── models.ts                  # UI 模型：表单状态（ServiceAgreementForm）、分区数据（UIMap）、分页项
│   ├── mappers.ts                 # 后端 VO → 前端视图模型的映射
│   ├── cleaners.ts                # 提交前 DTO 清洗（trim、空值处理）
│   ├── ui-mappers.ts              # 扁平数据 ↔ UI 分区模型的双向转换
│   ├── validation.ts              # 表单校验规则（按备案/签约状态动态生成）
│   ├── constants.ts               # 枚举选项（价格模式、用电类别、变压器容量、电压等级）
│   ├── transformer-capacity.ts    # 变压器容量相关逻辑
│   ├── hooks/
│   │   └── useSignService.ts      # 签约流程组合式函数
│   └── __tests__/                 # 应用层单元测试
├── infrastructure/                # 基础设施
│   ├── service-agreement-repository.ts  # HTTP 仓储（7 个端点：upload、sign、record、get、page 等）
│   └── __tests__/                 # 仓储层单元测试
└── presentation/                  # UI 层
    ├── sign/                      # 签约/备案表单
    │   ├── ServiceAgreementPage.tsx       # 列表页
    │   ├── ServiceAgreementForm.tsx       # 表单主组件
    │   ├── CustomerInfoSection.tsx        # 客户信息分区
    │   ├── SignInfoSection.tsx            # 签约详情分区
    │   ├── AttachmentSection.tsx          # 附件上传分区
    │   ├── PriceGroupWidget.tsx           # 价格模式组件（含联动禁用）
    │   ├── TimeOfUsePricingWidget.tsx     # 分时电价组件（比例校验总和=100%）
    │   ├── ServicePointSpecification.tsx  # 单个营销户号
    │   ├── ServicePointSpecificationGroup.tsx  # 营销户号列表
    │   ├── ImagesUploader.tsx             # 图片上传组件
    │   ├── MobileAttachmentPreview.tsx    # 移动端附件预览
    │   ├── AttachmentApprovalDiff.tsx     # 附件审批对比
    │   └── __tests__/
    ├── print/                     # 打印预览
    │   ├── ServiceAgreementPrint.tsx      # 协议打印模板
    │   ├── ServiceAgreementAttachmentPrint.tsx  # 附件打印模板
    │   ├── SignDiffTemplate.tsx           # 签约变更对比打印
    │   └── __tests__/
    └── diff-check/                # 变更对比
        ├── serviceAgreementDiffCheck.ts   # 对比字段配置
        └── __tests__/
```

## 主要能力

### 备案与签约

协议有两种核心状态：**备案**（记录客户基本信息）和**签约**（完整的合同签署）。签约状态额外要求价格模式、营销户号、合同附件和到期时间等字段。通过 `service.record()` 提交备案，通过 `service.sign()` 发起签约审批。

### 表单管理

表单采用三分区结构，与 `ServiceAgreementUIMap` 对应：

- **customerInfo**：企业名称、地区、地址、行业、联系人、年用电量、分时电价
- **signInfo**：价格模式、价格类型、价格种类、固定价格/价差、收入分成比例、到期时间、营销户号
- **attachmentInfo**：合同扫描件、电费单、补充附件的文件 ID 列表

校验规则根据状态动态切换，签约状态下 signInfo 和 attachmentInfo 的字段变为必填。

### 附件上传

通过 `service.uploadFile()` 上传文件，支持三种分类：合同扫描件（CONTRACT）、电费单（BILL）、补充附件（ATTACHMENT）。上传过程带进度回调。

### 打印与对比

`presentation/print/` 提供协议和附件的打印模板。`presentation/diff-check/` 配置变更对比字段，配合 shared 模块的 DiffCheckScope 组件展示数据变更。

## 使用方式

```typescript
// 服务调用
import { serviceAgreementService } from '@/modules/service-agreement/application/service'

// 获取协议详情
const detail = await serviceAgreementService.get(agreementId)

// 分页查询
const page = await serviceAgreementService.page({ pageNo: 1, pageSize: 10, data: query })

// 提交备案
const saved = await serviceAgreementService.record(formData)

// 发起签约审批
const instance = await serviceAgreementService.sign(formData)

// 类型导入
import type {
  ServiceAgreementDetail,
  ServiceAgreementForm,
} from '@/modules/service-agreement/application/models'
import type { ServiceAgreementStatus } from '@/modules/service-agreement/domain/enums'

// 常量
import {
  ServiceAgreementStatusEnum,
  PriceModelEnum,
} from '@/modules/service-agreement/application/constants'
```

## 注意事项

- 价格模式与价格种类之间存在联动禁用：收入分成模式下只能选"分成比例"，保底模式下不能选"分成比例"。修改选项时需同步更新 `constants.ts` 和 `validation.ts`。
- 分时电价的四项比例（尖、峰、平、谷）总和必须等于 100%，校验逻辑在 `validation.ts` 的 `percentageRule` 中。
- 本模块是叶子模块，不被其他业务模块依赖。所有类型和服务仅供模块内部使用。
