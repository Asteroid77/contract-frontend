import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('print-js', () => ({
  default: vi.fn(),
}))

vi.mock('@/modules/approval/presentation/print/style', () => ({
  getPrintStyles: vi.fn(() => '.mock-print-style{}'),
}))

import printJS from 'print-js'
import { getPrintStyles } from '@/modules/approval/presentation/print/style'
import { usePrint } from '@/modules/approval/application/hooks/usePrint'

describe('usePrint', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('uses default element id and injected print styles', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    const { print } = usePrint('审批文件')
    print()

    expect(getPrintStyles).toHaveBeenCalledTimes(1)
    expect(printJS).toHaveBeenCalledWith({
      printable: 'printable-approval-area',
      type: 'html',
      style: '.mock-print-style{}',
      scanStyles: false,
    })
    expect(logSpy).not.toHaveBeenCalled()
  })

  it('uses custom element id when provided', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    const { print } = usePrint('自定义文件')
    print('custom-print-node')

    expect(printJS).toHaveBeenCalledWith(
      expect.objectContaining({
        printable: 'custom-print-node',
      }),
    )
    expect(logSpy).not.toHaveBeenCalled()
  })

  it('prints without requiring a filename', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    const { print } = usePrint()
    print('node-id')

    expect(printJS).toHaveBeenCalledWith(
      expect.objectContaining({
        printable: 'node-id',
      }),
    )
    expect(logSpy).not.toHaveBeenCalled()
  })
})
