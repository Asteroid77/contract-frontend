/**
 * 打印指定的 DOM 元素
 * @param elementId 要打印的容器 ID
 * @param options 配置项
 */
export function printElement(elementId: string, options?: { title?: string }) {
  // 1. 获取目标内容
  const targetEl = document.getElementById(elementId)
  if (!targetEl) {
    console.error(`Print Error: Element #${elementId} not found`)
    return
  }

  // 2. 创建新窗口 (宽高设大一点，避免布局错乱)
  const printWin = window.open('', '_blank', 'width=1000,height=800,left=200,top=100')
  if (!printWin) {
    console.error('Print Error: Popup blocked')
    return
  }

  const doc = printWin.document

  // 3. 写入基础 HTML 结构
  doc.open()
  doc.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${options?.title || 'Print'}</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          /* 基础打印修正 */
          body {
            margin: 0;
            padding: 20px;
            background: #fff;
            -webkit-print-color-adjust: exact; /* 强制打印背景色 */
            print-color-adjust: exact;
          }
          /* 隐藏打印窗口中的滚动条 */
          ::-webkit-scrollbar { display: none; }
        </style>
      </head>
      <body>
        <div id="print-wrapper">
          ${targetEl.outerHTML} <!-- 插入目标 HTML -->
        </div>
      </body>
    </html>
  `)

  // 4. 【核心】克隆当前页面的所有样式
  // 这会把 Vue 组件拆分的 CSS、NaiveUI 的 CSS、Tailwind 等全部拷过去
  const styles = document.querySelectorAll('style, link[rel="stylesheet"]')
  styles.forEach((node) => {
    // 使用 cloneNode(true) 深拷贝
    doc.head.appendChild(node.cloneNode(true))
  })

  // 确保 link 标签的 href 是绝对路径 (防止相对路径在新窗口失效)
  doc.querySelectorAll('link').forEach((link) => {
    if (link.href && !link.href.startsWith('http')) {
      link.href = new URL(link.getAttribute('href') || '', window.location.origin).href
    }
  })

  doc.close()

  // 5. 等待资源加载完成后打印
  // 很多时候 CSS 加载需要一点点时间，如果是图片较多，最好用 onload
  // 这里用一个简单的逻辑：检查 link 标签加载 + 延时兜底

  const doPrint = () => {
    // 给予浏览器渲染引擎一点缓冲时间 (特别是图片和字体)
    setTimeout(() => {
      printWin.focus()
      printWin.print()

      // 6. 打印完（或取消后）关闭窗口
      // 注意：部分浏览器在 print() 阻塞期间不会执行下面的代码，直到用户操作完毕
      // 为了兼容性，有些浏览器需要在鼠标移动或获焦后才能关闭
      // 这里做一个简单的延时关闭，或者监听 afterprint (兼容性一般)

      // 实际上最稳妥的是：不自动关闭，让用户自己关。
      // 但如果你非要自动关：
      printWin.close()
    }, 500)
  }

  // 如果页面包含外部 CSS (link)，等待它们加载
  // 如果全是 style 标签 (Vite 开发模式)，直接打印
  if (doc.querySelectorAll('link[rel="stylesheet"]').length > 0) {
    printWin.onload = doPrint
  } else {
    doPrint()
  }
}
