import axios, { type AxiosInstance, type CreateAxiosDefaults } from 'axios'
import { stringify } from 'qs'
import { getBackendURL } from './get-backend-url'
const axiosDefaultOptions: CreateAxiosDefaults = {
  timeout: 10000,
  baseURL: getBackendURL(),
  withCredentials: false,
  headers: {
    'Content-Type': 'application/json',
  },
  paramsSerializer: {
    serialize: (params: Record<string, unknown>) => {
      return stringify(params, { arrayFormat: 'repeat' })
    },
  },
}
/**
 * 使用axios功能
 * @return {AxiosInstance}
 */
export const apiClient: AxiosInstance = axios.create(axiosDefaultOptions)
