export type OrderDirection = 'ASC' | 'DESC' | 'NATURAL'

export interface BaseOrderItem {
  column: string
  direction?: OrderDirection
}

export interface BasePageRequest<T> {
  page?: number
  noPage?: boolean
  size?: number
  orders?: BaseOrderItem[]
  query?: T
}

export interface IPage<T> {
  records: T[]
  current: number
  size: number
  total: number
  pages: number
  hasPrevious: boolean
  hasNext: boolean
  searchCount: boolean
  totalPage: number
  orders?: BaseOrderItem[]
  optimizeCountSql: boolean
  ignoreTotal: boolean
  maxLimit: number
}
