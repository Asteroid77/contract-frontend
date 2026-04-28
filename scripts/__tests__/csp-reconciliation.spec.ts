// @vitest-environment node

import { describe, expect, it } from 'vitest'
import {
  diffCspViolationRecords,
  normalizeCspViolationRecord,
  type BrowserNativeReportInput,
  type FrontendViolationInput,
} from '../csp-reconciliation.mjs'

describe('csp-reconciliation', () => {
  it('normalizes frontend enhanced events and native report events into the same fingerprint', () => {
    const frontendEvent: FrontendViolationInput = {
      channel: 'securitypolicyviolation',
      blockedUri: 'trusted-types-sink',
      effectiveDirective: 'require-trusted-types-for',
      violatedDirective: 'require-trusted-types-for',
      sourceFile: 'https://dev.astro777.cfd/node_modules/.vite/deps/mermaid.js',
      lineNumber: 1280,
      sample: 'Element innerHTML|<svg id="graph">',
      documentUri: 'https://dev.astro777.cfd/work-order/1',
    }

    const nativeReport: BrowserNativeReportInput = {
      type: 'csp-violation',
      age: 12,
      body: {
        blockedURL: 'trusted-types-sink',
        disposition: 'report',
        documentURL: 'https://dev.astro777.cfd/work-order/1',
        effectiveDirective: 'require-trusted-types-for',
        lineNumber: 1280,
        originalPolicy: "default-src 'self'",
        sample: 'Element innerHTML|<svg id="graph">',
        sourceFile: 'https://dev.astro777.cfd/node_modules/.vite/deps/mermaid.js',
        statusCode: 200,
      },
      url: 'https://dev.astro777.cfd/work-order/1',
    }

    const normalizedFrontend = normalizeCspViolationRecord({
      kind: 'frontend',
      payload: frontendEvent,
    })
    const normalizedNative = normalizeCspViolationRecord({
      kind: 'native-report',
      payload: nativeReport,
    })

    expect(normalizedFrontend.fingerprint).toBe(normalizedNative.fingerprint)
    expect(normalizedFrontend.normalized.sourceFile).toBe(
      'https://dev.astro777.cfd/node_modules/.vite/deps/mermaid.js',
    )
    expect(normalizedNative.normalized.blockedUri).toBe('trusted-types-sink')
  })

  it('diffs local and network records by normalized fingerprint', () => {
    const localOnly = normalizeCspViolationRecord({
      kind: 'frontend',
      payload: {
        channel: 'securitypolicyviolation',
        blockedUri: 'trusted-types-sink',
        effectiveDirective: 'require-trusted-types-for',
        violatedDirective: 'require-trusted-types-for',
        sourceFile: 'https://dev.astro777.cfd/node_modules/.vite/deps/md-editor-v3.js',
        lineNumber: 4770,
        sample: 'Element innerHTML|<p>Start</p>',
        documentUri: 'https://dev.astro777.cfd/work-order/1',
      },
    })

    const sharedLocal = normalizeCspViolationRecord({
      kind: 'frontend',
      payload: {
        channel: 'securitypolicyviolation',
        blockedUri: 'trusted-types-sink',
        effectiveDirective: 'require-trusted-types-for',
        violatedDirective: 'require-trusted-types-for',
        sourceFile: 'https://dev.astro777.cfd/node_modules/.vite/deps/mermaid.js',
        lineNumber: 1280,
        sample: 'Element innerHTML|<svg id="graph">',
        documentUri: 'https://dev.astro777.cfd/work-order/1',
      },
    })

    const sharedNetwork = normalizeCspViolationRecord({
      kind: 'native-report',
      payload: {
        type: 'csp-violation',
        age: 8,
        body: {
          blockedURL: 'trusted-types-sink',
          disposition: 'report',
          documentURL: 'https://dev.astro777.cfd/work-order/1',
          effectiveDirective: 'require-trusted-types-for',
          lineNumber: 1280,
          sample: 'Element innerHTML|<svg id="graph">',
          sourceFile: 'https://dev.astro777.cfd/node_modules/.vite/deps/mermaid.js',
        },
      },
    })

    const networkOnly = normalizeCspViolationRecord({
      kind: 'native-report',
      payload: {
        type: 'csp-violation',
        age: 4,
        body: {
          blockedURL: 'trusted-types-sink',
          disposition: 'report',
          documentURL: 'https://dev.astro777.cfd/work-order/1',
          effectiveDirective: 'require-trusted-types-for',
          lineNumber: 1380,
          sample: 'Element innerHTML|<div><button',
          sourceFile: 'https://dev.astro777.cfd/node_modules/.vite/deps/chunk-LRM477U6.js',
        },
      },
    })

    const diff = diffCspViolationRecords({
      localRecords: [localOnly, sharedLocal],
      networkRecords: [sharedNetwork, networkOnly],
    })

    expect(diff.localOnly).toHaveLength(1)
    expect(diff.localOnly[0]?.normalized.sourceFile).toContain('md-editor-v3.js')
    expect(diff.networkOnly).toHaveLength(1)
    expect(diff.networkOnly[0]?.normalized.sourceFile).toContain('chunk-LRM477U6.js')
    expect(diff.shared).toHaveLength(1)
    expect(diff.shared[0]?.normalized.sourceFile).toContain('mermaid.js')
  })
})
