import type { OssCallbackDTO as DomainOssCallbackDTO } from '../domain/types'

export type OssCallbackView = Omit<DomainOssCallbackDTO, 'path'> & {
  accessUrl: string
}

export type OssCallbackDTO = OssCallbackView

export const toOssCallbackView = (dto: DomainOssCallbackDTO): OssCallbackView => {
  const { path, ...rest } = dto
  return {
    ...rest,
    accessUrl: path,
  }
}

export const toOssCallbackViews = (items: DomainOssCallbackDTO[]): OssCallbackView[] =>
  items.map(toOssCallbackView)
