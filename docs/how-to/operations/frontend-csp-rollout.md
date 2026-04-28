# Frontend CSP Rollout

## 目标

- 通过宿主层 HTTP 响应头落地 `Content-Security-Policy-Report-Only`
- 不在前端运行时代码里注入 `<meta http-equiv="Content-Security-Policy">`
- 为后续 `accessUrl` allowlist 和强制模式切换保留收紧空间

## 构建产物

执行 `pnpm build` 后会额外生成：

- `dist/_headers`
  - 适合可直接消费 `_headers` 文件的静态托管平台
- `dist/security/csp-report-only.conf`
  - 适合由 Nginx 或其他反向代理手工引入

## 当前策略

当前 `Report-Only` 策略默认包含：

- `default-src 'self'`
- `object-src 'none'`
- `base-uri 'self'`
- `form-action 'self'`
- `frame-ancestors 'self'`
- `script-src 'self'`
- `style-src 'self' 'unsafe-inline'`
- `img-src 'self' data: blob: https:`
- `font-src 'self' data:`
- `worker-src 'self' blob:`
- `manifest-src 'self'`

其中 `connect-src` 和 `frame-src` 会基于环境变量补充来源，以支持当前 API、可观测性和文件预览链路。

## 可配置环境变量

- `VITE_CSP_CONNECT_SRC_EXTRA`
  - 额外的 `connect-src` 来源，支持空格或逗号分隔
  - 适合补充 OSS 上传、第三方 API、额外观测上报域名
- `VITE_CSP_FRAME_SRC_EXTRA`
  - 额外的 `frame-src` 来源，支持空格或逗号分隔
  - 适合补充 PDF/附件 iframe 预览域名
- `VITE_CSP_REPORT_URI`
  - 浏览器上报 CSP 违规的接收地址

已有环境变量也会参与来源推导：

- `VITE_BACKEND_SERVER_URL`
- `VITE_BACKEND_SERVER_PORT`
- `VITE_OTEL_ENDPOINT`
- `VITE_SOURCEMAP_RESOLVER_ENDPOINT`
- `VITE_OPENREPLAY_INGEST_POINT`

## 已知边界

- 当前仓库里的 OSS 上传和附件预览来源仍然存在动态域名场景，因此第一版 CSP 以 `Report-Only` 为主，不直接切强制模式。
- 若部署环境只提供 `VITE_BACKEND_SERVER_PORT` 而不提供完整后端 URL，构建产物会退化为 `https://*:<port>` 的端口级来源匹配。
- 真正收紧 `connect-src` / `frame-src` 仍需要下一阶段的 `accessUrl` allowlist 与宿主域名梳理。
