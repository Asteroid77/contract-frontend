import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ObservabilityConfig } from '@/app/observability/types'

type MockSpan = {
  setAttribute: (key: string, value: unknown) => void
  setStatus: (status: unknown) => void
  recordException: (error: unknown) => void
  end?: () => void
  spanContext: () => {
    traceId: string
    spanId: string
  }
}

const {
  webTracerProviderCtor,
  providerRegisterSpy,
  providerShutdownSpy,
  batchSpanProcessorCtor,
  simpleSpanProcessorCtor,
  exporterCtor,
  zoneContextManagerCtor,
  resourceFromAttributesSpy,
  registerInstrumentationsSpy,
  fetchInstrumentationCtor,
  documentLoadInstrumentationCtor,
  tracerStartActiveSpanSpy,
  traceGetTracerSpy,
  traceGetActiveSpanSpy,
  activeSpanHolder,
  spanStatusCode,
} = vi.hoisted(() => {
  const providerRegister = vi.fn()
  const providerShutdown = vi.fn(() => Promise.resolve())

  const WebTracerProvider = vi.fn(() => ({
    register: providerRegister,
    shutdown: providerShutdown,
  }))

  const BatchSpanProcessor = vi.fn(() => ({ type: 'batch' }))
  const SimpleSpanProcessor = vi.fn(() => ({ type: 'simple' }))
  const OTLPTraceExporter = vi.fn(() => ({ type: 'exporter' }))
  const ZoneContextManager = vi.fn(() => ({ type: 'zone' }))
  const resourceFromAttributes = vi.fn(() => ({ type: 'resource' }))
  const registerInstrumentations = vi.fn()
  const FetchInstrumentation = vi.fn(() => ({ type: 'fetch-instrumentation' }))
  const DocumentLoadInstrumentation = vi.fn(() => ({ type: 'document-load-instrumentation' }))

  const spanStatus = {
    OK: 'ok-code',
    ERROR: 'error-code',
  }

  const activeSpanRef: { current: MockSpan | undefined } = { current: undefined }

  const tracerStartActiveSpan = vi.fn((name: string, callback: (span: MockSpan) => unknown) => {
    const span = {
      setAttribute: vi.fn(),
      setStatus: vi.fn(),
      recordException: vi.fn(),
      end: vi.fn(),
      spanContext: vi.fn(() => ({
        traceId: 'trace-span-1',
        spanId: 'span-1',
      })),
    }

    return callback(span)
  })

  const traceGetTracer = vi.fn(() => ({
    startActiveSpan: tracerStartActiveSpan,
  }))
  const traceGetActiveSpan = vi.fn(() => activeSpanRef.current)

  return {
    webTracerProviderCtor: WebTracerProvider,
    providerRegisterSpy: providerRegister,
    providerShutdownSpy: providerShutdown,
    batchSpanProcessorCtor: BatchSpanProcessor,
    simpleSpanProcessorCtor: SimpleSpanProcessor,
    exporterCtor: OTLPTraceExporter,
    zoneContextManagerCtor: ZoneContextManager,
    resourceFromAttributesSpy: resourceFromAttributes,
    registerInstrumentationsSpy: registerInstrumentations,
    fetchInstrumentationCtor: FetchInstrumentation,
    documentLoadInstrumentationCtor: DocumentLoadInstrumentation,
    tracerStartActiveSpanSpy: tracerStartActiveSpan,
    traceGetTracerSpy: traceGetTracer,
    traceGetActiveSpanSpy: traceGetActiveSpan,
    activeSpanHolder: activeSpanRef,
    spanStatusCode: spanStatus,
  }
})

vi.mock('@opentelemetry/sdk-trace-web', () => ({
  WebTracerProvider: webTracerProviderCtor,
  BatchSpanProcessor: batchSpanProcessorCtor,
  SimpleSpanProcessor: simpleSpanProcessorCtor,
}))

vi.mock('@opentelemetry/exporter-trace-otlp-http', () => ({
  OTLPTraceExporter: exporterCtor,
}))

vi.mock('@opentelemetry/context-zone', () => ({
  ZoneContextManager: zoneContextManagerCtor,
}))

vi.mock('@opentelemetry/resources', () => ({
  resourceFromAttributes: resourceFromAttributesSpy,
}))

vi.mock('@opentelemetry/semantic-conventions', () => ({
  SEMRESATTRS_SERVICE_NAME: 'service.name',
  SEMRESATTRS_SERVICE_VERSION: 'service.version',
}))

vi.mock('@opentelemetry/instrumentation', () => ({
  registerInstrumentations: registerInstrumentationsSpy,
}))

vi.mock('@opentelemetry/instrumentation-fetch', () => ({
  FetchInstrumentation: fetchInstrumentationCtor,
}))

vi.mock('@opentelemetry/instrumentation-document-load', () => ({
  DocumentLoadInstrumentation: documentLoadInstrumentationCtor,
}))

