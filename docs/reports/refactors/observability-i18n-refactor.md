Status: historical
Owner: frontend
Last verified: 2026-04-08
Source of truth: yes

# 可观测性模块 i18n 重构完成报告

**日期**: 2026-02-06
**状态**: 已完成

---

## 完成的工作

### 1. ErrorBoundary 组件重构

从 `.vue` 改为 `.tsx`，样式提取到独立的 `ErrorBoundary.css`。

硬编码文本替换为 i18n：

```typescript
// 之前
errorTitle: '出错了'
errorDescription: '该区域发生了错误，请尝试刷新页面'

// 现在
errorTitle: $t('observability.errorBoundary.title')
errorDescription: $t('observability.errorBoundary.description')
```

### 2. 添加 i18n 翻译

为 `observability` 模块添加了完整的中英文翻译，覆盖错误边界、日志和错误信息三个分类，共 20+ 条词条。

### 3. 清理 console 语句

从以下文件中移除了 console 输出：

- `index.ts` — 初始化日志
- `error-collector.ts` — 调试日志
- `vue-error-collector.ts` — Vue 错误日志
- `js-error-collector.ts` — JS 错误日志

策略：生产环境完全不输出日志。

### 4. 使用 i18n 替换硬编码文本

```typescript
// 之前
message: error.message || 'Unknown error'

// 现在
message: error.message || $t('observability.error.unknownError')
```

---

## 修改统计

| 文件 | 修改内容 |
|------|----------|
| `ErrorBoundary.vue` | 删除 |
| `ErrorBoundary.tsx` | 新建（JSX 版本） |
| `ErrorBoundary.css` | 新建（独立样式） |
| `zh.ts` | 添加 observability 翻译 |
| `en.ts` | 添加 observability 翻译 |
| `index.ts` | 移除 console 语句 |
| `error-collector.ts` | 移除 console + 添加 i18n |
| `vue-error-collector.ts` | 移除 console 语句 |
| `js-error-collector.ts` | 移除 console 语句 |

---

## 使用示例

```vue
<template>
  <!-- 基础用法 -->
  <ErrorBoundary>
    <YourComponent />
  </ErrorBoundary>

  <!-- 自定义错误 UI -->
  <ErrorBoundary>
    <template #fallback="{ error, reset }">
      <div>
        <p>{{ error }}</p>
        <button @click="reset">重试</button>
      </div>
    </template>
    <YourComponent />
  </ErrorBoundary>

  <!-- 自定义文本 -->
  <ErrorBoundary error-title="自定义标题" error-description="自定义描述">
    <YourComponent />
  </ErrorBoundary>
</template>
```

---

## 构建验证

- TypeScript 类型检查通过
- Vite 构建成功
- 无运行时错误
