import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { printElement } from '@/modules/approval/presentation/print/printUtils'

type MockPrintWindow = {
  document: Document
  documentOpen: ReturnType<typeof vi.fn>
  documentWrite: ReturnType<typeof vi.fn>
  documentClose: ReturnType<typeof vi.fn>
  focus: ReturnType<typeof vi.fn>
  print: ReturnType<typeof vi.fn>
  close: ReturnType<typeof vi.fn>
  onload: (() => void) | null
}

const clearElement = (element: Element) => {
  while (element.firstChild) {
    element.removeChild(element.firstChild)
  }
}

const createMockPrintWindow = (): MockPrintWindow => {
  const printDocument = document.implementation.createHTMLDocument('print-window')
  const documentOpen = vi.fn()
  const documentWrite = vi.fn()
  const documentClose = vi.fn()

  printDocument.open = documentOpen as typeof printDocument.open
  printDocument.write = documentWrite as typeof printDocument.write
  printDocument.close = documentClose as typeof printDocument.close

  return {
    document: printDocument,
    documentOpen,
    documentWrite,
    documentClose,
    focus: vi.fn(),
    print: vi.fn(),
    close: vi.fn(),
    onload: null,
  }
}

const appendTargetElement = (id: string, text: string) => {
  const target = document.createElement('div')
  target.id = id
  target.textContent = text
  document.body.appendChild(target)
  return target
}

const appendStyleAndLink = () => {
  const style = document.createElement('style')
  style.textContent = '.foo { color: red; }'

  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = '/assets/app.css'

  document.head.appendChild(style)
  document.head.appendChild(link)

  return { style, link }
}

describe('printElement', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    clearElement(document.body)
    clearElement(document.head)
  })

  afterEach(() => {
    vi.useRealTimers()
    clearElement(document.body)
    clearElement(document.head)
  })

  it('logs error and returns when target element does not exist', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    printElement('missing-id')

    expect(errorSpy).toHaveBeenCalledWith('Print Error: Element #missing-id not found')
  })

  it('logs error and returns when popup is blocked', () => {
    appendTargetElement('to-print', 'hello')

    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(window, 'open').mockReturnValue(null)

    printElement('to-print')

    expect(errorSpy).toHaveBeenCalledWith('Print Error: Popup blocked')
  })

  it('waits for onload when stylesheet links exist before printing', () => {
    vi.useFakeTimers()

    appendTargetElement('to-print', 'content-with-link')
    appendStyleAndLink()

    const printWindow = createMockPrintWindow()
    vi.spyOn(window, 'open').mockReturnValue(printWindow as unknown as Window)

    printElement('to-print', { title: '审批打印' })

    expect(printWindow.documentOpen).not.toHaveBeenCalled()
    expect(printWindow.documentWrite).not.toHaveBeenCalled()
    expect(printWindow.documentClose).not.toHaveBeenCalled()
    expect(printWindow.document.documentElement.outerHTML).toContain('content-with-link')
    expect(printWindow.document.documentElement.outerHTML).toContain('<title>审批打印</title>')
    expect(printWindow.document.getElementById('to-print')).not.toBeNull()
    expect(printWindow.document.getElementById('print-wrapper')).not.toBeNull()
    expect(printWindow.document.head.textContent).toContain('padding: var(--spacing-24, 1.5rem);')

    const copiedLinks = printWindow.document.querySelectorAll(
      'link[rel="stylesheet"]',
    ) as NodeListOf<HTMLLinkElement>
    expect(copiedLinks.length).toBeGreaterThan(0)
    copiedLinks.forEach((node) => {
      expect(node.href.startsWith('http')).toBe(true)
    })

    expect(typeof printWindow.onload).toBe('function')
    expect(printWindow.print).not.toHaveBeenCalled()

    printWindow.onload?.()
    vi.advanceTimersByTime(500)

    expect(printWindow.focus).toHaveBeenCalledTimes(1)
    expect(printWindow.print).toHaveBeenCalledTimes(1)
    expect(printWindow.close).toHaveBeenCalledTimes(1)
  })

  it('prints directly with timeout when no stylesheet link exists', () => {
    vi.useFakeTimers()

    appendTargetElement('to-print', 'content-no-link')

    const style = document.createElement('style')
    style.textContent = '.bar { color: blue; }'
    document.head.appendChild(style)

    const printWindow = createMockPrintWindow()
    vi.spyOn(window, 'open').mockReturnValue(printWindow as unknown as Window)

    printElement('to-print')

    expect(printWindow.documentWrite).not.toHaveBeenCalled()
    expect(printWindow.onload).toBeNull()
    expect(printWindow.print).not.toHaveBeenCalled()

    vi.advanceTimersByTime(500)

    expect(printWindow.focus).toHaveBeenCalledTimes(1)
    expect(printWindow.print).toHaveBeenCalledTimes(1)
    expect(printWindow.close).toHaveBeenCalledTimes(1)
  })
})
