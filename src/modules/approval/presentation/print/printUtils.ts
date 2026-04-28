const PRINT_WINDOW_FEATURES = 'width=1000,height=800,left=200,top=100'

const BASE_PRINT_STYLES = `
  body {
    margin: 0;
    padding: var(--spacing-24, 1.5rem);
    background: #fff;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  ::-webkit-scrollbar {
    display: none;
  }
`

const createBaseDocumentStructure = (doc: Document, title: string) => {
  doc.documentElement.lang = 'zh-CN'

  const titleElement = doc.createElement('title')
  titleElement.textContent = title

  const charsetMeta = doc.createElement('meta')
  charsetMeta.setAttribute('charset', 'utf-8')

  const viewportMeta = doc.createElement('meta')
  viewportMeta.setAttribute('name', 'viewport')
  viewportMeta.setAttribute('content', 'width=device-width, initial-scale=1.0')

  const style = doc.createElement('style')
  style.textContent = BASE_PRINT_STYLES

  const wrapper = doc.createElement('div')
  wrapper.id = 'print-wrapper'

  doc.head.replaceChildren(titleElement, charsetMeta, viewportMeta, style)
  doc.body.replaceChildren(wrapper)

  return wrapper
}

const copyPrintStyles = (doc: Document) => {
  const styles = document.querySelectorAll('style, link[rel="stylesheet"]')
  styles.forEach((node) => {
    const clonedNode = node.cloneNode(true)
    doc.head.appendChild(clonedNode)
  })

  doc.querySelectorAll('link[rel="stylesheet"]').forEach((node) => {
    if (!(node instanceof HTMLLinkElement)) {
      return
    }

    const href = node.getAttribute('href')
    if (!href || href.startsWith('http')) {
      return
    }

    node.href = new URL(href, window.location.origin).href
  })
}

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
  const printWin = window.open('', '_blank', PRINT_WINDOW_FEATURES)
  if (!printWin) {
    console.error('Print Error: Popup blocked')
    return
  }

  const doc = printWin.document
  const wrapper = createBaseDocumentStructure(doc, options?.title || 'Print')
  wrapper.appendChild(targetEl.cloneNode(true))

  // 4. 【核心】克隆当前页面的所有样式
  // 这会把 Vue 组件拆分的 CSS、NaiveUI 的 CSS、Tailwind 等全部拷过去
  copyPrintStyles(doc)

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
