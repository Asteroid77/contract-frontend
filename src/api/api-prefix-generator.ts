export const createPrefixedEndpoints = <T extends Record<string, string>>(
  prefix: string,
  endpoints: T,
) => {
  const resolver = (path: string) => `${prefix}${path}`
  return new Proxy(endpoints, {
    get: (target, p: string | symbol, receiver) => {
      // 需要检查p是否为keyof T的有效键
      if (typeof p === 'string' && p in target) {
        return resolver(target[p as keyof T])
      }
      return Reflect.get(target, p, receiver)
    },
  })
}
