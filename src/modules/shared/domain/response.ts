export interface ServerResponse<T> {
  code: number
  message: string
  data: T
  status: string | number
}
