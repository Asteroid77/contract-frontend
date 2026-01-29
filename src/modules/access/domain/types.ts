export interface Permission {
  id: number
  name: string
  description: string
}

export interface RoleVo {
  id: number
  name: string
  description: string
  permissions: Permission[]
}

export interface AssignedUserOptions {
  id: number
  name: string | null
  discriminator: number | null
}
