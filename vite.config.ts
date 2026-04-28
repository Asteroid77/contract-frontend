import { fileURLToPath, URL } from 'node:url'

import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import vueDevTools from 'vite-plugin-vue-devtools'
import { execSync } from 'child_process'
import tailwindcss from '@tailwindcss/vite'
import { themeGeneratorPlugin } from './vite-plugin/ThemeGeneratorVitePlugin.js'
import svgLoader from 'vite-svg-loader'

// 构建时获取当前git info
const getGitInfo = () => {
  try {
    const commitHash = execSync('git rev-parse --short HEAD').toString().trim()
    // 获取最新的 tag (release 版本)
    const gitTag = execSync('git describe --tags --abbrev=0 2>/dev/null || echo ""')
      .toString()
      .trim()
    const commitDate = execSync('git log -1 --format=%cd').toString().trim()
    const branch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim()
    return {
      commitHash,
      commitDate,
      branch,
      gitTag,
    }
  } catch (e) {
    console.warn('无法获取 Git 信息:', e)
    return {
      commitHash: 'unknown',
      commitDate: 'unknown',
      branch: 'unknown',
      gitTag: 'unknown',
    }
  }
}
const gitInfo = getGitInfo()

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const isProduction = mode === 'production'

  return {
    define: {
      // 注入为全局常量
      __GIT_COMMIT_HASH__: JSON.stringify(gitInfo.commitHash),
      __GIT_COMMIT_DATE__: JSON.stringify(gitInfo.commitDate),
      __GIT_BRANCH__: JSON.stringify(gitInfo.branch),
      __GIT_TAG__: JSON.stringify(gitInfo.gitTag),
    },
    server: {
      port: Number(env.VITE_CLIENT_PORT) || 9098,
      // SSL 由 Nginx 代理处理，开发服务器使用 HTTP
      hmr: {
        host: env.VITE_DOMAIN_URL,
        clientPort: 443, // 必须：让浏览器连接 Nginx 的 443 端口
        protocol: 'wss', // 必须：使用安全 WebSocket
      },
    },
    build: isProduction
      ? {
          minify: 'esbuild',
          esbuild: {
            drop: ['console', 'debugger'],
          },
        }
      : undefined,
    plugins: [vue(), vueJsx(), svgLoader(), vueDevTools(), tailwindcss(), themeGeneratorPlugin()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
        '@protobufjs/inquire': fileURLToPath(
          new URL('./src/app/observability/otel/protobufjs-inquire-browser.ts', import.meta.url),
        ),
      },
    },
  }
})
