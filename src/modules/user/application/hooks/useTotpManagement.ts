import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import type { AxiosError } from 'axios'
import type { TotpStatus, TotpSetupResult, TotpEnableForm, TotpDisableForm } from '../models'
import { totpService } from '../totp-service'

const TOTP_STATUS_KEY = ['totp', 'status'] as const

export function useTotpStatusQuery() {
  return useQuery<TotpStatus, AxiosError>({
    queryKey: [...TOTP_STATUS_KEY],
    queryFn: () => totpService.getStatus(),
  })
}

export function useTotpSetupMutation() {
  return useMutation<TotpSetupResult, AxiosError>({
    mutationFn: () => totpService.setup(),
  })
}

export function useTotpEnableMutation() {
  const queryClient = useQueryClient()
  return useMutation<boolean, AxiosError, TotpEnableForm>({
    mutationFn: (data) => totpService.enable(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...TOTP_STATUS_KEY] })
    },
  })
}

export function useTotpDisableMutation() {
  const queryClient = useQueryClient()
  return useMutation<void, AxiosError, TotpDisableForm>({
    mutationFn: (data) => totpService.disable(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...TOTP_STATUS_KEY] })
    },
  })
}

export function useTotpBackupCodesMutation() {
  return useMutation<string[], AxiosError>({
    mutationFn: () => totpService.regenerateBackupCodes(),
  })
}
