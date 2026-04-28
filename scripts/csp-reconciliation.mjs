/**
 * @typedef {object} FrontendViolationInput
 * @property {'securitypolicyviolation' | 'browser-report' | 'report-to'} channel
 * @property {string | undefined} [blockedUri]
 * @property {number | undefined} [columnNumber]
 * @property {'enforce' | 'report' | undefined} [disposition]
 * @property {string} documentUri
 * @property {string} effectiveDirective
 * @property {number | undefined} [lineNumber]
 * @property {string | undefined} [originalPolicy]
 * @property {string | undefined} [referrer]
 * @property {string | undefined} [sample]
 * @property {string | undefined} [sourceFile]
 * @property {number | undefined} [statusCode]
 * @property {string} violatedDirective
 */

/**
 * @typedef {object} BrowserNativeReportBody
 * @property {string | undefined} [blockedURL]
 * @property {number | undefined} [columnNumber]
 * @property {'enforce' | 'report' | undefined} [disposition]
 * @property {string | undefined} [documentURL]
 * @property {string | undefined} [effectiveDirective]
 * @property {number | undefined} [lineNumber]
 * @property {string | undefined} [originalPolicy]
 * @property {string | undefined} [sample]
 * @property {string | undefined} [sourceFile]
 * @property {number | undefined} [statusCode]
 * @property {string | undefined} [violatedDirective]
 */

/**
 * @typedef {object} BrowserNativeReportInput
 * @property {string | undefined} [type]
 * @property {number | undefined} [age]
 * @property {BrowserNativeReportBody} [body]
 * @property {string | undefined} [url]
 */

/**
 * @typedef {object} NormalizedCspViolation
 * @property {'frontend' | 'native-report'} recordKind
 * @property {'securitypolicyviolation' | 'browser-report' | 'report-to'} channel
 * @property {string | undefined} blockedUri
 * @property {number | undefined} columnNumber
 * @property {'enforce' | 'report' | undefined} disposition
 * @property {string | undefined} documentUri
 * @property {string | undefined} effectiveDirective
 * @property {number | undefined} lineNumber
 * @property {string | undefined} originalPolicy
 * @property {string | undefined} sample
 * @property {string | undefined} sourceFile
 * @property {number | undefined} statusCode
 * @property {string | undefined} violatedDirective
 */

/**
 * @typedef {object} NormalizedCspViolationRecord
 * @property {string} fingerprint
 * @property {NormalizedCspViolation} normalized
 * @property {FrontendViolationInput | BrowserNativeReportInput} original
 */

/**
 * @typedef {object} DiffCspViolationRecordsResult
 * @property {NormalizedCspViolationRecord[]} localOnly
 * @property {NormalizedCspViolationRecord[]} networkOnly
 * @property {NormalizedCspViolationRecord[]} shared
 */

function normalizeString(value) {
  if (typeof value !== 'string') {
    return undefined
  }

  const normalized = value.trim()
  return normalized === '' ? undefined : normalized
}

function normalizeNumber(value) {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

function normalizeSample(value) {
  const sample = normalizeString(value)
  if (!sample) {
    return undefined
  }

  return sample.replace(/\s+/g, ' ')
}

function buildFingerprint(normalized) {
  const parts = [
    normalized.documentUri ?? '',
    normalized.effectiveDirective ?? '',
    normalized.violatedDirective ?? '',
    normalized.blockedUri ?? '',
    normalized.sourceFile ?? '',
    String(normalized.lineNumber ?? ''),
    String(normalized.columnNumber ?? ''),
    normalized.sample ?? '',
  ]

  return parts.join('::')
}

function uniqueByFingerprint(records) {
  /** @type {Map<string, NormalizedCspViolationRecord>} */
  const grouped = new Map()

  for (const record of records) {
    if (!grouped.has(record.fingerprint)) {
      grouped.set(record.fingerprint, record)
    }
  }

  return grouped
}

/**
 * @param {{ kind: 'frontend', payload: FrontendViolationInput } | { kind: 'native-report', payload: BrowserNativeReportInput }} input
 * @returns {NormalizedCspViolationRecord}
 */
export function normalizeCspViolationRecord(input) {
  if (input.kind === 'frontend') {
    const payload = input.payload
    const normalized = {
      recordKind: 'frontend',
      channel: payload.channel,
      blockedUri: normalizeString(payload.blockedUri),
      columnNumber: normalizeNumber(payload.columnNumber),
      disposition: payload.disposition,
      documentUri: normalizeString(payload.documentUri),
      effectiveDirective: normalizeString(payload.effectiveDirective),
      lineNumber: normalizeNumber(payload.lineNumber),
      originalPolicy: normalizeString(payload.originalPolicy),
      sample: normalizeSample(payload.sample),
      sourceFile: normalizeString(payload.sourceFile),
      statusCode: normalizeNumber(payload.statusCode),
      violatedDirective:
        normalizeString(payload.violatedDirective) ?? normalizeString(payload.effectiveDirective),
    }

    return {
      fingerprint: buildFingerprint(normalized),
      normalized,
      original: payload,
    }
  }

  const payload = input.payload
  const body = payload.body ?? {}

  const normalized = {
    recordKind: 'native-report',
    channel: 'report-to',
    blockedUri: normalizeString(body.blockedURL),
    columnNumber: normalizeNumber(body.columnNumber),
    disposition: body.disposition,
    documentUri: normalizeString(body.documentURL) ?? normalizeString(payload.url),
    effectiveDirective: normalizeString(body.effectiveDirective),
    lineNumber: normalizeNumber(body.lineNumber),
    originalPolicy: normalizeString(body.originalPolicy),
    sample: normalizeSample(body.sample),
    sourceFile: normalizeString(body.sourceFile),
    statusCode: normalizeNumber(body.statusCode),
    violatedDirective:
      normalizeString(body.violatedDirective) ?? normalizeString(body.effectiveDirective),
  }

  return {
    fingerprint: buildFingerprint(normalized),
    normalized,
    original: payload,
  }
}

/**
 * @param {{ localRecords: NormalizedCspViolationRecord[], networkRecords: NormalizedCspViolationRecord[] }} input
 * @returns {DiffCspViolationRecordsResult}
 */
export function diffCspViolationRecords(input) {
  const localByFingerprint = uniqueByFingerprint(input.localRecords)
  const networkByFingerprint = uniqueByFingerprint(input.networkRecords)

  /** @type {NormalizedCspViolationRecord[]} */
  const localOnly = []
  /** @type {NormalizedCspViolationRecord[]} */
  const networkOnly = []
  /** @type {NormalizedCspViolationRecord[]} */
  const shared = []

  for (const [fingerprint, localRecord] of localByFingerprint.entries()) {
    if (networkByFingerprint.has(fingerprint)) {
      shared.push(localRecord)
      continue
    }

    localOnly.push(localRecord)
  }

  for (const [fingerprint, networkRecord] of networkByFingerprint.entries()) {
    if (!localByFingerprint.has(fingerprint)) {
      networkOnly.push(networkRecord)
    }
  }

  return {
    localOnly,
    networkOnly,
    shared,
  }
}
