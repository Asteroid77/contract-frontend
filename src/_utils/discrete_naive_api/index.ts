import { createDiscreteApi, type NotificationOptions } from 'naive-ui'
const { message, notification, dialog, loadingBar } = createDiscreteApi([
  'message',
  'notification',
  'dialog',
  'loadingBar',
])
/**
 * 使用 Set 来追踪当前正在显示的通知的 key。
 * key 通常是 error.message。
 */
const activeNotifications = new Set<string>()

/**
 * 显示一个带有去重逻辑的错误通知。
 * @param key - 通知的唯一标识，通常是 error.message。
 * @param options - Naive UI 的 NotificationOptions。
 */
const showUniqueErrorNotification = (key: string, options: NotificationOptions) => {
  // 如果同样的错误信息已经在显示，则不执行任何操作
  if (activeNotifications.has(key)) {
    return
  }

  // 将 key 添加到 Set 中，标记为正在显示
  activeNotifications.add(key)

  // 在通知关闭后，从 Set 中移除 key
  const originalOnAfterLeave = options.onAfterLeave
  const extendedOptions: NotificationOptions = {
    ...options,
    onAfterLeave: () => {
      // 通知关闭后，从 Set 中移除 key
      activeNotifications.delete(key)

      // 如果用户原始的 options 中也定义了 onAfterLeave，确保它也被执行
      if (originalOnAfterLeave) {
        originalOnAfterLeave()
      }
    },
  }

  notification.error(extendedOptions)
}
export { message, notification, dialog, loadingBar, showUniqueErrorNotification }
