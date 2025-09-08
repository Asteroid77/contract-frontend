// src/types/vite-env.d.ts
/// <reference types="vite/client" />
// 为 Vite 定义的全局常量声明类型
declare const __GIT_COMMIT_HASH__: string
declare const __GIT_BRANCH__: string
declare const __BUILD_TIME__: string
declare const __GIT_TAG__: string

// 表单输入类型（允许空字符串）
type FormInput<T> = {
  [K in keyof T]?: T[K]
}

// 验证后的提交类型
type ValidatedFormData<T, N = null> = {
  [K in keyof (N extends null ? T : Omit<T, N>)]: T[K]
} & {
  [K in N]?: T[K]
}

type ZwFormSubmit<T> = (valid: boolean, formData: boolean extends true ? T : FormInput<T>) => void
