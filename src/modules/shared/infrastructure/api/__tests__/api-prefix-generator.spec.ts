import { describe, expect, it } from 'vitest'
import { createPrefixedEndpoints } from '@/modules/shared/infrastructure/api/api-prefix-generator'

describe('createPrefixedEndpoints', () => {
  it('prefixes string endpoints', () => {
    const endpoints = {
      list: '/users',
      create: '/users/create',
    }

    const prefixed = createPrefixedEndpoints('/api', endpoints)

    expect(prefixed.list).toBe('/api/users')
    expect(prefixed.create).toBe('/api/users/create')
    expect(endpoints.list).toBe('/users')
  })

  it('prefixes function endpoints with dynamic params', () => {
    const endpoints = {
      detail: (id: number) => `/users/${id}`,
      query: (id: number, role: string) => `/users/${id}?role=${role}`,
    }

    const prefixed = createPrefixedEndpoints('/api', endpoints)

    expect(prefixed.detail(7)).toBe('/api/users/7')
    expect(prefixed.query(8, 'admin')).toBe('/api/users/8?role=admin')
  })

  it('falls back to Reflect.get for unknown keys', () => {
    const endpoints = {
      list: '/users',
    }

    const prefixed = createPrefixedEndpoints('/api', endpoints)

    expect((prefixed as Record<string, unknown>).missing).toBeUndefined()
  })
})
