export class BusinessError extends Error {
  public readonly code: number
  public readonly isBusinessError = true

  constructor(message: string, code: number) {
    super(message)
    this.name = 'BusinessError'
    this.code = code

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, BusinessError)
    }
  }
}
