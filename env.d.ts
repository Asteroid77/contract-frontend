/// <reference types="vite/client" />
/// <reference types="vite-svg-loader" />
interface ImportMetaEnv {
  /**
   * 根地址
   */
  readonly VITE_BASE_URL: string
  /**
   * 项目启动环境
   */
  readonly VITE_ENV: 'dev' | 'prod'

  /**
   * 后端服务器地址(如需设置)
   */
  readonly VITE_BACKEND_SERVER_URL: string

  /**
   * 后端服务器端口
   */
  readonly VITE_BACKEND_SERVER_PORT: string

  /**
   * sourceMap转换的服务器地址
   */
  readonly VITE_SOURCEMAP_SERVER_URL: string

  /**
   * OpenTelemetry 采集端点
   */
  readonly VITE_OTEL_ENDPOINT: string

  /**
   * Source Map 解析端点
   */
  readonly VITE_SOURCEMAP_RESOLVER_ENDPOINT: string

  /**
   * OpenReplay 项目 Key
   */
  readonly VITE_OPENREPLAY_PROJECT_KEY: string

  /**
   * OpenReplay 数据采集端点
   */
  readonly VITE_OPENREPLAY_INGEST_POINT: string

  /**
   * 是否启用 OpenReplay
   */
  readonly VITE_OPENREPLAY_ENABLED: string

  /**
   * 额外的 CSP connect-src 来源，空格或逗号分隔
   */
  readonly VITE_CSP_CONNECT_SRC_EXTRA: string

  /**
   * 额外的 CSP frame-src 来源，空格或逗号分隔
   */
  readonly VITE_CSP_FRAME_SRC_EXTRA: string

  /**
   * CSP 违规上报地址
   */
  readonly VITE_CSP_REPORT_URI: string

  /**
   * 启动端口
   */
  readonly VITE_CLIENT_PORT: number

  /**
   * 打包后文件地址
   */
  readonly VITE_OUT_DIR: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

interface Window {
  $message?: {
    success: (message: string) => void
  }
  trustedTypes?: {
    createPolicy: (
      name: string,
      rules: {
        createHTML: (input: string) => string
      },
    ) => {
      createHTML: (input: string) => string
    }
  }
}
