#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

fail() {
  echo "docs-check: $*" >&2
  exit 1
}

require_file() {
  local path="$1"
  [[ -f "$path" ]] || fail "missing file: $path"
}

require_dir() {
  local path="$1"
  [[ -d "$path" ]] || fail "missing directory: $path"
}

require_file "README.md"
require_file "AGENTS.md"
require_file "CONTRIBUTING.md"
require_file "SECURITY.md"
require_file "SUPPORT.md"
require_file "docs/index.md"
require_file "docs/governance/README.md"

for dir in docs/explanation docs/how-to docs/reference docs/adr docs/plans docs/reports docs/generated docs/archive; do
  require_dir "$dir"
done

unexpected_top_files="$(find docs -maxdepth 1 -type f ! -name index.md -print)"
[[ -z "$unexpected_top_files" ]] || fail "unexpected top-level docs files:\n$unexpected_top_files"

if ! command -v rg >/dev/null 2>&1; then
  fail "ripgrep (rg) is required for docs checks"
fi

obsolete_patterns=(
  "docs/CASL_INTEGRATION.md"
  "docs/LAYOUT_ROUTER_REVIEW.md"
  "docs/OBSERVABILITY_I18N_REFACTOR.md"
  "docs/OPENREPLAY_SETUP.md"
  "docs/REFACTOR_COMPLETE.md"
  "docs/change-log-2026-02-27-responsive-query-auth-mobile.md"
  "docs/commit-plan.md"
  "docs/design-contract.yaml"
  "docs/design-token-spec.yaml"
  "docs/layout-change-review-2026-02-25.md"
  "docs/module-test-coverage-audit.md"
  "docs/perf-playbook.md"
  "docs/request-auth-refresh-architecture.md"
  "docs/request-feedback-success-audit.md"
  "docs/request-feedback-success-toast.md"
  "docs/scripts-annotations.md"
  "docs/views-test-cases-catalog.md"
)

for pattern in "${obsolete_patterns[@]}"; do
  if matches="$(rg -n -F "$pattern" \
    README.md AGENTS.md CONTRIBUTING.md SECURITY.md SUPPORT.md Rule.md docs scripts/check-px-whitelist.mjs \
    --glob '*.md' \
    --glob '*.mjs' || true)"; then
    [[ -z "$matches" ]] || fail "obsolete doc path found: $pattern\n$matches"
  fi
done

echo "docs-check: ok"
