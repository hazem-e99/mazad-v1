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

  # Anchored (leading-slash) patterns match only at the root of
  # $source_dir, not at any nested depth — required here because
  # $source_dir is often the same directory as $APP_DIR (the operator
  # clones the repo straight to /opt/lwh7 and runs deploy from there).
  # Without excluding /current, /releases and /shared, rsync would copy
  # $APP_DIR/releases (which contains the release currently being built)
  # into itself, recursively, without bound — that's exactly what
  # produced .../releases/<ts>/releases/<ts>/releases/... and rsync
  # error 23. These three MUST stay anchored: an unanchored `releases`
  # or `shared` would also (harmlessly here, but incorrectly in
  # principle) strip any same-named directory the application source
  # ever legitimately contained.
  rsync -a --delete \
    --exclude '/current' \
    --exclude '/releases' \
    --exclude '/shared' \
    --exclude '/.git' \
    --exclude '/node_modules' \
    --exclude '/.next' \
    --exclude '/private-uploads' \
    --exclude '/public/uploads' \
    --exclude '/logs' \
    --exclude '/.env' \
    --exclude '/.env.local' \
    --exclude '/.env.production' \
    --exclude '/.env.production.local' \
    --exclude '/tsconfig.tsbuildinfo' \
    --exclude '/coverage' \
    --exclude '/deployment' \
    "$source_dir"/ "$NEW_RELEASE"/

  # Belt-and-suspenders: if the exclusions above were ever bypassed or
  # misconfigured, refuse to activate a release that recursively contains
  # the runtime directories rather than silently shipping a corrupted
  # (and enormous) release.
  for reserved in current releases shared; do
    if [[ -e "$NEW_RELEASE/$reserved" ]]; then
      fail "Release $NEW_RELEASE unexpectedly contains '$reserved' — rsync exclusions did not take effect. Refusing to activate this release. Check that \$source_dir ($source_dir) and \$APP_DIR ($APP_DIR) aren't producing an overlapping copy."
    fi
  done

  # Shared, persistent resources — symlinked in, never copied. Every
  # release gets the same env file, ownership-document uploads, and
  # public uploads directory; none of their content ever lives inside a
  # release directory itself, so pruning a release (see
  # prune_old_releases below) can never touch them.
  ln -sfn "$SHARED_ENV_FILE" "$NEW_RELEASE/.env"

  mkdir -p "$SHARED_UPLOADS_DIR"
  ln -sfn "$SHARED_UPLOADS_DIR" "$NEW_RELEASE/private-uploads"

  mkdir -p "$SHARED_PUBLIC_UPLOADS_DIR"
  mkdir -p "$NEW_RELEASE/public"
  ln -sfn "$SHARED_PUBLIC_UPLOADS_DIR" "$NEW_RELEASE/public/uploads"

  # --include=dev is the real fix (it installs devDependencies regardless
  # of NODE_ENV), but an ambient NODE_ENV=production in the caller's shell
  # is a known footgun on this project (it previously caused a manually
  # run `npm ci` with no flags to install ~132 packages instead of ~500,
  # silently omitting build-only tools like cross-env) — unset it too, for
  # a build step that can't be affected by whatever shell state a future
  # operator happens to be in.
  log "Installing dependencies (npm ci --include=dev)..."
  (cd "$NEW_RELEASE" && unset NODE_ENV && npm ci --include=dev)
  [[ -f "$NEW_RELEASE/node_modules/.bin/cross-env" ]] || fail "cross-env missing after npm ci --include=dev — devDependencies were not installed. Do not export NODE_ENV=production before this step without --include=dev."

  log "Building application (next build)..."
  # NODE_ENV=production for this step only, via the project's own
  # `cross-env NODE_ENV=production next build` script — not exported into
  # this shell, so it can never leak back and affect the npm ci above on a
  # re-run.
  (cd "$NEW_RELEASE" && NODE_OPTIONS="--max-old-space-size=2048" npm run build)

  [[ -f "$NEW_RELEASE/.next/BUILD_ID" ]] || fail "Build did not produce .next/BUILD_ID — aborting before touching the live release."

  chown -R "$APP_USER:$APP_GROUP" "$NEW_RELEASE"

  ln -sfn "$NEW_RELEASE" "$CURRENT_LINK"
  ok "Release $ts activated -> $CURRENT_LINK"

  prune_old_releases
}

prune_old_releases() {
  # Safe by construction, not just by convention: this only ever lists
  # and rm -rf's direct children of $RELEASES_DIR (a sibling of
  # $SHARED_DIR under $APP_DIR, never a descendant of it), so it cannot
  # reach $SHARED_DIR/* even in principle. And because uploads live in a
  # release only as a symlink (see build_release above), `rm -rf` on a
  # pruned release removes that symlink entry, never the shared target
  # it points to — rm never follows a symlink to recurse into it.
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
