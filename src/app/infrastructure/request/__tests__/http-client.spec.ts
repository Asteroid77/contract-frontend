import { beforeEach, describe, expect, it, vi } from 'vitest'

const { axiosCreateSpy, backendUrlSpy } = vi.hoisted(() => ({
  axiosCreateSpy: vi.fn((options: unknown) => ({ __client: true, __options: options })),
  backendUrlSpy: vi.fn(() => 'https://api.example.com/api'),
}))

vi.mock('axios', () => ({
  default: {
    create: axiosCreateSpy,
  },
}))

vi.mock('@/app/infrastructure/request/get-backend-url', () => ({
  getBackendURL: backendUrlSpy,
}))

describe('http-client', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('creates axios client with expected default options', async () => {
    const module = await import('@/app/infrastructure/request/http-client')

    expect(backendUrlSpy).toHaveBeenCalledTimes(1)
    expect(axiosCreateSpy).toHaveBeenCalledTimes(1)

    const options = axiosCreateSpy.mock.calls[0][0] as any

    expect(options.timeout).toBe(10000)
    expect(options.baseURL).toBe('https://api.example.com/api')
    expect(options.headers).toEqual({
      'Content-Type': 'application/json',
    })

    expect(module.apiClient).toEqual(
      expect.objectContaining({
        __client: true,
      }),
    )
  })

  it('serializes query params with repeat array format', async () => {
    await import('@/app/infrastructure/request/http-client')

    const options = axiosCreateSpy.mock.calls[0][0] as any
    const serialized = options.paramsSerializer.serialize({
      ids: [1, 2],
      keyword: 'abc',
    })

    expect(serialized).toContain('ids=1')
    expect(serialized).toContain('ids=2')
    expect(serialized).toContain('keyword=abc')
  })
})
