import { globalIgnores } from 'eslint/config'
import {
  defineConfigWithVueTs,
  vueTsConfigs,
  configureVueProject,
} from '@vue/eslint-config-typescript'
import pluginVue from 'eslint-plugin-vue'
import pluginVitest from '@vitest/eslint-plugin'
import pluginPlaywright from 'eslint-plugin-playwright'
import skipFormatting from '@vue/eslint-config-prettier/skip-formatting'

// 1. 显式开启 TSX 支持
// 你的 files 包含了 .tsx，必须开启此选项，否则解析器会报错或变慢
configureVueProject({ scriptLangs: ['ts', 'tsx'] })

export default defineConfigWithVueTs(
  // 2. 全局忽略 (最高优先级)
  // 使用 globalIgnores 可以让 ESLint 在读取文件系统时直接跳过这些目录，性能最好
  globalIgnores([
    '**/dist/**',
    '**/dist-ssr/**',
    '**/coverage/**',
    '**/node_modules/**',
    '**/*.d.ts',
    '**/auto-imports.d.ts',
    '**/components.d.ts',
    'src/assets/**',
    'public/**',
    '**/scripts/**',
    '**/vite-plugin/**',
  ]),

  // 3. Vue 基础规则
  pluginVue.configs['flat/essential'],

  // 4. Vue + TypeScript 推荐规则
  // 注意：这包含了基于类型的规则，是卡顿的主要来源
  vueTsConfigs.recommended,

  // 5. Vitest 测试文件规则
  {
    ...pluginVitest.configs.recommended,
    files: ['src/**/__tests__/*', '**/*.spec.ts', '**/*.test.ts'],
  },

  // 6. E2E 测试文件规则
  {
    ...pluginPlaywright.configs['flat/recommended'],
    files: ['e2e/**/*.{test,spec}.{js,ts,jsx,tsx}'],
  },

  // 7. TypeScript 解析器深度配置 (针对卡顿的优化)
  {
    languageOptions: {
      parserOptions: {
        // 开启基于 Project Service 的类型检查 (比旧版 parserOptions.project 快)
        projectService: true,
        // 确保指向项目根目录
        tsconfigRootDir: import.meta.dirname,

        // 针对大型项目的内存/性能优化
        // @see https://github.com/typescript-eslint/typescript-eslint/issues/11530
        EXPERIMENTAL_useSourceOfProjectReferenceRedirect: true,

        // 限制 ESLint 使用的内存 (根据你的机器配置调整，太大可能导致 GC 频繁)
        // 如果依然很卡，可以尝试调低一点或移除
        memoryLimit: 4096,
      },
    },
  },
  {
    rules: {
      // 允许下划线开头的变量/参数未使用
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_', // 忽略 _ 开头的函数参数
          varsIgnorePattern: '^_', // 忽略 _ 开头的变量
          destructuredArrayIgnorePattern: '^_', // 忽略解构中 _ 开头的项
        },
      ],
    },
  },
  // 8. Prettier 冲突处理 (必须放在最后)
  skipFormatting,
)
