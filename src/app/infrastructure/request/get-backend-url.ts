export const getBackendURL = () => {
  const host = window.location.hostname
  /*
   * 如果配置了完整 URL，直接使用
   * 如果配置了端口，拼接 https://hostname:port
   * 否则使用 https://hostname (默认 443)
   */
  if (import.meta.env.VITE_BACKEND_SERVER_URL) {
    return `${import.meta.env.VITE_BACKEND_SERVER_URL}`
  }

  const port = import.meta.env.VITE_BACKEND_SERVER_PORT
  const baseUrl = port ? `https://${host}:${port}` : `https://${host}`

  // 统一追加 /api 前缀，利用 Nginx 的 rewrite 能力访问后端任意接口
  return `${baseUrl}/api`
}
