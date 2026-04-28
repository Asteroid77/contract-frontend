import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(__dirname, '..')
const policyPath = resolve(repoRoot, 'src/modules/shared/application/security/access-policy.json')
const nginxConfDirRelativePath = 'stack/docker-setting/nginx/conf.d'
const nginxOutputRelativePath = `${nginxConfDirRelativePath}/generated/frontend-security-origins.conf`

export const ensureStringArray = (value, key) => {
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string' || !item.trim())) {
    throw new Error(`${key} must be a string array`)
  }
  return value.map((item) => item.trim())
}

export const resolveInfraRoot = (
  currentRepoRoot,
  {
    candidates = [
      process.env.FRONTEND_SECURITY_INFRA_ROOT,
      resolve(currentRepoRoot, '../../../../infra'),
      resolve(currentRepoRoot, '../../../infra'),
    ],
    exists = existsSync,
  } = {},
) => {
  for (const candidate of candidates) {
    if (!candidate) {
      continue
    }

    if (exists(resolve(candidate, nginxConfDirRelativePath))) {
      return candidate
    }
  }

  throw new Error('unable to resolve infra root for frontend security origins')
}

export const renderGeneratedContent = (policy) => {
  const cspSharedOrigins = ensureStringArray(policy.cspSharedOrigins, 'cspSharedOrigins')
  const cspWorkerSources = ensureStringArray(policy.cspWorkerSources, 'cspWorkerSources')

  return `# Generated from contract-frontend access-policy.json
set $frontend_shared_resource_origins "${cspSharedOrigins.join(' ')}";
set $frontend_worker_src "${cspWorkerSources.join(' ')}";
`
}

export const syncFrontendSecurityOrigins = ({
  currentRepoRoot = repoRoot,
  inputPolicyPath = policyPath,
  outputPath = resolve(resolveInfraRoot(currentRepoRoot), nginxOutputRelativePath),
  check = false,
} = {}) => {
  const policy = JSON.parse(readFileSync(inputPolicyPath, 'utf8'))
  const generatedContent = renderGeneratedContent(policy)

  if (check) {
    const current = readFileSync(outputPath, 'utf8')
    if (current !== generatedContent) {
      throw new Error('generated frontend security origins conf is out of date')
    }
    process.stdout.write('frontend-security-origins: ok\n')
    return
  }

  mkdirSync(dirname(outputPath), { recursive: true })
  writeFileSync(outputPath, generatedContent)
  process.stdout.write(`wrote ${outputPath}\n`)
}

const isMainModule = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)

if (isMainModule) {
  syncFrontendSecurityOrigins({
    check: process.argv.includes('--check'),
  })
}
