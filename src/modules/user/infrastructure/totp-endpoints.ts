import { createPrefixedEndpoints } from '@/modules/shared/infrastructure/api/api-prefix-generator'

export const TOTP_ENDPOINTS = createPrefixedEndpoints('/totp', {
  VERIFY: '/verify',
  STATUS: '/status',
  SETUP: '/setup',
  ENABLE: '/enable',
  DISABLE: '/disable',
  BACKUP_CODES: '/backup-codes',
})
