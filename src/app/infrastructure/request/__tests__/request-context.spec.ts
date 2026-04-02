import { describe, expect, it } from 'vitest'
import {
  getCurrentRequestContext,
  withRequestContext,
} from '@/app/infrastructure/request/request-context'

describe('request-context stack', () => {
  it('returns undefined when no context exists', () => {
    expect(getCurrentRequestContext()).toBeUndefined()
  })

  it('exposes context during execution and clears after success', async () => {
    const result = await withRequestContext(
      {
        requestId: 'req-1',
      },
      () => {
        const current = getCurrentRequestContext()

        expect(current).toEqual({ requestId: 'req-1' })

        // 验证返回的是浅拷贝，不是栈内原对象
        ;(current as { requestId: string }).requestId = 'mutated'
        expect(getCurrentRequestContext()).toEqual({ requestId: 'req-1' })

        return 'ok'
      },
    )

    expect(result).toBe('ok')
    expect(getCurrentRequestContext()).toBeUndefined()
  })

  it('clears context when executor throws synchronously', async () => {
    await expect(
      withRequestContext(
        {
          requestId: 'req-2',
        },
        () => {
          throw new Error('boom')
        },
      ),
    ).rejects.toThrow('boom')

    expect(getCurrentRequestContext()).toBeUndefined()
  })

  it('supports nested contexts in synchronous branch', async () => {
    await withRequestContext({ requestId: 'outer' }, () => {
      expect(getCurrentRequestContext()).toEqual({ requestId: 'outer' })

      return withRequestContext({ requestId: 'inner' }, () => {
        expect(getCurrentRequestContext()).toEqual({ requestId: 'inner' })
        return 123
      })
    })

    expect(getCurrentRequestContext()).toBeUndefined()
  })
})
