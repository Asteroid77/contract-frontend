import {
  BookOpen,
  BriefcaseBusiness,
  Building2,
  ClipboardCheck,
  ClipboardList,
  FileSignature,
  FileText,
  GitBranch,
  House,
  IdCard,
  LayoutDashboard,
  Settings,
  Ticket,
  UserCheck,
  UserCog,
  UserRound,
  UsersRound,
} from 'lucide-vue-next'
import type { Component } from 'vue'

export const appIconRegistry = {
  'nav.dashboard': LayoutDashboard,
  'nav.docs': BookOpen,
  'nav.approval': ClipboardCheck,
  'nav.business': BriefcaseBusiness,
  'nav.manage': UserCog,
  'nav.settings': Settings,
  'nav.user': UserRound,
  'approval.instance': ClipboardList,
  'approval.reviewing': UserCheck,
  'approval.process': GitBranch,
  'approval.nodes': Building2,
  'approval.tasks': ClipboardList,
  'business.invitation': IdCard,
  'agreement.signList': FileText,
  'agreement.selfSign': FileSignature,
  'user.profile': UserRound,
  'user.manage': UsersRound,
  'user.agents': House,
  'workOrder.list': Ticket,
} as const satisfies Record<string, Component>

export type AppIconName = keyof typeof appIconRegistry

export function resolveAppIcon(name: string): Component | null {
  return appIconRegistry[name as AppIconName] ?? null
}
