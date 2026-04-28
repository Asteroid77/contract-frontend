import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const deleteTrustedTypesFactory = () => {
  Reflect.deleteProperty(window as Window & { trustedTypes?: unknown }, 'trustedTypes')
}

describe('trusted-types policy', () => {
  beforeEach(() => {
    vi.resetModules()
    deleteTrustedTypesFactory()
  })

  afterEach(() => {
    deleteTrustedTypesFactory()
  })

  it('falls back to plain strings when browser trustedTypes is unavailable', async () => {
    const {
      asSanitizedHtmlInput,
      createTrustedHtmlFromSanitized,
      getContractFrontendHtmlPolicy,
    } =
      await import('@/modules/shared/application/security/trusted-types')

    expect(getContractFrontendHtmlPolicy()).toBeNull()
    expect(createTrustedHtmlFromSanitized(asSanitizedHtmlInput('<p>safe</p>'))).toBe(
      '<p>safe</p>',
    )
  })

  it('creates the named policy once and reuses it', async () => {
    const createHTMLSpy = vi.fn((input: string) => `trusted:${input}`)
    const createPolicySpy = vi.fn(() => ({
      createHTML: createHTMLSpy,
    }))

    Object.defineProperty(window, 'trustedTypes', {
      configurable: true,
      value: {
        createPolicy: createPolicySpy,
      },
    })

    const {
      TRUSTED_TYPES_POLICY_NAME,
      asSanitizedHtmlInput,
      createTrustedHtmlFromSanitized,
      getContractFrontendHtmlPolicy,
    } = await import('@/modules/shared/application/security/trusted-types')

    expect(TRUSTED_TYPES_POLICY_NAME).toBe('contract-frontend-html')
    expect(createTrustedHtmlFromSanitized(asSanitizedHtmlInput('<p>one</p>'))).toBe(
      'trusted:<p>one</p>',
    )
    expect(createTrustedHtmlFromSanitized(asSanitizedHtmlInput('<p>two</p>'))).toBe(
      'trusted:<p>two</p>',
    )
    expect(getContractFrontendHtmlPolicy()).toEqual({
      createHTML: createHTMLSpy,
    })
    expect(createPolicySpy).toHaveBeenCalledTimes(1)
    expect(createPolicySpy).toHaveBeenCalledWith(
      'contract-frontend-html',
      expect.objectContaining({
        createHTML: expect.any(Function),
      }),
    )
  })

  it('rejects raw strings when creating TrustedHTML', async () => {
    const { createTrustedHtmlFromSanitized } =
      await import('@/modules/shared/application/security/trusted-types')

    expect(() => createTrustedHtmlFromSanitized('<p>raw</p>' as never)).toThrow(
      /SanitizedHtmlInput/,
    )
  })

  it('creates TrustedHTML only from sanitized payload objects', async () => {
    const createHTMLSpy = vi.fn((input: string) => `trusted:${input}`)

    Object.defineProperty(window, 'trustedTypes', {
      configurable: true,
      value: {
        createPolicy: vi.fn(() => ({
          createHTML: createHTMLSpy,
        })),
      },
    })

    const { asSanitizedHtmlInput, createTrustedHtmlFromSanitized } =
      await import('@/modules/shared/application/security/trusted-types')

    expect(createTrustedHtmlFromSanitized(asSanitizedHtmlInput('<p>safe</p>'))).toBe(
      'trusted:<p>safe</p>',
    )
  })

  it('wraps SharedWorker blob URLs with TrustedScriptURL when supported', async () => {
    const createScriptURLSpy = vi.fn((input: string) => `trusted:${input}`)
    const createPolicySpy = vi.fn(() => ({
      createHTML: (input: string) => input,
      createScriptURL: createScriptURLSpy,
    }))
    const NativeSharedWorker = vi.fn(function SharedWorker(this: unknown) {
      return this
    })

    Object.defineProperty(window, 'trustedTypes', {
      configurable: true,
      value: {
        createPolicy: createPolicySpy,
      },
    })
    Object.defineProperty(globalThis, 'SharedWorker', {
      configurable: true,
      writable: true,
      value: NativeSharedWorker,
    })

    const { installTrustedTypesWorkerConstructors } =
      await import('@/modules/shared/application/security/trusted-types')
    const release = installTrustedTypesWorkerConstructors()

    new SharedWorker('blob:https://example.test/vite-ping-worker')
    new SharedWorker('/src/worker.ts')

    expect(createScriptURLSpy).toHaveBeenCalledTimes(1)
    expect(createScriptURLSpy).toHaveBeenCalledWith('blob:https://example.test/vite-ping-worker')
    expect(NativeSharedWorker).toHaveBeenCalledWith(
      'trusted:blob:https://example.test/vite-ping-worker',
      undefined,
    )
    expect(NativeSharedWorker).toHaveBeenCalledWith('/src/worker.ts', undefined)

    release?.()
    expect(globalThis.SharedWorker).toBe(NativeSharedWorker)
  })
})
