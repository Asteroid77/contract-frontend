const CONTRACT_FRONTEND_HTML_POLICY = 'contract-frontend-html'

export type SanitizedHtmlInput = {
  readonly kind: 'sanitized-html'
  readonly value: string
}

type TrustedTypesPolicyShape = {
  createHTML(input: string): string
  createScriptURL?(input: string): string
}

type TrustedTypesPolicyFactory = {
  createPolicy(name: string, rules: TrustedTypesPolicyShape): TrustedTypesPolicyShape
}

const getTrustedTypesFactory = (): TrustedTypesPolicyFactory | null => {
  if (typeof window === 'undefined' || typeof window.trustedTypes === 'undefined') {
    return null
  }

  return window.trustedTypes as TrustedTypesPolicyFactory
}

let trustedTypesPolicy: TrustedTypesPolicyShape | null | undefined
let trustedTypesPolicyFactory: TrustedTypesPolicyFactory | null | undefined

export const getContractFrontendHtmlPolicy = () => {
  const factory = getTrustedTypesFactory()

  if (trustedTypesPolicy !== undefined) {
    if (trustedTypesPolicyFactory === factory) {
      return trustedTypesPolicy
    }
  }

  if (!factory) {
    trustedTypesPolicyFactory = null
    trustedTypesPolicy = null
    return trustedTypesPolicy
  }

  trustedTypesPolicyFactory = factory
  trustedTypesPolicy = factory.createPolicy(CONTRACT_FRONTEND_HTML_POLICY, {
    createHTML(input) {
      return input
    },
    createScriptURL(input) {
      return input
    },
  })

  return trustedTypesPolicy
}

export const asSanitizedHtmlInput = (value: string): SanitizedHtmlInput => ({
  kind: 'sanitized-html',
  value,
})

function assertSanitizedHtmlInput(value: unknown): SanitizedHtmlInput {
  if (
    typeof value !== 'object' ||
    value === null ||
    !('kind' in value) ||
    !('value' in value) ||
    (value as { kind?: string }).kind !== 'sanitized-html' ||
    typeof (value as { value?: unknown }).value !== 'string'
  ) {
    throw new TypeError('createTrustedHtmlFromSanitized requires SanitizedHtmlInput')
  }

  return value as SanitizedHtmlInput
}

export const createTrustedHtmlFromSanitized = (input: SanitizedHtmlInput | unknown) => {
  const payload = assertSanitizedHtmlInput(input)

  return getContractFrontendHtmlPolicy()?.createHTML(payload.value) ?? payload.value
}

export const createTrustedScriptUrl = (input: string) =>
  getContractFrontendHtmlPolicy()?.createScriptURL?.(input) ?? input

export const TRUSTED_TYPES_POLICY_NAME = CONTRACT_FRONTEND_HTML_POLICY

const needsTrustedWorkerScriptUrl = (value: unknown): value is string =>
  typeof value === 'string' && value.startsWith('blob:')

type WorkerConstructor = {
  new (scriptURL: string | URL, options?: WorkerOptions): Worker
  prototype: Worker
}

type SharedWorkerConstructor = {
  new (scriptURL: string | URL, options?: string | WorkerOptions): SharedWorker
  prototype: SharedWorker
}

const wrapWorkerConstructor = <TConstructor extends WorkerConstructor | SharedWorkerConstructor>(
  NativeConstructor: TConstructor,
) => {
  const TrustedWorkerConstructor = function WorkerConstructor(
    this: Worker | SharedWorker,
    scriptURL: string | URL,
    options?: string | WorkerOptions,
  ) {
    const nextScriptURL = needsTrustedWorkerScriptUrl(scriptURL)
      ? createTrustedScriptUrl(scriptURL)
      : scriptURL

    return Reflect.construct(
      NativeConstructor,
      [nextScriptURL, options],
      new.target ?? NativeConstructor,
    )
  } as unknown as TConstructor

  TrustedWorkerConstructor.prototype = NativeConstructor.prototype

  return TrustedWorkerConstructor
}

export function installTrustedTypesWorkerConstructors(): (() => void) | null {
  if (typeof window === 'undefined' || typeof window.trustedTypes === 'undefined') {
    return null
  }

  const NativeWorker = globalThis.Worker
  const NativeSharedWorker = globalThis.SharedWorker
  let installedWorker = false
  let installedSharedWorker = false

  if (typeof NativeWorker === 'function') {
    Object.defineProperty(globalThis, 'Worker', {
      configurable: true,
      writable: true,
      value: wrapWorkerConstructor(NativeWorker),
    })
    installedWorker = true
  }

  if (typeof NativeSharedWorker === 'function') {
    Object.defineProperty(globalThis, 'SharedWorker', {
      configurable: true,
      writable: true,
      value: wrapWorkerConstructor(NativeSharedWorker),
    })
    installedSharedWorker = true
  }

  if (!installedWorker && !installedSharedWorker) {
    return null
  }

  return () => {
    if (installedWorker) {
      Object.defineProperty(globalThis, 'Worker', {
        configurable: true,
        writable: true,
        value: NativeWorker,
      })
    }

    if (installedSharedWorker) {
      Object.defineProperty(globalThis, 'SharedWorker', {
        configurable: true,
        writable: true,
        value: NativeSharedWorker,
      })
    }
  }
}
