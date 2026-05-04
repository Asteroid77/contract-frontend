Status: active
Owner: frontend
Last verified: 2026-04-19
Source of truth: yes

# Documentation Index

仓库入口：`../README.md`
Agent 入口：`../AGENTS.md`
贡献规则：`../CONTRIBUTING.md`

## Explanation

- `explanation/architecture/`: 请求链路、主题、反馈策略等跨模块说明
  - `explanation/architecture/request-feedback-success-toast.md`
- `explanation/modules/`: access、approval、service-agreement 等模块说明
  - `explanation/modules/access/request-auth-refresh.md`

## How-To

- `how-to/development/`: 本地开发与协作
- `how-to/operations/`: 性能、构建、埋点、运行排障
  - `how-to/operations/frontend-observability.md`
  - `how-to/operations/clickhouse-internal-logs-sizing.md`
  - `how-to/operations/perf-playbook.md`
  - `how-to/operations/openreplay-setup.md`
  - `how-to/operations/frontend-csp-rollout.md`
  - `how-to/operations/csp-rollout-template.md`
  - 当前 Trusted Types / CSP 落地计划归档参考：`plans/completed/2026-04-21-trusted-types-rollout.md`
  - Markdown DOMPurify / Trusted Types 标准化归档参考：`plans/completed/2026-04-24-markdown-trusted-types-standardization-plan.md`
- `how-to/modules/`: 模块使用型说明
  - `how-to/modules/access/casl-integration.md`

## Reference

- `reference/api/`: 契约文件与接口参考
  - `reference/api/design-contract.yaml`
- `reference/design-system/`: 设计 token 与风格契约
  - `reference/design-system/design-token-spec.yaml`
- `design-system/`: 设计系统说明、设计交付与 token 使用指导
  - `design-system/design-token-rationale.md`
  - `design-system/token-to-figma-brief.md`
- `reference/development/`: 开发脚本与约定
  - `reference/development/scripts-annotations.md`
- `reference/modules/`: 模块级对接文档与模板
- `reference/testing/`: 测试目录与条例清单
  - `reference/testing/views-test-cases-catalog.md`

## ADR

- `adr/`: 重要架构决策记录

## Plans

- `plans/active/`: 仍在推进或尚未关闭的计划
  - `plans/active/2026-04-03-frontend-security-hardening-handoff.md`
  - `plans/active/2026-04-12-first-batch-e2e-rollout.md`
  - `plans/active/2026-04-16-openreplay-frontend-integration-privacy-design.md`
  - `plans/active/2026-04-27-csp-violation-anti-storm-plan.md`
- `plans/completed/`: 已完成计划与设计留痕
  - `plans/completed/2026-04-14-frontend-observability-trace-replay-design.md`
  - `plans/completed/2026-04-14-frontend-observability-trace-replay-plan.md`
  - `plans/completed/2026-04-14-frontend-observability-design.md`
  - `plans/completed/2026-04-14-frontend-observability-service.md`
  - `plans/completed/2026-04-15-openreplay-prod-like-deployment-design.md`
  - `plans/completed/2026-04-15-openreplay-prod-like-deployment-plan.md`
  - `plans/completed/2026-04-16-observability-compose-tiering-design.md`
  - `plans/completed/2026-04-16-observability-compose-tiering-plan.md`
  - `plans/completed/2026-04-21-trusted-types-rollout.md`
  - `plans/completed/2026-04-24-markdown-trusted-types-standardization-plan.md`
  - `plans/completed/commit-plan.md`
  - `plans/completed/2026-03-18-auth-feedback-boundary.md`

## Reports

- `reports/`: 复盘、评审、变更、审计与排障记录
  - `reports/architecture/layout-router-review.md`
  - `reports/refactors/router-architecture-refactor.md`
  - `reports/testing/module-test-coverage-audit.md`
  - `reports/ux/request-feedback-success-audit.md`

## Generated

- `generated/`: 自动生成文档，只读，不手工维护

## Archive

- `archive/`: 已归档资料

## Governance

- `governance/README.md`: 本地治理入口；共享治理真源位于 `/home/meteor/DEV/projects/test/engineering-governance`
