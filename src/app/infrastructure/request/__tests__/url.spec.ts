import { afterEach, describe, expect, it, vi } from 'vitest'
import { getBackendURL } from '@/app/infrastructure/request/get-backend-url'
import {
  getFrontendLoginUrl,
  getFrontendOrigin,
} from '@/app/infrastructure/request/get-frontend-url'

describe('request url utils', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('getBackendURL prefers VITE_BACKEND_SERVER_URL when provided', () => {
    vi.stubEnv('VITE_BACKEND_SERVER_URL', 'https://backend.example.com')
    vi.stubEnv('VITE_BACKEND_SERVER_PORT', '8443')

    expect(getBackendURL()).toBe('https://backend.example.com')
  })

  it('getBackendURL builds host+port+api when only port is configured', () => {
    vi.stubEnv('VITE_BACKEND_SERVER_URL', '')
    vi.stubEnv('VITE_BACKEND_SERVER_PORT', '8443')

    expect(getBackendURL()).toBe(`https://${window.location.hostname}:8443/api`)
  })

  it('getBackendURL builds host+api when neither full url nor port is configured', () => {
    vi.stubEnv('VITE_BACKEND_SERVER_URL', '')
    vi.stubEnv('VITE_BACKEND_SERVER_PORT', '')

    expect(getBackendURL()).toBe(`https://${window.location.hostname}/api`)
  })

  it('getFrontendOrigin/getFrontendLoginUrl derive from window.location.origin', () => {
    expect(getFrontendOrigin()).toBe(window.location.origin)
    expect(getFrontendLoginUrl()).toBe(`${window.location.origin}/unauth/login`)
  })
})
