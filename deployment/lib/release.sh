#!/usr/bin/env bash
# build_release <source_dir> — builds a new timestamped release from
# <source_dir> (a git checkout of the app) and, only on success, flips
# $CURRENT_LINK to point at it. Never touches the currently-running
# release until the new build has actually succeeded.
#
# Expects config.sh + lib/common.sh already sourced by the caller.
# Sets NEW_RELEASE (absolute path) on success.

build_release() {
  local source_dir="$1"
  local ts
  ts="$(date +%Y%m%d%H%M%S)"
  NEW_RELEASE="$RELEASES_DIR/$ts"

  log "Building release $ts from $source_dir ..."
  mkdir -p "$NEW_RELEASE"

  rsync -a --delete \
    --exclude '.git' \
    --exclude 'node_modules' \
    --exclude '.next' \
    --exclude 'private-uploads' \
    --exclude 'public/uploads' \
    --exclude 'logs' \
    --exclude '.env' \
    --exclude '.env.local' \
    --exclude '.env.production' \
    --exclude '.env.production.local' \
    --exclude 'tsconfig.tsbuildinfo' \
    --exclude 'coverage' \
    --exclude 'deployment' \
    "$source_dir"/ "$NEW_RELEASE"/

  # Shared, persistent resources: the production secrets file and the
  # only on-disk upload directory the app actually uses (ownership
  # documents). Public images are stored in MongoDB, not on disk.
  ln -sfn "$SHARED_ENV_FILE" "$NEW_RELEASE/.env"
  mkdir -p "$SHARED_UPLOADS_DIR"
  ln -sfn "$SHARED_UPLOADS_DIR" "$NEW_RELEASE/private-uploads"

  log "Installing dependencies (npm ci)..."
  (cd "$NEW_RELEASE" && npm ci --include=dev)

  log "Building application (next build)..."
  (cd "$NEW_RELEASE" && NODE_OPTIONS="--max-old-space-size=2048" npm run build)

  [[ -f "$NEW_RELEASE/.next/BUILD_ID" ]] || fail "Build did not produce .next/BUILD_ID — aborting before touching the live release."

  chown -R "$APP_USER:$APP_GROUP" "$NEW_RELEASE"

  ln -sfn "$NEW_RELEASE" "$CURRENT_LINK"
  ok "Release $ts activated -> $CURRENT_LINK"

  prune_old_releases
}

prune_old_releases() {
  local keep="${KEEP_RELEASES:-5}"
  local count
  count="$(find "$RELEASES_DIR" -maxdepth 1 -mindepth 1 -type d | wc -l)"
  if [[ "$count" -le "$keep" ]]; then return; fi
  find "$RELEASES_DIR" -maxdepth 1 -mindepth 1 -type d -printf '%T@ %p\n' 2>/dev/null \
    | sort -n \
    | head -n "$((count - keep))" \
    | awk '{print $2}' \
    | while read -r old; do
        [[ "$(readlink -f "$CURRENT_LINK")" == "$old" ]] && continue
        log "Pruning old release: $old"
        rm -rf "$old"
      done
}
