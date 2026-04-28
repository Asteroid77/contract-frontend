import { describe, expect, it } from 'vitest'
import { buildCspReportOnlyPolicy, buildCspHeaderArtifacts } from '../CspHeadersVitePlugin'

describe('CspHeadersVitePlugin', () => {
  it('builds a report-only policy from explicit env origins', () => {
    const policy = buildCspReportOnlyPolicy({
      VITE_BACKEND_SERVER_URL: 'https://api.example.com/api',
      VITE_OTEL_ENDPOINT: 'https://otel.example.com/v1/traces',
      VITE_SOURCEMAP_RESOLVER_ENDPOINT: 'https://resolver.example.com/report',
      VITE_OPENREPLAY_INGEST_POINT: 'https://replay.example.com/ingest',
      VITE_CSP_CONNECT_SRC_EXTRA: 'https://oss.example.com https://upload.example.com/upload',
      VITE_CSP_FRAME_SRC_EXTRA: 'https://preview.example.com',
      VITE_CSP_REPORT_URI: 'https://csp-report.example.com/report',
    })

    expect(policy).toContain("default-src 'self'")
    expect(policy).toContain("object-src 'none'")
    expect(policy).toContain("script-src 'self'")
    expect(policy).toContain("style-src 'self' 'unsafe-inline'")
    expect(policy).toContain("img-src 'self' data: blob: https:")
    expect(policy).toContain("font-src 'self' data:")
    expect(policy).toContain(
      "connect-src 'self' https://api.example.com https://oss.example.com https://otel.example.com https://replay.example.com https://resolver.example.com https://upload.example.com",
    )
    expect(policy).toContain("frame-src 'self' https://preview.example.com")
    expect(policy).toContain('report-uri https://csp-report.example.com/report')
    expect(policy).not.toContain('https://api.example.com/api')
    expect(policy).not.toContain('https://upload.example.com/upload')
  })

  it('uses a wildcard host source when backend port is configured without a fixed host', () => {
    const policy = buildCspReportOnlyPolicy({
      VITE_BACKEND_SERVER_PORT: '8443',
    })

    expect(policy).toContain("connect-src 'self' https://*:8443")
  })

  it('does not leak local fallback endpoints into the production policy', () => {
    const policy = buildCspReportOnlyPolicy({})

    expect(policy).not.toContain('localhost:4318')
    expect(policy).not.toContain('127.0.0.1')
    expect(policy).not.toContain('http://')
    expect(policy).not.toContain('report-uri')
  })

  it('renders host-consumable header artifacts', () => {
    const artifacts = buildCspHeaderArtifacts({
      VITE_BACKEND_SERVER_URL: 'https://api.example.com/api',
      VITE_CSP_REPORT_URI: 'https://csp-report.example.com/report',
    })

    expect(artifacts.netlifyHeaders).toContain('Content-Security-Policy-Report-Only:')
    expect(artifacts.netlifyHeaders.startsWith('/*\n')).toBe(true)
    expect(artifacts.nginxConf).toContain('add_header Content-Security-Policy-Report-Only')
    expect(artifacts.nginxConf).toContain('always;')
    expect(artifacts.nginxConf).toContain("default-src 'self'")
  })
})
