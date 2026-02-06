import { type App, type Plugin, type Ref, ref } from 'vue'
import type { ToBeInstalledPlugin, ToBeInstalledPluginList } from './index'
import { usePiniaPlugin } from './usePiniaPlugin'
import { useRouterPlugin } from './useRouterPlugin'
import { useRequestPlugin } from './useRequestPlugin'
import { useI18nPlugin } from './useI18nPlugin'
import { setupCasl } from './casl'
const _installedPlugins = ref(new Set<Plugin>())
/**
 * 注册单个Vue插件
 * @param app Vue实例
 * @param plugin 插件
 * @param option 插件参数
 */
function _usePlugin(app: App<Element>, plugin: Plugin, option?: Record<string, unknown>): void {
  if (_installedPlugins.value.has(plugin)) return // 检查是否已注册
  _installedPlugins.value.add(plugin)
  // 安装插件
  if (option) app.use(plugin, option)
  else app.use(plugin)
}
/**
 * 注册Vue插件
 * @param {App<Element>} app Vue实例
 * @param {ToBeInstalledPlugin | ToBeInstalledPlugin[] | ToBeInstalledPluginList} data 插件或插件列表
 */
export function usePlugins(app: App<Element>): void {
  _initiation(app)
}

/**
 * 获取已安装插件set集合
 * @return {Ref<Set<Plugin>>}
 */
export function getInstalledPlugins(): Ref<Set<Plugin>> {
  return _installedPlugins
}
/**
 * 插件统一初始化
 * @param {App<Element>} app Vue实例
 */
function _initiation(app: App<Element>) {
  const data: ToBeInstalledPlugin | ToBeInstalledPlugin[] | ToBeInstalledPluginList = [
    useI18nPlugin(),
    usePiniaPlugin(),
    useRouterPlugin(),
    useRequestPlugin(),
  ]
  const _processPlugin = (
    item: ToBeInstalledPlugin | ToBeInstalledPlugin[] | ToBeInstalledPluginList,
  ): void => {
    if (Array.isArray(item)) {
      item.forEach((subItem) => _processPlugin(subItem))
    } else {
      _usePlugin(app, item.plugin, item.option)
      if (item.callback) {
        item.callback()
      }
    }
  }
  _processPlugin(data)

  // 初始化 CASL 权限系统
  setupCasl(app)
}
