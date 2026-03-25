import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import type { TotpEnableForm, TotpDisableForm } from '../models'
import { totpService } from '../totp-service'

const TOTP_STATUS_KEY = ['totp', 'status'] as const

export function useTotpStatusQuery() {
  return useQuery({
    queryKey: TOTP_STATUS_KEY,
    queryFn: () => totpService.getStatus(),
  })
}

export function useTotpSetupMutation() {
  return useMutation({
    mutationFn: () => totpService.setup(),
  })
}

export function useTotpEnableMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: TotpEnableForm) => totpService.enable(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TOTP_STATUS_KEY })
    },
  })
}

export function useTotpDisableMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: TotpDisableForm) => totpService.disable(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TOTP_STATUS_KEY })
    },
  })
}

export function useTotpBackupCodesMutation() {
  return useMutation({
    mutationFn: () => totpService.regenerateBackupCodes(),
  })
}
