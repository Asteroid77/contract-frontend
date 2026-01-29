export type InvitationCodeStatus = 0 | 1

export interface InvitationCode {
  id: number
  code: string
  creatorId: number
  remark: string | null
  status: InvitationCodeStatus
  usedCount: number
  createdTime: string
  updatedTime: string | null
  isDeleted: boolean
}

export interface InvitationRecord {
  id: number
  codeId: number
  code: number
  inviterId: number
  inviteeId: number
  createdTime: string
  inviteeName: string | null
  inviteeDiscriminator: number
  inviterName: string | null
  inviterDiscriminator: number
  sum: number
}
