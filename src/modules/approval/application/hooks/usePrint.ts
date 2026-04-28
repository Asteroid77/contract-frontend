import printJS from 'print-js'
import { getPrintStyles } from '@/modules/approval/presentation/print/style'

export const usePrint = (_filename?: string) => {
  const print = (elementId: string = 'printable-approval-area') => {
    printJS({
      printable: elementId,
      type: 'html',
      style: getPrintStyles(), // 统一获取样式
      scanStyles: false, // 关闭自动扫描，完全提供的 CSS
    })
  }

  return { print }
}
