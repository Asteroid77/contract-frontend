export interface EnumValue<T> {
  code: T
  description: string
}

export type FileSourceType = EnumValue<string>
export type FileStatus = EnumValue<string>
