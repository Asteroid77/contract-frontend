# contract-frontend

前端仓库，负责合同管理系统的 Vue 3 Web 应用，包括认证与权限、审批、售电协议、工单、共享组件、路由视图和主题系统。

## What This Repository Owns

- 前端应用入口、路由、页面与模块装配
- 业务模块：`access`、`approval`、`captcha`、`file`、`invitation`、`service-agreement`、`user`、`work-order`
- 公共能力：`shared` 模块、主题系统、请求链路、测试与构建脚本
- 仓库级文档治理：根级入口文件、`docs/` 知识库、社区健康文件

## Local Development

### Prerequisites

- Node.js 24
- pnpm 9

### Install

```bash
pnpm install
```

### Start Dev Server

```bash
pnpm dev
```

## Common Commands

```bash
pnpm dev
pnpm check
pnpm test:unit --run
pnpm build
pnpm test:e2e
```

## Module Map

- `src/app/`: 应用装配、主题、插件、基础设施
- `src/modules/access`: 认证、refresh、权限
- `src/modules/approval`: 审批流程与打印
- `src/modules/service-agreement`: 售电协议
- `src/modules/work-order`: 工单业务
- `src/modules/shared`: 跨模块公共能力
- `src/views/`: 页面级入口与路由组合
- `scripts/`: 校验、生成、发布辅助脚本

## Documentation Map

- Human entry: `docs/index.md`
- Agent entry: `AGENTS.md`
- Contribution rules: `CONTRIBUTING.md`
- Security reporting: `SECURITY.md`
- Support path: `SUPPORT.md`

## Collaboration Notes

- 文档治理遵循“先按用途分层，再按模块做子分类”。
- 根级 `README.md` 只做入口，不承载完整知识库正文。
- 模块目录内只保留必要的 `README.md` / `AGENTS.md`，不建立模块内 `docs/`。
