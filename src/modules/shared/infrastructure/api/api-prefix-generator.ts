// eslint-disable-next-line
type Endpoint = (...args: any[]) => string
export const createPrefixedEndpoints = <T extends Record<string, string | Endpoint>>(
  prefix: string,
  endpoints: T,
) => {
  const resolver = (path: string) => `${prefix}${path}`

  // Proxy 的类型需要反映出 endpoints 的结构
  return new Proxy(endpoints, {
    get: (target, p: string | symbol, receiver) => {
      // 确保我们只处理对象自身的、类型为 string 的 key
      if (typeof p === 'string' && p in target) {
        // 1. 获取原始端点 (可能是字符串或函数)
        const originalEndpoint = target[p as keyof T]

        // 2. 判断端点的类型
        if (typeof originalEndpoint === 'function') {
          // 3. 如果是函数，我们必须返回一个*新*的函数
          return (...args: unknown[]) => {
            // 4. 在新函数内部，首先调用原始函数获取基本路径
            const path = originalEndpoint(...args)
            // 5. 然后对返回的路径应用前缀
            return resolver(path)
          }
        }

        // 6. 如果是字符串，则保持原有逻辑
        if (typeof originalEndpoint === 'string') {
          return resolver(originalEndpoint)
        }
      }

      // 对于其他所有情况 (如原型链上的属性)，使用默认行为
      return Reflect.get(target, p, receiver)
    },
  }) as T // 将 Proxy 断言为原始类型 T，以便外部使用时类型正确
}
