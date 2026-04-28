# Security Policy

## Reporting

如果发现安全问题，不要公开提交 issue，也不要在公开 PR 中描述可利用细节。

请通过既有私有沟通渠道联系仓库维护者，并附带：

- 影响页面或模块
- 复现步骤
- 风险等级判断
- 是否与后端契约或配置联动

## Scope

优先关注：

- 登录、登出、refresh、session recovery
- 权限渲染与越权可见性
- 敏感信息泄漏
- 前端配置、埋点或 sourcemap 暴露

## Handling Notes

- 修复前避免公开披露利用方式
- 如涉及双仓契约，同时通知后端维护者
