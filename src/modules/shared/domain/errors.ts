export class BusinessError extends Error {
  public readonly code: number
  public readonly traceId: string
  public readonly requestId: string
  public readonly type: string
  public readonly status: number
  public readonly isBusinessError = true

  constructor(
    message: string,
    code: number,
    traceId: string = '',
    requestId: string = '',
    type: string = 'about:blank',
    status: number = 400,
  ) {
    super(message)
    this.name = 'BusinessError'
    this.code = code
    this.traceId = traceId
    this.requestId = requestId
    this.type = type
    this.status = status

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, BusinessError)
    }
  }
}
