import DOMPurify, { type Config as DOMPurifyConfig } from 'dompurify'
import { getContractFrontendHtmlPolicy } from '@/modules/shared/application/security/trusted-types'

const MARKDOWN_HTML_CONFIG: DOMPurifyConfig = {
  USE_PROFILES: { html: true },
  FORBID_TAGS: ['script', 'style', 'iframe'],
  FORBID_ATTR: ['srcdoc'],
  ALLOW_DATA_ATTR: true,
  RETURN_TRUSTED_TYPE: false,
}

const MARKDOWN_SVG_CONFIG: DOMPurifyConfig = {
  USE_PROFILES: { svg: true, svgFilters: true },
  FORBID_TAGS: ['foreignObject', 'script', 'style'],
  FORBID_ATTR: ['srcdoc'],
  ALLOW_DATA_ATTR: true,
  RETURN_TRUSTED_TYPE: false,
}

function sanitizeHtmlWithConfig(input: string, config: DOMPurifyConfig) {
  const trustedTypesPolicy = getContractFrontendHtmlPolicy()

  return DOMPurify.sanitize(input, {
    ...config,
    ...(trustedTypesPolicy
      ? {
          TRUSTED_TYPES_POLICY:
            trustedTypesPolicy as unknown as DOMPurifyConfig['TRUSTED_TYPES_POLICY'],
        }
      : {}),
  })
}

export function sanitizeMarkdownHtml(html: string) {
  return sanitizeHtmlWithConfig(html, MARKDOWN_HTML_CONFIG)
}

export async function sanitizeMarkdownMermaid(svg: string) {
  return sanitizeHtmlWithConfig(svg, MARKDOWN_SVG_CONFIG)
}
