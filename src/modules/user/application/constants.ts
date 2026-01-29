import { $t } from '@/_utils/i18n'

export const RegisterType = {
  LEGAL_REPRESENTATIVE: 1,
  INDIVIDUAL: 2,
}
export const RegisterTypeOption = [
  {
    label: $t('common.options.registerType.legalRepresentative'),
    value: RegisterType.LEGAL_REPRESENTATIVE,
  },
  {
    label: $t('common.options.registerType.individualOrAgent'),
    value: RegisterType.INDIVIDUAL,
  },
]
