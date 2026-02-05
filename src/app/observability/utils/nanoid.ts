/**
 * 简易 nanoid 实现
 * 用于生成唯一的错误 ID
 */
const alphabet = 'useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict'

export function nanoid(size: number = 21): string {
  let id = ''
  const bytes = crypto.getRandomValues(new Uint8Array(size))
  for (let i = 0; i < size; i++) {
    id += alphabet[bytes[i] & 63]
  }
  return id
}
