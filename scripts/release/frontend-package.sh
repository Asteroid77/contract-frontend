#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd -P)
REPO_ROOT=$(cd "$SCRIPT_DIR/../.." && pwd -P)
cd "$REPO_ROOT"

RELEASE_TAG=${RELEASE_TAG:-${GITHUB_REF_NAME:-}}
if [[ -z "$RELEASE_TAG" && -n "${GITHUB_REF:-}" && "$GITHUB_REF" == refs/tags/* ]]; then
  RELEASE_TAG=${GITHUB_REF#refs/tags/}
fi
[[ -n "$RELEASE_TAG" ]] || {
  echo "RELEASE_TAG is not set and could not be inferred" >&2
  exit 1
}
[[ "$RELEASE_TAG" =~ ^v[0-9]+\.[0-9]+\.[0-9]+(-[0-9A-Za-z.-]+)?$ ]] || {
  echo "Invalid RELEASE_TAG '$RELEASE_TAG'" >&2
  exit 1
}

RELEASE_ID=${RELEASE_ID:-$RELEASE_TAG}
REPO_COMMIT=${REPO_COMMIT:-$(git rev-parse --verify HEAD)}
SANITIZED_TAG=${RELEASE_TAG//\//-}
ARTIFACT_ROOT="$REPO_ROOT/release-artifacts"
DIST_DIR="$REPO_ROOT/dist"

rm -rf "$ARTIFACT_ROOT"
mkdir -p "$ARTIFACT_ROOT"

echo "[release-package] Running type-check"
pnpm type-check

echo "[release-package] Building frontend bundle for $RELEASE_TAG"
pnpm build-only --sourcemap
[[ -d "$DIST_DIR" ]] || {
  echo "Expected build output at '$DIST_DIR'" >&2
  exit 1
}

ASSET_BUNDLE="frontend-${SANITIZED_TAG}.tar.gz"
SOURCEMAP_BUNDLE="frontend-${SANITIZED_TAG}-sourcemaps.tar.gz"
METADATA_FILE="frontend-${SANITIZED_TAG}.metadata"

tar -C "$DIST_DIR" --exclude='*.map' -czf "$ARTIFACT_ROOT/$ASSET_BUNDLE" .

SOURCEMAP_STAGE="$ARTIFACT_ROOT/sourcemap-files"
mkdir -p "$SOURCEMAP_STAGE"
rsync -a --include '*/' --include '*.map' --exclude '*' \
  "$DIST_DIR/" "$SOURCEMAP_STAGE/"
MAP_COUNT=$(find "$SOURCEMAP_STAGE" -type f | wc -l)
[[ "$MAP_COUNT" -gt 0 ]] || {
  echo "No sourcemap files were collected from '$DIST_DIR'" >&2
  exit 1
}
tar -C "$SOURCEMAP_STAGE" -czf "$ARTIFACT_ROOT/$SOURCEMAP_BUNDLE" .
rm -rf "$SOURCEMAP_STAGE"

ASSET_SHA=$(sha256sum "$ARTIFACT_ROOT/$ASSET_BUNDLE" | awk '{print $1}')
SOURCEMAP_SHA=$(sha256sum "$ARTIFACT_ROOT/$SOURCEMAP_BUNDLE" | awk '{print $1}')

cat <<METADATA > "$ARTIFACT_ROOT/$METADATA_FILE"
release_id=$RELEASE_ID
git_tag=$RELEASE_TAG
git_commit=$REPO_COMMIT
asset_bundle=$ASSET_BUNDLE
asset_bundle_sha256=$ASSET_SHA
sourcemap_bundle=$SOURCEMAP_BUNDLE
sourcemap_bundle_sha256=$SOURCEMAP_SHA
METADATA

echo "[release-package] Generated $METADATA_FILE"
ls -1 "$ARTIFACT_ROOT"
