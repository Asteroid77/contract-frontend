import { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'
import type { CustomAxiosRequestConfig, ServerResponse } from '@/types/request'
import { ResponseCode } from '@/constant/response_code/business_code'
export function businessErrorStrategy(
  config: CustomAxiosRequestConfig,
  result: AxiosResponse<ServerResponse<unknown>>,
) {
  if (result.data.code !== ResponseCode.SUCCESS) {
    throw new AxiosError(
      result.data.message, // message
      `${result.data.code}`, // 错误代码（如 'ECONNABORTED'）
      config as InternalAxiosRequestConfig, // 请求配置对象
      null, // request 实例（可选）
      result,
    )
  }
}
