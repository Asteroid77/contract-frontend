import { describe, expect, it } from 'vitest'
import {
  resolveUserDisplayName,
  resolveUserDisplayText,
} from '@/modules/user/application/utils/displayName'

describe('resolveUserDisplayName', () => {
  it('appends positive discriminator', () => {
    expect(resolveUserDisplayName({ name: 'alice', discriminator: 7 })).toBe('alice#7')
  })

  it('supports positive numeric-string discriminator', () => {
    expect(resolveUserDisplayName({ name: 'alice', discriminator: '007' })).toBe('alice#007')
    expect(resolveUserDisplayName({ name: 'alice', discriminator: ' 42 ' })).toBe('alice#42')
  })

  it('returns name when discriminator is missing or non-positive', () => {
    expect(resolveUserDisplayName({ name: 'alice', discriminator: 0 })).toBe('alice')
    expect(resolveUserDisplayName({ name: 'alice', discriminator: -1 })).toBe('alice')
    expect(resolveUserDisplayName({ name: 'alice', discriminator: 'A' })).toBe('alice')
    expect(resolveUserDisplayName({ name: 'alice', discriminator: '0' })).toBe('alice')
    expect(resolveUserDisplayName({ name: 'alice', discriminator: null })).toBe('alice')
    expect(resolveUserDisplayName({ name: 'alice' })).toBe('alice')
  })

  it('returns empty string when name is missing', () => {
    expect(resolveUserDisplayName({ name: '', discriminator: 7 })).toBe('')
    expect(resolveUserDisplayName({ name: null, discriminator: 7 })).toBe('')
  })

  it('normalizes trailing discriminator in name text', () => {
    expect(resolveUserDisplayName({ name: 'alice#7' })).toBe('alice#7')
    expect(resolveUserDisplayName({ name: 'alice#0' })).toBe('alice')
    expect(resolveUserDisplayName({ name: 'alice#-1' })).toBe('alice')
  })

  it('uses explicit discriminator over trailing discriminator in name text', () => {
    expect(resolveUserDisplayName({ name: 'alice#7', discriminator: 9 })).toBe('alice#9')
    expect(resolveUserDisplayName({ name: 'alice#7', discriminator: 0 })).toBe('alice')
  })
})

describe('resolveUserDisplayText', () => {
  it('returns fallback when name is empty', () => {
    expect(resolveUserDisplayText(undefined, { emptyFallback: '-' })).toBe('-')
  })

  it('supports numeric name prefix for semantic labels', () => {
    expect(
      resolveUserDisplayText(' 123 ', {
        numericNamePrefix: 'domain.approval.label.incompleteUser',
      }),
    ).toBe('domain.approval.label.incompleteUser#123')
  })

  it('returns normalized text for normal names', () => {
    expect(resolveUserDisplayText(' Alice ')).toBe('Alice')
    expect(resolveUserDisplayText('  Alice ', { trimName: false })).toBe('  Alice ')
  })

  it('drops invalid trailing #0 suffix from name text', () => {
    expect(resolveUserDisplayText('张三#0')).toBe('张三')
  })
})
