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
