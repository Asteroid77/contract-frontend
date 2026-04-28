Status: active
Owner: frontend
Last verified: 2026-04-19
Source of truth: yes

# Frontend Security Hardening Handoff

## Current Context

- 当前主工作分支为 `dev`，并且已与 `origin/dev` 同步。
- 已单独创建安全加固专用分支与 worktree：
  - Branch: `feat/frontend-security-hardening`
  - Worktree: `/home/meteor/.config/superpowers/worktrees/contract-frontend/feat/frontend-security-hardening`
- 当前本地环境中，dev Nginx 配置已经更新并 reload 成功，但原始排查会话里到观测 VM 的上游端点 `192.168.0.113:3001/4813/9001` 不可达，因此环境侧连通性仍是交接时的主要不确定项。

## What Is Already Done

- 已将 dev `Content-Security-Policy-Report-Only` 从宽泛的 `https:` 收紧为显式 origin。
- 已将 `accessUrl` allowlist、Nginx CSP 共用 origins 和 worker source 表达式统一到前端单一真源：
  - `src/modules/shared/application/security/access-policy.json`
  - `scripts/sync-frontend-security-origins.mjs`
- 已移除 `VITE_ACCESS_URL_ALLOWED_HOSTS`，避免 allowlist 与 CSP 漂移。
- 已为 dev `Report-Only` 头补齐浏览器原生 CSP reporting：
  - `Reporting-Endpoints`
  - `report-uri`
  - `report-to`
- 已将前端 observability 入口切到同源路径：
  - `VITE_OTEL_ENDPOINT=/observability/otel`
  - `VITE_SOURCEMAP_RESOLVER_ENDPOINT=/observability/resolver`
  - `VITE_OPENREPLAY_INGEST_POINT=/observability/replay`
- 前端 runtime 已监听 `securitypolicyviolation`，并将 enriched CSP 事件送入现有 observability pipeline。
- Source Map Resolver 已扩展 `/v1/csp-reports`，同时接受：
  - 浏览器原生 CSP 报告
  - 前端 enriched `securitypolicyviolation` payload

## Conclusions Already Reached

- 当前认证架构是纯 SPA 方案。
- `token-manager + browser storage` 是认证 source of truth；Pinia 不是 auth source of truth。
- 当前最大安全风险是 XSS，而不是 token 不在 Pinia 中。
- 后端已经具备：
  - refresh token rotation
  - logout / device revoke / password change 同时失效 access/refresh token
- 当前 token 策略为：
  - access token：2 小时
  - refresh token：1 个月
- CSP 值得在静态前端应用中启用，并且应部署在 hosting / HTTP response header 层，而不是 app runtime 层。
- 推荐 rollout 顺序已经确定：
  1. `Content-Security-Policy-Report-Only`
  2. 观察 violations
  3. 收紧策略并切到 enforce
- `accessUrl` 的限制应通过共享 allowlist 实现，不应让各组件维护独立 host 配置。

## Verified Findings

- 业务代码中未发现明显直接 DOM XSS sink：
  - 无 `v-html`
  - 无业务 `innerHTML`
  - 无 `dangerouslySetInnerHTML`
- 当前最高风险区域已确认：
  1. Markdown preview policy
  2. `accessUrl` trust boundary
  3. Missing CSP
- `md-editor-v3@6.3.1` 本地验证结果：
  - 常见脚本型 payload 会被 neutralize 或 block：
    - `<script>`
    - `img onerror`
    - `javascript:` links
    - `iframe srcdoc`
    - `iframe src="javascript:..."`
  - 仍允许普通 `https://...` iframe embed
  - 结论：
    - 它不是裸露的 XSS sink
    - 但 iframe embedding policy 仍需显式治理
- `accessUrl` 当前被直接用于多个 trust-sensitive 场景：
  - `iframe src`
  - `a href`
  - `window.open`
  - `fetch`
- 当前实现状态：
  - `access-policy.json` 已承担协议 / host 约束真源
  - 组件已改为依赖 `resolveAllowedAccessUrl(...)`，而不是各自维护 host 配置
- 原始排查会话中的部署 caveat 仍成立：
  - 前端代码路径、resolver 代码、local Nginx headers 已更新
  - 但端到端送达 observability VM 仍需要环境侧部署 / 连通性验证

## Open Items

- 确认 observability VM 端点是否能从 dev Nginx host 正常到达。
- redeploy 更新后的 `sourcemap-resolver`。
- 人工制造真实 CSP violation，并确认它能落到 OTEL / SigNoz。
- 明确 markdown / iframe 的最终嵌入策略。
- 补 XSS regression tests。
- 复查 production `console.log` / 诊断日志暴露面，并周期性重扫危险 API。

## Recommended Next Steps

1. 先确认 observability VM 端点在 dev Nginx host 侧已经可达，避免把环境连通性问题误判为前端未生效。
2. redeploy 更新后的 `sourcemap-resolver`，然后制造一次真实 CSP violation，验证浏览器报告、前端 enriched 事件和 OTEL / SigNoz 收集链路。
3. 在 CSP 链路闭环后，继续推进 markdown / iframe policy、`accessUrl` 约束回归测试以及 XSS regression suite。

## Risks / Caveats

- 当前前端安全加固里，最大风险始终是 XSS，而不是 Pinia 与 browser storage 的选择本身。
- 该 security 分支更适合承载新增 hardening 工作；较高概率是历史相关工作已被吸收进 `dev`，不应在接手时重新发明旧改动。
- 环境侧连通性问题会让“代码和 header 已更新”的状态看起来像“仍未完成”，接手时应先验证环境，再判断代码问题。

## Related Docs

- `/home/meteor/DEV/projects/test/contract-frontend/docs/how-to/operations/csp-rollout-template.md`
- `/home/meteor/DEV/projects/test/contract-frontend/docs/explanation/modules/access/request-auth-refresh.md`
- `/home/meteor/DEV/projects/test/contract-frontend/docs/how-to/operations/frontend-observability.md`
