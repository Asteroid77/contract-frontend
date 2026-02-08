import type { RequestContext } from '@/modules/shared/application/request/types'

const requestContextStack: RequestContext[] = []

export const getCurrentRequestContext = (): RequestContext | undefined => {
  const current = requestContextStack[requestContextStack.length - 1]
  return current ? { ...current } : undefined
}

export const withRequestContext = async <T>(
  context: RequestContext,
  executor: () => Promise<T> | T,
): Promise<T> => {
  requestContextStack.push(context)

  let result: Promise<T> | T
  try {
    result = executor()
  } catch (error) {
    requestContextStack.pop()
    throw error
  }

  requestContextStack.pop()
  return await result
}
