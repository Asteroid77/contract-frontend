import printJS from 'print-js'
import { getPrintStyles } from '@/components/approval/print/style'

export const usePrint = (filename?: string) => {
  const print = (elementId: string = 'printable-approval-area') => {
    printJS({
      printable: elementId,
      type: 'html',
      style: getPrintStyles(), // 统一获取样式
      scanStyles: false, // 关闭自动扫描，完全提供的 CSS
    })
    console.log('print invoke file name', filename)
  }

  return { print }
}
