import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import vueDevTools from 'vite-plugin-vue-devtools'
import { execSync } from 'child_process'
import tailwindcss from '@tailwindcss/vite'

import fs from 'fs'
import path from 'path'

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
export default defineConfig({
  define: {
    // 注入为全局常量
    __GIT_COMMIT_HASH__: JSON.stringify(gitInfo.commitHash),
    __GIT_COMMIT_DATE__: JSON.stringify(gitInfo.commitDate),
    __GIT_BRANCH__: JSON.stringify(gitInfo.branch),
    __GIT_TAG__: JSON.stringify(gitInfo.gitTag),
  },
  server: {
    port: parseInt('8080'),
    https: {
      key: fs.readFileSync(path.resolve(__dirname, 'src/assert/ssl/localhost+2-key.pem')),
      cert: fs.readFileSync(path.resolve(__dirname, 'src/assert/ssl/localhost+2.pem')),
    },
  },
  plugins: [vue(), vueJsx(), vueDevTools(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
