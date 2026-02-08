/**
 * ErrorBoundary — Notion-style Error Fallback UI
 *
 * Captures descendant component errors via `onErrorCaptured`,
 * builds a component trace, and renders a rich fallback page.
 *
 * Slots:
 *   default  — normal child content
 *   fallback — custom fallback UI  ({ error, reset })
 */
import {
  defineComponent,
  ref,
  type ComponentPublicInstance,
  onErrorCaptured,
} from 'vue'
import { $t } from '@/_utils/i18n'
import { captureVueError } from '@/app/observability/collectors/error-collector'
import type { CapturedError, ComponentTraceItem } from './types'
import './ErrorBoundary.css'

export default defineComponent({
  name: 'ErrorBoundary',

  props: {
    /** Whether to stop error propagation to parent boundaries */
    stopPropagation: {
      type: Boolean,
      default: true,
    },
    /** Custom title override (defaults to error.message) */
    errorTitle: {
      type: String,
      default: undefined,
    },
    /** Custom description shown below the title */
    errorDescription: {
      type: String,
      default: undefined,
    },
  },

  emits: {
    error: (_error: Error, _info: string) => true,
    reset: () => true,
  },

  setup(props, { emit, slots }) {
    // ────────────────────── State ──────────────────────
    const hasError = ref(false)
    const capturedError = ref<CapturedError | null>(null)
    const toastVisible = ref(false)
    const toastMessage = ref('')
    const resetBannerVisible = ref(false)

    // ────────────────────── Helpers ────────────────────
    function formatTimestamp(date: Date): string {
      const p = (n: number) => String(n).padStart(2, '0')
      return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())} ${p(date.getHours())}:${p(date.getMinutes())}:${p(date.getSeconds())}`
    }

    function buildTrace(
      instance: ComponentPublicInstance | null,
      errorName: string,
    ): ComponentTraceItem[] {
      const trace: ComponentTraceItem[] = [
        { name: errorName, status: 'error' },
      ]
      let cur = instance?.$parent as ComponentPublicInstance | null
      while (cur) {
  const name = (cur.$options as any)?.name
        if (name) {
          trace.push({ name, status: 'active' })
        }
        cur = cur.$parent as ComponentPublicInstance | null
      }
      return trace
    }

    function showToast(msg: string) {
      toastMessage.value = msg
      toastVisible.value = true
      setTimeout(() => {
        toastVisible.value = false
      }, 2000)
    }

    // ────────────────────── Error Capture ──────────────
    onErrorCaptured((err: Error, instance, info: string) => {
      const name = (instance as any)?.$options?.name || 'Unknown'

      hasError.value = true
      capturedError.value = {
        message: err.message,
        info,
        stack: err.stack || '',
        capturedAt: formatTimestamp(new Date()),
        componentTrace: buildTrace(
          instance as ComponentPublicInstance,
          name,
        ),
      }

      // Record to observability system
      captureVueError(err, instance, info)

      emit('error', err, info)
      return !props.stopPropagation
    })

    // ────────────────────── Actions ────────────────────
    function handleReset() {
      hasError.value = false
      capturedError.value = null
      resetBannerVisible.value = true
      setTimeout(() => {
        resetBannerVisible.value = false
      }, 3000)
      emit('reset')
    }

    function handleRefresh() {
      showToast($t('observability.errorBoundary.toast.reloading'))
      setTimeout(() => window.location.reload(), 1000)
    }

    function handleCopyError() {
      if (!capturedError.value) return
      const e = capturedError.value
      const text = [
        e.message,
        '',
        `Lifecycle: ${e.info}`,
        `Captured at: ${e.capturedAt}`,
        '',
        'Component Trace:',
        ...e.componentTrace.map(
          (c) => `  <${c.name}> [${c.status}]`,
        ),
        '',
        'Stack Trace:',
        e.stack,
      ].join('\n')

      navigator.clipboard.writeText(text).then(
        () => showToast($t('observability.errorBoundary.toast.copied')),
        () => showToast($t('observability.errorBoundary.toast.copyFailed')),
      )
    }

    // ═══════════════════ Sub-Renderers ═══════════════════

    /**th-error page icon */
    const renderPageIcon = () => (
      <div class="error-boundary__icon">
        <div class="error-boundary__icon-wrapper">
          <svg width="54" height="54" viewBox="0 0 28 28" fill="none">
            <path
              d="M6 3a1 1 0 011-1h10l5 5v18a1 1 0 01-1 1H7a1 1 0 01-1-1V3z"
              fill="var(--eb-red-bg)"
              stroke="var(--eb-red)"
              stroke-width="1.2"
            />
            <path
              d="M17 2l5 5h-4a1 1 0 01-1-1V2z"
              fill="var(--eb-orange-bg)"
              stroke="var(--eb-red)"
              stroke-width="1"
            />
            <circle
              cx="14" cy="16" r="5"
              fill="var(--eb-red)" fill-opacity="0.15"
              stroke="var(--eb-red)" stroke-width="1.2"
            />
            <path d="M14 13.5v3" stroke="var(--eb-red)" stroke-width="1.4" stroke-linecap="round" />
            <circle cx="14" cy="18.5" r="0.7" fill="var(--eb-red)" />
          </svg>
        </div>
      </div>
    )

    /** Title block */
    const renderTitle = (err: CapturedError) => (
      <div class="error-boundary__header">
        <h1 class="error-boundary__title">
          {props.errorTitle || err.message}
        </h1>
        {props.errorDescription && (
          <p class="error-boundary__subtitle">{props.errorDescription}</p>
        )}
      </div>
    )

    /** Single property row */
    const renderPropRow = (
      icon: () => any,
      label: string,
      value: () => any,
      alignTop = false,
    ) => (
      <div class={['error-boundary__prop-row', alignTop && 'error-boundary__prop-row--top']}>
        <div class="error-boundary__prop-label" style={alignTop ? { paddingTop: '6px' } : {}}>
          {icon()}
          {label}
        </div>
        <div class="error-boundary__prop-value" style={alignTop ? { paddingTop: '2px' } : {}}>
          {value()}
        </div>
      </div>
    )

    /** Chevron separator between area tags */
    const renderChevron = () => (
      <span class="error-boundary__area-sep">
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
          <path d="M6 4l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </span>
    )

    /** Properties table */
    const renderPropertyTable = (err: CapturedError) => {
      const trace = err.componentTrace
      return (
        <div class="error-boundary__props">
          {/* Status */}
          {renderPropRow(
            () => (
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.5" />
                <path d="M8 5v3l2 2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
              </svg>
            ),
            $t('observability.errorBoundary.props.status'),
            () => (
              <span class="error-boundary__tag error-boundary__tag--error">
                <span class="error-boundary__dot error-boundary__dot--red" />
                {$t('observability.errorBoundary.status.error')}
              </span>
            ),
          )}

          {/* Source */}
          {renderPropRow(
            () => (
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M5 3l-3 5 3 5M11 3l3 5-3 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            ),
            $t('observability.errorBoundary.props.source'),
            () => (
              <span class="error-boundary__tag error-boundary__tag--gray error-boundary__tag--mono">
                &lt;{trace[0]?.name || 'Unknown'}&gt;
              </span>
            ),
          )}

          {/* Lifecycle */}
          {renderPropRow(
            () => (
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M2 8a6 6 0 1112 0A6 6 0 012 8z" stroke="currentColor" stroke-width="1.5" />
                <path d="M8 5v4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
              </svg>
            ),
            $t('observability.errorBoundary.props.lifecycle'),
            () => (
              <span class="error-boundary__tag error-boundary__tag--blue error-boundary__tag--mono">
                {err.info}
              </span>
            ),
          )}

          {/* Captured At */}
          {renderPropRow(
            () => (
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <rect x="2" y="3" width="12" height="11" rx="1.5" stroke="currentColor" stroke-width="1.5" />
                <path d="M2 6.5h12M5 2v2M11 2v2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
              </svg>
            ),
            $t('observability.errorBoundary.props.capturedAt'),
            () => (
              <span style={{ color: 'var(--eb-text-secondary)' }}>
                {err.capturedAt}
              </span>
            ),
          )}

          {/* Areas (Component Trace Tags) */}
          {renderPropRow(
            () => (
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M2 4l6-2 6 2v6l-6 4-6-4V4z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" />
              </svg>
            ),
            $t('observability.errorBoundary.props.areas'),
            () => (
              <>
                {trace.map((comp, i) => (
                  <>
                    <span
                      class={[
                        'error-boundary__tag',
                        comp.status === 'error'
                          ? 'error-boundary__tag--error'
                          : 'error-boundary__tag--active',
                      ]}
                    >
                      <span
                        class={[
                          'error-boundary__dot error-boundary__dot--sm',
                          comp.status === 'error'
                            ? 'error-boundary__dot--red'
                            : 'error-boundary__dot--green',
                        ]}
                      />
                      <span class="error-boundary__tag--mono" style={{ fontSize: '11px' }}>
                        &lt;{comp.name}&gt;
                      </span>
                    </span>
                    {i < trace.length - 1 && renderChevron()}
                  </>
                ))}
              </>
            ),
            true,
          )}
        </div>
      )
    }

    /** Error callout banner */
    const renderCallout = () => (
      <div class="error-boundary__callout">
        <div class="error-boundary__callout-icon">⚠️</div>
        <div style={{ flex: '1' }}>
          <div class="error-boundary__callout-title">
            {$t('observability.errorBoundary.callout.title')}
          </div>
          <div class="error-boundary__callout-body">
            {$t('observability.errorBoundary.callout.descBefore')}{' '}
            <code class="error-boundary__callout-code">ErrorBoundary</code>{' '}
            {$t('observability.errorBoundary.callout.descAfter')}
          </div>
        </div>
      </div>
    )

    /** Stack trace code block */
    const renderStackTrace = (err: CapturedError) => {
      const lines = err.stack.split('\n')
      return (
        <div style={{ marginBottom: '20px' }}>
          <h3 class="error-boundary__section-title">
            <span class="error-boundary__section-hash">#</span>
            {$t('observability.errorBoundary.sections.errorDetails')}
          </h3>
          <div class="error-boundary__code-block">
            <span class="error-boundary__code-error">{err.message}</span>
            {lines.slice(1).map((line) => (
              <span class="error-boundary__code-trace">{line}</span>
            ))}
          </div>
        </div>
      )
    }

    /** File icon for tree: error variant */
    const FileIconError = () => (
      <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
        <path d="M4 2.5A1.5 1.5 0 015.5 1H12l4 4v11.5a1.5 1.5 0 01-1.5 1.5h-9A1.5 1.5 0 014 16.5v-14z" fill="var(--eb-red-bg)" stroke="var(--eb-red)" stroke-width="1" />
        <circle cx="10" cy="11" r="3.5" fill="var(--eb-red)" fill-opacity="0.2" stroke="var(--eb-red)" stroke-width="0.8" />
        <path d="M10 9v2.5" stroke="var(--eb-red)" stroke-width="1" stroke-linecap="round" />
        <circle cx="10" cy="13" r="0.5" fill="var(--eb-red)" />
      </svg>
    )

    /** File icon for tree: normal variant */
    const FileIconNormal = () => (
      <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
        <path d="M4 2.5A1.5 1.5 0 015.5 1H12l4 4v11.5a1.5 1.5 0 01-1.5 1.5h-9A1.5 1.5 0 014 16.5v-14z" fill="#f0f0f0" stroke="#c0c0c0" stroke-width="1" />
        <path d="M12 1l4 4h-3.5a.5.5 0 01-.5-.5V1z" fill="#e0e0e0" stroke="#c0c0c0" stroke-width="0.8" />
        <path d="M7 9h6M7 12h4" stroke="#a0a0a0" stroke-width="0.8" stroke-linecap="round" />
      </svg>
    )

    /** Tree connector icon */
    const TreeConnector = () => (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
        <path d="M4 2v6h8" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" opacity="0.5" />
      </svg>
    )

    /** Component trace tree */
    const renderComponentTree = (err: CapturedError) => {
      const reversed = [...err.componentTrace].reverse()
      return (
        <div style={{ marginBottom: '20px' }}>
          <h3 class="error-boundary__section-title">
            <span class="error-boundary__section-hash">#</span>
            {$t('observability.errorBoundary.sections.componentTrace')}
          </h3>
          <div class="error-boundary__tree">
            {reversed.map((comp, i) => {
              const isErr = comp.status === 'error'
              return (
                <div
                  class={[
                    'error-boundary__tree-row',
                    isErr && 'error-boundary__tree-row--error',
                  ]}
                >
                  {/* Indent */}
                  <div style={{ width: `${i * 20}px`, flexShrink: '0' }} />

                  {/* Connector */}
                  {i > 0 && (
                    <div class="error-boundary__tree-connector">
                      <TreeConnector />
                    </div>
                  )}

                  {/* File icon */}
                  <div class="error-boundary__tree-file-icon">
                    {isErr ? <FileIconError /> : <FileIconNormal />}
                  </div>

                  {/* Component name */}
                  <span
                    class={[
                      'error-boundary__tree-name',
                      isErr && 'error-boundary__tree-name--error',
                    ]}
                  >
                    &lt;{comp.name}&gt;
                  </span>

                  {/* Status badge */}
                  <span
                    class={[
                      'error-boundary__tag',
                      isErr ? 'error-boundary__tag--error' : 'error-boundary__tag--active',
                    ]}
                    style={{ fontSize: '11px', marginRight: '12px' }}
                  >
                    <span
                      class={[
                        'error-boundary__dot error-boundary__dot--sm',
                        isErr ? 'error-boundary__dot--red' : 'error-boundary__dot--green',
                      ]}
                    />
                    {isErr
                      ? $t('observability.errorBoundary.status.error')
                      : $t('observability.errorBoundary.status.active')}
                  </span>

                  {/* Info text */}
                  {comp.info && (
                    <span class="error-boundary__tree-info">{comp.info}</span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )
    }

    /** Action buttons row */
    const renderActions = () => (
      <div style={{ marginBottom: '48px' }}>
        <h3 class="error-boundary__section-title">
          <span class="error-boundary__section-hash">#</span>
          {$t('observability.errorBoundary.sections.actions')}
        </h3>
        <div class="error-boundary__actions">
          <button
            class="error-boundary__btn error-boundary__btn--primary"
            onClick={handleReset}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M2 8a6 6 0 0110.47-4M14 2v4h-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
              <path d="M14 8a6 6 0 01-10.47 4M2 14v-4h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            {$t('observability.errorBoundary.actions.retry')}
          </button>
          <button class="error-boundary__btn" onClick={handleRefresh}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M13.65 4A7 7 0 002 8a7 7 0 0011.65 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
            </svg>
            {$t('observability.errorBoundary.actions.refresh')}
          </button>
          <button class="error-boundary__btn" onClick={handleCopyError}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <rect x="5" y="5" width="8" height="8" rx="1" stroke="currentColor" stroke-width="1.5" />
              <path d="M3 11V3h8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            {$t('observability.errorBoundary.actions.copyError')}
          </button>
        </div>
      </div>
    )

    /** Floating toast */
    const renderToast = () => (
      <div
        class={[
          'error-boundary__toast',
          toastVisible.value && 'error-boundary__toast--visible',
        ]}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M3 8.5l3 3 7-7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
        <span>{toastMessage.value}</span>
      </div>
    )

    /** Floating reset-success banner */
    const renderResetBanner = () => (
      <div
        class={[
          'error-boundary__reset-banner',
          resetBannerVisible.value && 'error-boundary__reset-banner--visible',
        ]}
      >
        <div class="error-boundary__reset-banner-inner">
          <div class="error-boundary__reset-icon">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 8.5l3 3 7-7" stroke="var(--eb-green)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: '500', color: 'var(--eb-text)' }}>
              {$t('observability.errorBoundary.resetBanner.title')}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--eb-text-secondary)' }}>
              {$t('observability.errorBoundary.resetBanner.description')}
            </div>
          </div>
        </div>
      </div>
    )

    // ═══════════════════ Main Render ═══════════════════
    return () => {
      // 1) No error → render children normally
      if (!hasError.value) {
        return slots.default?.()
      }

      // 2) Custom fallback slot
      if (slots.fallback && capturedError.value) {
        return slots.fallback({
          error: capturedError.value,
          reset: handleReset,
        })
      }

      // 3) Default Notion-style error UI
      const err = capturedError.value!
      return (
        <div class="error-boundary">
          {renderPageIcon()}
          {renderTitle(err)}
          {renderPropertyTable(err)}
          <div class="error-boundary__divider" />
          {renderCallout()}
          {renderStackTrace(err)}
          {renderComponentTree(err)}
          <div class="error-boundary__divider" />
          {renderActions()}
          {renderToast()}
          {renderResetBanner()}
        </div>
      )
    }
  },
})
