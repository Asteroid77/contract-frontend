# service-agreement 模块 Agent 指令

## 全局规则引用

本模块内改动仍以本模块边界与分层规则为先；但 UI（discrete / theme）、文案（i18n）与搜索（advanced_query，`ModernQueryBuilder`）规则统一遵循 `Rule.md`。

## 定位

`src/modules/service-agreement` 负责售电服务协议的备案与签约管理。涵盖协议的创建、编辑、分页查询、附件上传、审批发起、打印预览和变更对比。本模块是独立的业务模块，不对外提供可复用能力。

## 目录与职责

```
service-agreement/
├── domain/           # 领域类型：协议实体、营销户号、枚举（状态/价格模式/用电类别）、DTO
├── application/      # 应用层：service 门面、DTO 映射、表单校验、UI 模型、常量、hooks
├── infrastructure/   # 仓储实现：service-agreement-repository（HTTP 调用）
├── presentation/     # UI 层
│   ├── sign/         # 签约/备案表单页面及子组件
│   ├── print/        # 打印预览模板
│   └── diff-check/   # 协议变更对比配置
```

## 依赖约束

### 允许

- `import` `@/modules/shared` 下的任何导出（类型、工具函数、UI 组件、useRequest）。
- `import` `@/modules/file/domain/types`（OssCallbackDTO）和 `@/modules/file/application/models`（OssCallbackView, toOssCallbackView）。
- `import` `@/modules/approval/domain/types`（ApprovalInstance 泛型）。
- infrastructure 层可依赖 `@/modules/shared/infrastructure`（useRequest、API 前缀生成）。
- application 层可依赖 `@/_utils/i18n`（$t 国际化函数）。

### 禁止

- 禁止 `import` 其他业务模块的 application/infrastructure/presentation 层实现（file 和 approval 仅限上述类型导入）。
- domain 层禁止依赖 infrastructure、presentation、Vue、Naive UI 等框架实现。唯一例外：`domain/dto.ts` 依赖 `shared/domain/query`（QueryFilters 类型）。
- 禁止将本模块的类型或服务导出给其他业务模块使用。本模块是叶子模块，不被其他业务模块依赖。

## 关键设计点

1. **双状态模型**：协议有"备案"和"签约"两种状态，签约状态要求更多必填字段（价格模式、营销户号、附件、到期时间）。表单校验规则（`validation.ts`）根据状态动态生成。
2. **UI 分区模型**：`application/models.ts` 定义了 `ServiceAgreementUIMap`，将扁平的协议数据拆分为 `customerInfo`、`signInfo`、`attachmentInfo` 三个 UI 分区，与表单组件一一对应。
3. **DTO 清洗**：`cleaners.ts` 在提交前对请求 DTO 做清洗（trim、空值处理），`mappers.ts` 负责后端 VO 到前端视图模型的转换。
4. **审批集成**：签约操作通过 `service.sign()` 发起审批流程，返回 `ApprovalInstance<ServiceAgreementRequestDTO>`，后续流程由 approval 模块接管。

## 修改本模块的规则

1. 修改 `domain/` 下的类型时，同步检查 `application/mappers.ts` 和 `application/cleaners.ts` 是否需要适配。
2. 调整表单校验逻辑时，注意备案/签约两种状态的规则差异，避免破坏条件校验的完整性。
3. 价格模式（PriceModel）与价格种类（PriceCategory）之间存在联动禁用逻辑，修改选项时需同步更新 `constants.ts` 和 `validation.ts`。
4. 营销户号（ServicePointSpecification）的变压器容量和电压等级选项定义在 `constants.ts`，修改时确认是否与后端枚举一致。
5. 改动后运行 `pnpm test:unit` 验证，相关测试位于 `application/__tests__/` 和 `presentation/**/__tests__/`。