vi.mock('@opentelemetry/api', () => ({
  trace: {
    getTracer: traceGetTracerSpy,
    getActiveSpan: traceGetActiveSpanSpy,
  },
  SpanStatusCode: spanStatusCode,
}))

const baseConfig: ObservabilityConfig = {
  serviceName: 'contract-frontend',
  serviceVersion: '1.0.0',
  environment: 'development',
  otelEndpoint: 'https://otel.example.com',
  enabled: true,
  sampleRate: 1,
  debug: false,
}

describe('otel tracer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
    activeSpanHolder.current = undefined
  })

  it('initTracer no-ops when disabled', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    const module = await import('@/app/observability/otel/tracer')
    module.initTracer({
      ...baseConfig,
      enabled: false,
    })

    expect(webTracerProviderCtor).not.toHaveBeenCalled()
    logSpy.mockRestore()
  })

  it('initTracer initializes provider, processors and instrumentations once', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    const module = await import('@/app/observability/otel/tracer')

    module.initTracer({
      ...baseConfig,
      debug: true,
    })

    expect(resourceFromAttributesSpy).toHaveBeenCalledTimes(1)
    expect(exporterCtor).toHaveBeenCalledTimes(1)
    expect(simpleSpanProcessorCtor).toHaveBeenCalledTimes(1)
    expect(batchSpanProcessorCtor).not.toHaveBeenCalled()
    expect(webTracerProviderCtor).toHaveBeenCalledTimes(1)
    expect(providerRegisterSpy).toHaveBeenCalledWith({
      contextManager: expect.any(Object),
    })
    expect(zoneContextManagerCtor).toHaveBeenCalledTimes(1)

    expect(fetchInstrumentationCtor).toHaveBeenCalledTimes(1)
    expect(documentLoadInstrumentationCtor).toHaveBeenCalledTimes(1)
    expect(registerInstrumentationsSpy).toHaveBeenCalledTimes(1)

    module.initTracer(baseConfig)
    expect(warnSpy).toHaveBeenCalledWith('[OTEL] Tracer already initialized')

    warnSpy.mockRestore()
    logSpy.mockRestore()
  })

  it('getTracer/getActiveSpan/getCurrentTraceContext map trace API correctly', async () => {
    const module = await import('@/app/observability/otel/tracer')

    const tracer = module.getTracer('x')
    expect(traceGetTracerSpy).toHaveBeenCalledWith('x')
    expect(tracer).toEqual(expect.objectContaining({
      startActiveSpan: expect.any(Function),
    }))

    expect(module.getActiveSpan()).toBeUndefined()
    expect(module.getCurrentTraceContext()).toEqual({})

    const span = {
      spanContext: () => ({
        traceId: 'trace-id-2',
        spanId: 'span-id-2',
      }),
      recordException: vi.fn(),
      setStatus: vi.fn(),
      setAttribute: vi.fn(),
    }
    activeSpanHolder.current = span

    expect(module.getActiveSpan()).toBe(span)
    expect(module.getCurrentTraceContext()).toEqual({
      traceId: 'trace-id-2',
      spanId: 'span-id-2',
    })
  })

  it('withSpan sets attributes and status on success', async () => {
    const module = await import('@/app/observability/otel/tracer')

    const result = await module.withSpan(
      'span.success',
      async () => {
        return 'ok'
      },
      {
        feature: 'unit-test',
      },
    )

    expect(tracerStartActiveSpanSpy).toHaveBeenCalledWith('span.success', expect.any(Function))
    expect(result).toBe('ok')
  })

  it('withSpan records exception and rethrows on error', async () => {
    const module = await import('@/app/observability/otel/tracer')

    await expect(
      module.withSpan('span.fail', async () => {
        throw new Error('failed-in-span')
      }),
    ).rejects.toThrow('failed-in-span')
  })

  it('recordError writes into active span and shutdownTracer closes provider', async () => {
    const module = await import('@/app/observability/otel/tracer')

    module.initTracer(baseConfig)

    const span = {
      recordException: vi.fn(),
      setStatus: vi.fn(),
      setAttribute: vi.fn(),
      spanContext: vi.fn(() => ({ traceId: 't', spanId: 's' })),
    }
    activeSpanHolder.current = span

    module.recordError(new Error('record-this'), {
      k1: 'v1',
      k2: 'v2',
    })

    expect(span.recordException).toHaveBeenCalledTimes(1)
    expect(span.setStatus).toHaveBeenCalledTimes(1)
    expect(span.setAttribute).toHaveBeenCalledWith('k1', 'v1')
    expect(span.setAttribute).toHaveBeenCalledWith('k2', 'v2')

    await module.shutdownTracer()
    expect(providerShutdownSpy).toHaveBeenCalledTimes(1)
  })
})
