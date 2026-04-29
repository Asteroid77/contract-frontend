Status: active
Owner: frontend
Last verified: 2026-04-29
Source of truth: yes

# Governance Entry

本仓库默认遵循共享治理上游：

- Upstream: `/home/meteor/DEV/projects/test/engineering-governance`
- Version: `local-working-tree (2026-04-20)`

## Purpose

- 提供当前仓库的治理入口
- 指向共享治理真源
- 记录当前仓库的本地治理覆盖

## Scope

- 覆盖：
  - 共享治理上游入口
  - 当前仓库的本地治理适配说明
  - 当前仓库保留的治理级覆盖
- 不覆盖：
  - 共享治理模板正文
  - 共享治理生命周期正文
  - 共享治理 policies 正文

## Details

- 共享治理真源位于：
  - `/home/meteor/DEV/projects/test/engineering-governance/AGENTS.md`
  - `/home/meteor/DEV/projects/test/engineering-governance/policies/`
  - `/home/meteor/DEV/projects/test/engineering-governance/templates/`
  - `/home/meteor/DEV/projects/test/engineering-governance/lifecycle/doc-lifecycle.md`
- 当前仓库根级 `AGENTS.md` 是 adapter，而不是共享治理副本。
- 当前仓库不再保留 `design/plan/handoff/doc/lifecycle` 的本地完整投影，避免与上游治理发生规则漂移。
- 当前仓库的本地治理覆盖仅包括：
  - UI 文案、错误反馈、权限边界、请求链路、可观测性策略、CSP/安全策略变更，必须同步更新对应文档与检查命令。
  - 保留现有未提交改动，不回滚不相关文件；若发现冲突，先厘清责任边界后再改。
  - 创建本仓库 worktree 后，先复制源工作区中验证所需且被 git 忽略的 `.env*` 文件；这些文件必须继续保持未跟踪，不得提交。
  - 创建本仓库 worktree 后，先运行 `pnpm install --frozen-lockfile` 恢复依赖再执行检查；只有在明确需要更新依赖元数据时才使用普通 `pnpm install`。

## Related Docs

- `/home/meteor/DEV/projects/test/engineering-governance/README.md`
- `/home/meteor/DEV/projects/test/engineering-governance/AGENTS.md`
- `/home/meteor/DEV/projects/test/contract-frontend/AGENTS.md`
- `/home/meteor/DEV/projects/test/contract-frontend/docs/index.md`
