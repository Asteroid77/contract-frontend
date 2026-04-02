import type { FilterCondition, FilterOp, QueryLogic } from '@/modules/shared/domain/query'

export enum FieldType {
  STRING = 'STRING',
  NUMBER = 'NUMBER',
  DATE = 'DATE',
  DATETIME = 'DATETIME',
  BOOLEAN = 'BOOLEAN',
  ENUM = 'ENUM',
  PCA = 'PCA',
}

export type FieldOption = { label: string; value: string | number }

export interface FieldConfig {
  key: string
  labelKey: string
  type: FieldType
  options?: FieldOption[]
  operators?: FilterOp[]
}

export interface OperatorConfig {
  value: FilterOp
  labelKey: string
  needValue: boolean
  valueCount: 1 | 2 | 'multiple'
}

export interface FilterConditionItem extends FilterCondition {
  id: string
}

export interface QueryGroupItem {
  id: string
  logic: QueryLogic
  filters: FilterConditionItem[]
  groups: QueryGroupItem[]
}
