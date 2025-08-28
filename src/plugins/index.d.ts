import type { Plugin } from 'vue'

/**
 * 需要应用的插件
 */
export type ToBeInstalledPlugin = {
  /**
   * 插件本体
   */
  plugin: Plugin
  /**
   * 插件option
   */
  option?: Recrod<string, unknown>
  /** 成功挂载后回调函数 */
  callback?: (...args: unknown) => unknown
}
/**
 * 需要应用的插件列表
 */
export type ToBeInstalledPluginList = (ToBeInstalledPlugin | ToBeInstalledPlugin[])[]
