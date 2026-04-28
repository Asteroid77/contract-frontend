import { describe, expect, it } from 'vitest'
import { resolveAllowedAccessUrl } from '@/modules/shared/application/security/access-url'

describe('resolveAllowedAccessUrl', () => {
  it('allows same-origin relative URLs', () => {
    expect(resolveAllowedAccessUrl('/files/manual.pdf')).toBe(
      `${window.location.origin}/files/manual.pdf`,
    )
  })

  it('allows shared endpoint host from access policy', () => {
    expect(resolveAllowedAccessUrl('https://oss-cn-guangzhou.aliyuncs.com/a.png')).toBe(
      'https://oss-cn-guangzhou.aliyuncs.com/a.png',
    )
  })

  it('allows shared wildcard oss bucket hosts from access policy', () => {
    expect(
      resolveAllowedAccessUrl(
        'https://zwlh-powergrid.oss-cn-guangzhou.aliyuncs.com/path/to/a.webp?Expires=1',
      ),
    ).toBe('https://zwlh-powergrid.oss-cn-guangzhou.aliyuncs.com/path/to/a.webp?Expires=1')
  })

  it('allows default shared oss hosts without env override', () => {
    expect(
      resolveAllowedAccessUrl(
        'https://zwlh-powergrid.oss-cn-guangzhou.aliyuncs.com/path/to/a.webp?Expires=1',
      ),
    ).toBe('https://zwlh-powergrid.oss-cn-guangzhou.aliyuncs.com/path/to/a.webp?Expires=1')
  })

  it('rejects non-http protocols', () => {
    expect(resolveAllowedAccessUrl('javascript:alert(1)')).toBeNull()
    expect(
      resolveAllowedAccessUrl('data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg=='),
    ).toBeNull()
    expect(resolveAllowedAccessUrl('file:///tmp/test.pdf')).toBeNull()
  })

  it('rejects disallowed external hosts', () => {
    expect(resolveAllowedAccessUrl('https://evil.example/manual.pdf')).toBeNull()
  })
})
