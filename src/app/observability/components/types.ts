/** Component status in the error trace */
export type ComponentStatus = 'error' | 'active'

/** A single node in the component hierarchy trace */
export interface ComponentTraceItem {
  /** Component name (from $options.name) */
  name: string
  /** Whether this component errored or is still active */
  status: ComponentStatus
  /** Human-readable description for the tree view */
  info?: string
}

/** Full error payload captured by ErrorBoundary */
export interface CapturedError {
  /** Error.message */
  message: string
  /** Vue lifecycle / hook info string (e.g. "render", "setup", "mounted hook") */
  info: string
  /** Error.stack */
  stack: string
  /** Formatted timestamp when the error was captured */
  capturedAt: string
  /** Component hierarchy from error source → root */
  componentTrace: ComponentTraceItem[]
}

/** Fallback slot scope exposed to consumers */
export interface FallbackSlotScope {
  /** The captured error details */
  error: CapturedError
  /** Call to reset the error state and re-render children */
  reset: () => void
}
