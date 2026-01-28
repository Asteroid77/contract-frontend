import printCore from './PrintCore.css?raw'

import attachmentStyles from '@/components/approval/styles/AttachmentApprovalDiff.css?raw'
import cardStyles from '@/components/approval/styles/FileItemCard.css?raw'

export const getPrintStyles = () => {
  return `
    ${printCore}
    ${attachmentStyles}
    ${cardStyles}
  `
}
