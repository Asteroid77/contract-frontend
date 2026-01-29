import printCore from './PrintCore.css?raw'

import attachmentStyles from '@/modules/approval/presentation/approval/styles/AttachmentApprovalDiff.css?raw'
import cardStyles from '@/modules/approval/presentation/approval/styles/FileItemCard.css?raw'

export const getPrintStyles = () => {
  return `
    ${printCore}
    ${attachmentStyles}
    ${cardStyles}
  `
}
