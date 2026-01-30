/**
 * 获取前端应用的 Origin (协议 + 域名 + 端口)
 *
 * 在 Nginx 反向代理环境下，端口通常为 443 (HTTPS) 或 80 (HTTP) 且被省略。
 * 使用 window.location.origin 可以自动适配当前浏览器的访问地址，
 * 避免了硬编码 https 协议或特定端口的问题。
 */
export const getFrontendOrigin = () => {
  return window.location.origin
}

/**
 * 获取前端登录页面的完整 URL
 * 用于 OAuth2 回调后 postMessage 的目标地址验证
 */
export const getFrontendLoginUrl = () => {
  return `${getFrontendOrigin()}/unauth/login`
}
