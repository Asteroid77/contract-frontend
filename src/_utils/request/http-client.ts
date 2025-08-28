import axios, { type AxiosInstance, type CreateAxiosDefaults, type AxiosHeaders } from 'axios'
const axiosDefaultOptions: CreateAxiosDefaults = {
  timeout: 10000,
  baseURL: import.meta.env.VITE_BACKEND_SERVER_URL || 'https://localhost:8090',
  headers: {
    'Content-Type': 'application/json',
    Authorization: localStorage.getItem('ACCESS_TOKEN') || '',
  },
}
_defaultOptionHeadersAssign('satoken', localStorage.getItem('ACCESS_TOKEN'))
export const apiClient: AxiosInstance = axios.create(axiosDefaultOptions)

/**
 * 使用axios功能
 * @return {AxiosInstance}
 */

/**
 * 设置默认axios配置中的headers key以及value
 * @param {string} key 键
 * @param {AxiosHeaderValue} value 值
 */
function _defaultOptionHeadersAssign(key: string, value: AxiosHeaders[keyof AxiosHeaders]) {
  if (value !== undefined && value !== null) {
    if (!axiosDefaultOptions.headers) axiosDefaultOptions.headers = {}
    axiosDefaultOptions.headers = {
      ...axiosDefaultOptions.headers,
      [key]: value,
    }
  }
}
