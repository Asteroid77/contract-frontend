//axios mock工具
// import AxiosMockAdapter from 'axios-mock-adapter'
// // 模拟 IndexedDB 环境，要在使用dexie之前
// import 'fake-indexeddb/auto'
// import { beforeAll, afterAll, describe, expect, it, vi } from 'vitest'
// import { useRequest } from '@/hooks/request/useRequest.ts'
// import type { CustomAxiosRequestConfig, ServerResponse } from '@/types/request'
// import dexie from '@/_utils/dexie'
// import { configNotificationHandle } from '@/_utils/request/notification.service.ts'
// import type { ExceptionReport } from '@/types/exception'
// import { apiClient } from '@/_utils/request/http-client'
// import { $t } from '@/_utils/i18n'
// beforeAll(() => {
//   vi.stubEnv('VITE_GIT_BRANCH', 'dev-layout')
//   vi.stubEnv('VITE_GIT_COMMIT', '06ebd37')
// })
// afterAll(() => {
//   vi.unstubAllEnvs()
// })
// //@see https://github.com/ctimmerm/axios-mock-adapter/issues/400
// const axiosMock = new AxiosMockAdapter(apiClient as never)
// const exceptionDB = dexie.exceptions
// vi.mock('primevue', () => {
//   const addMockFn = vi.fn((message: ToastMessageOptions) => {
//     console.log(message)
//   })
//   return {
//     useToast: vi.fn(() => {
//       return {
//         add: addMockFn,
//       }
//     }),
//   }
// })
// const toastMock = useToast() // 获取 mock 的 useToast
// const addMock = toastMock.add // 获取 mock 的 add 方法
// describe('测试useRequest中的逻辑', () => {
//   const data: ServerResponse<null> = {
//     code: 'BUSINESS_ERROR',
//     message: 'test',
//     result: null,
//     status: 500,
//   }
//   it('测试unWrapper', async () => {
//     axiosMock.onGet('test').reply(200, data)
//     const result = await useRequest<null>({
//       notify: true,
//       url: 'test',
//       method: 'get',
//     })
//     expect(result).toStrictEqual(null)
//     const result1 = await useRequest<null>({
//       notify: true,
//       url: 'test',
//       method: 'get',
//       unWrapper: false,
//     })
//     expect(result1.data).toStrictEqual({
//       ...data,
//     })
//   })
//   it('测试notify补全', async () => {
//     axiosMock.onGet('test').reply(200, data)
//     const config: CustomAxiosRequestConfig & { unWrapper: true } = {
//       notify: true,
//       url: 'test',
//       method: 'get',
//       unWrapper: true,
//     }
//     const notify = configNotificationHandle(config, 'test')
//     expect(notify).toStrictEqual({
//       error: {
//         message: 'test',
//         title: 'Oops!',
//         trigger: true,
//         type: 'notification',
//       },
//       success: {
//         message: 'test',
//         title: 'Success',
//         trigger: true,
//         type: 'notification',
//       },
//     })
//   })
//   it('测试业务错误时useToast信息', async () => {
//     axiosMock.onGet('test').reply(200, data)
//     await useRequest<null>({
//       notify: true,
//       url: 'test',
//       method: 'get',
//     })
//     expect(addMock).toHaveBeenCalledWith({
//       severity: 'error',
//       summary: $t('exception.unexpected.business.title'),
//       detail: 'test',
//       life: 1500,
//     })
//   })
//   it('测试成功时useToast信息', async () => {
//     const data1: ServerResponse<null> = {
//       code: 'SUCCESS',
//       message: 'test',
//       result: null,
//       status: 200,
//     }
//     axiosMock.onGet('test').reply(200, data1)
//     await useRequest<null>({
//       notify: true,
//       url: 'test',
//       method: 'get',
//     })
//     expect(addMock).toHaveBeenCalledWith({
//       severity: 'success',
//       summary: 'Success',
//       detail: 'test',
//       life: 1500,
//     })
//   })
//   it('测试400 server error时useToast信息', async () => {
//     const data1: ServerResponse<null> = {
//       code: 'ERR',
//       message: 'test',
//       result: null,
//       status: 400,
//     }
//     axiosMock.onGet('test').reply(400, data1)
//     try {
//       await useRequest<null>({
//         notify: true,
//         url: 'test',
//         method: 'get',
//       })
//     } catch (err) {
//       expect(addMock).toHaveBeenCalledWith({
//         severity: 'error',
//         summary: $t('common.error'),
//         detail: 'Request failed with status code 400',
//         life: 1500,
//       })
//     }
//   })
//   it('测试500 server error时toast信息', async () => {
//     const data2: ServerResponse<null> = {
//       code: 'ERR',
//       message: 'test',
//       result: null,
//       status: 500,
//     }
//     axiosMock.onGet('test').reply(500, data2)
//     try {
//       await useRequest<null>({
//         notify: true,
//         url: 'test',
//         method: 'get',
//       })
//     } catch (err) {
//       expect(addMock).toHaveBeenCalledWith({
//         severity: 'error',
//         summary: $t('exception.unexpected.title'),
//         detail: $t('exception.unexpected.message'),
//         life: 1500,
//       })
//     }
//   })
//   it('测试indexedDB中的错误日志是否符合预期', async () => {
//     const data2: ServerResponse<null> = {
//       code: 'ERR',
//       message: 'test',
//       result: null,
//       status: 500,
//     }
//     axiosMock.onGet('test').reply(500, data2)
//     try {
//       await useRequest<null>({
//         notify: true,
//         url: 'test',
//         method: 'get',
//       })
//     } catch (err) {
//       expect(addMock).toHaveBeenCalledWith({
//         severity: 'error',
//         summary: $t('exception.unexpected.title'),
//         detail: $t('exception.unexpected.message'),
//         life: 1500,
//       })
//     }
//     await new Promise((resolve, reject) => {
//       setTimeout(async () => {
//         const result = (await exceptionDB.get('1')) as ExceptionReport<unknown>
//         expect(result.level).toBe('fatal')
//         expect(result.type).toBe('server')
//         expect(result.tags).toStrictEqual({
//           version: '0.0.1',
//           branch: 'dev-layout',
//           commit: '06ebd37',
//         })
//         expect(result.message).toBe('Request failed with status code 500')
//         resolve('test')
//       }, 3000)
//     })
//   })
// })
