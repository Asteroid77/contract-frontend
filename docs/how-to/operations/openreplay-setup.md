Status: active
Owner: frontend
Last verified: 2026-04-16
Source of truth: yes

# OpenReplay 接入与评估指南

## 当前决策

- 当前 VM 中保留 `OpenReplay prod-like` 作为可运行评估环境。
- 当前阶段默认生产路径不启用 replay。
- `SigNoz + frontend-observability + traces` 仍是当前默认生产观测主路径。
- 只有在满足明确门槛时，才把 `OpenReplay` 纳入灰度或生产启用范围。

## 快速配置

### 步骤 1：获取 Project Key

1. 访问你的 OpenReplay 管理后台
   ```
   http://your-openreplay-domain.com
   或
   http://localhost:9000  (如果是本地部署)
   ```

2. 登录后台

3. 进入 **Preferences** → **Projects**

4. 找到你的项目，复制 **Project Key**
   - Project Key 是一个字符串，类似：`abcdefghijklmnop`

---

### 步骤 2：配置环境变量

#### 开发环境 (.env.development)

```bash
# 1. 填入你的 Project Key
VITE_OPENREPLAY_PROJECT_KEY = abcdefghijklmnop  # 替换为实际的 key

# 2. Ingest 端点优先走同源代理
VITE_OPENREPLAY_INGEST_POINT = /observability/frontend/replay

# 3. 启用开关（测试时改为 true）
VITE_OPENREPLAY_ENABLED = false  # 改为 true 启用
```

#### 生产环境 (.env.production)

```bash
# 1. 填入你的 Project Key
VITE_OPENREPLAY_PROJECT_KEY = abcdefghijklmnop  # 替换为实际的 key

# 2. 生产环境也优先保持同源入口
VITE_OPENREPLAY_INGEST_POINT = /observability/frontend/replay

# 3. 当前阶段默认关闭，只有在评估或灰度时才打开
VITE_OPENREPLAY_ENABLED = false
```

---

### 步骤 3：重启应用

```bash
# 开发环境
pnpm run dev

# 生产环境
pnpm run build
```

如果未显式设置 `VITE_OPENREPLAY_INGEST_POINT`，当前 frontend 会默认回落到同源 `/observability/frontend/replay`。这只代表路由默认值存在，不代表当前应该在生产开启 replay。

---

## 验证是否启用

### 方法 1：查看浏览器控制台

打开浏览器控制台（F12），应该能看到：

```
[OpenReplay] Initialized { projectKey: "xxx", ingestPoint: "xxx" }
[OpenReplay] Session started: abc123def456
```

### 方法 2：检查 Session ID

在浏览器控制台执行：

```javascript
sessionStorage.getItem('openreplay_session_id')
// 应该返回一个 session ID，如：abc123def456
```

### 方法 3：查看 OpenReplay 后台

1. 访问 OpenReplay 管理后台
2. 进入 **Sessions** 页面
3. 应该能看到新的会话记录

---

## 开关控制

### 开发环境（默认关闭）

```bash
# .env.development
VITE_OPENREPLAY_ENABLED = false  # 开发时不录制
```

**原因**：
- 开发时不需要录制会话
- 减少性能开销
- 避免产生大量测试数据

### 测试时临时启用

```bash
# .env.development
VITE_OPENREPLAY_ENABLED = true  # 测试时启用
```

然后重启：`pnpm run dev`

### 生产环境（当前默认关闭）

```bash
# .env.production
VITE_OPENREPLAY_ENABLED = false
```

当前建议是：

- 开发环境默认关闭
- 测试或隐私治理验证时临时开启
- 生产环境默认关闭
- 只有在满足门槛并完成隐私评审后，才进入灰度或定向启用

建议门槛：

- `>= 300 DAU`
- 或最近 `30 天 >= 2 次` 前端事故无法靠现有 telemetry 复盘
- 或前端问题已占线上问题 `>= 30%`

---

## OpenReplay 能做什么

### 1. 会话回放
- 完整录制用户操作（鼠标、点击、滚动）
- 像看视频一样回放用户的操作过程

### 2. 错误关联
- 错误发生时，自动关联到用户会话
- 点击 Session URL 直接看用户出错前的操作

### 3. 性能监控
- 页面加载时间
- API 请求耗时
- 资源加载情况

### 4. 用户行为分析
- 用户访问路径
- 点击热力图
- 表单填写情况

---

## 隐私保护

已配置的隐私保护措施：

```typescript
// 自动遮盖邮箱
obscureTextEmails: true

// 忽略敏感请求头
ignoreHeaders: ['Authorization', 'Cookie']

// 不捕获 iframe 内容
captureInIframes: false
```

---

## 故障排查

### 问题 1：控制台没有 OpenReplay 日志

**检查**：
1. `VITE_OPENREPLAY_ENABLED` 是否为 `true`
2. `VITE_OPENREPLAY_PROJECT_KEY` 是否已填入
3. 是否重启了应用

### 问题 2：Session 无法录制

**检查**：
1. OpenReplay 服务是否正常运行
2. `/observability/frontend/replay` 是否已由 Nginx 正确代理到 OpenReplay ingest
3. 浏览器控制台是否有错误

### 问题 3：后台看不到会话

**检查**：
1. Project Key 是否正确
2. 时间范围是否正确（默认显示最近 1 小时）
3. 刷新后台页面

---

## 配置示例

### 完整的开发环境配置

```bash
# .env.development
VITE_OPENREPLAY_ENABLED = false
VITE_OPENREPLAY_PROJECT_KEY = abc123def456ghi789
VITE_OPENREPLAY_INGEST_POINT = /observability/frontend/replay
```

### 完整的生产环境配置

```bash
# .env.production
VITE_OPENREPLAY_ENABLED = false
VITE_OPENREPLAY_PROJECT_KEY = abc123def456ghi789
VITE_OPENREPLAY_INGEST_POINT = /observability/frontend/replay
```

---

## 推荐配置策略

| 环境 | 启用状态 | 原因 |
|------|----------|------|
| **开发环境** | 关闭 | 不需要录制，减少性能开销 |
| **测试环境** | 启用 | 验证集成是否正常 |
| **生产环境** | 默认关闭 | 当前阶段优先保持基础遥测，避免过早引入 replay 成本 |
| **灰度 / 定向排障** | 条件启用 | 仅在满足门槛并完成隐私评审后打开 |

---

## 需要帮助？

如果遇到问题，可以：
1. 查看 OpenReplay 官方文档：https://docs.openreplay.com/
2. 检查 OpenReplay 服务日志
3. 在浏览器控制台查看详细错误信息

---

**配置完成后，记得重启应用。**
