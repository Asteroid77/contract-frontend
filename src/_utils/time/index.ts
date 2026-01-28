import { computed } from 'vue'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import 'dayjs/locale/en'
import relativeTime from 'dayjs/plugin/relativeTime'
import localizedFormat from 'dayjs/plugin/localizedFormat'
import { language } from '../i18n'

// 加载插件
dayjs.extend(relativeTime)
dayjs.extend(localizedFormat)
// 根据当前语言设置
const locale = computed(() => {
  return language.value.toLocaleLowerCase()
})

// 设置语言
dayjs.locale(locale.value)
// 各种格式化方式
export const formatted = (timeStr: string) => {
  return {
    // 标准格式
    standard: dayjs(timeStr).format('YYYY-MM-DD HH:mm:ss'),

    // 本地化长格式
    long: dayjs(timeStr).format('LLLL'), // 2025年9月17日星期三 12:08

    // 本地化短格式
    short: dayjs(timeStr).format('L LT'), // 2025/09/17 12:08

    // 相对时间
    relative: dayjs(timeStr).fromNow(), // 8个月后

    // 自定义格式
    custom: dayjs(timeStr).format('MM月DD日 HH:mm'),
  }
}
