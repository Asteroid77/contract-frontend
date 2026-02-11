import { describe, expect, it } from 'vitest'
import { resolvePlatformLabelKey } from '@/modules/user/application/utils/platform'

describe('resolvePlatformLabelKey', () => {
  it('returns mapped key for known platforms', () => {
    expect(resolvePlatformLabelKey('NATIVE')).toBe('layout.profile.platform.native')
    expect(resolvePlatformLabelKey('GITHUB')).toBe('layout.profile.platform.github')
    expect(resolvePlatformLabelKey('WECHAT')).toBe('layout.profile.platform.wechat')
  })

  it('falls back to native key when platform is missing', () => {
    expect(resolvePlatformLabelKey(undefined)).toBe('layout.profile.platform.native')
    expect(resolvePlatformLabelKey(null)).toBe('layout.profile.platform.native')
  })
})
