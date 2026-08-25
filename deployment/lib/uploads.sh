#!/usr/bin/env bash
# Safety helpers for the persistent shared public-uploads directory.
#
# The ONLY valid runtime layout is a symlink:
#   <release>/public/uploads -> $SHARED_PUBLIC_UPLOADS_DIR
# Nothing is ever copied into a release for this — see build_release() in
# lib/release.sh. These helpers exist to (a) safely pull in any
# pre-existing real uploads the first time this system is set up, and
# (b) refuse to deploy if the persistence layout is ever wrong, instead
# of silently going live with — or perpetuating — a corrupted one.
#
# Expects config.sh + lib/common.sh already sourced by the caller.

# True if both paths exist and canonically resolve to the same real path.
paths_equal() {
  local a b
  a="$(readlink -f "$1" 2>/dev/null || true)"
  b="$(readlink -f "$2" 2>/dev/null || true)"
  [[ -n "$a" && "$a" == "$b" ]]
}

# migrate_public_uploads <candidate> [<candidate> ...]
#
# Idempotent, symlink-safe migration of legacy real (non-symlink)
# public/uploads directories into $SHARED_PUBLIC_UPLOADS_DIR. Safe to
# call on every deploy — a no-op once nothing but symlinks remain at the
# candidate paths, which is the case for every release built by
# build_release() from here on.
#
# A candidate is skipped entirely (never migrated through) if it:
#   - doesn't exist,
#   - is itself a symlink (of any kind — we only ever migrate a real,
#     literal directory; the code that would otherwise dereference a
#     symlinked source is exactly what produced the
#     public-uploads/public-uploads/... corruption in production),
#   - is empty (nothing to migrate).
migrate_public_uploads() {
  mkdir -p "$SHARED_PUBLIC_UPLOADS_DIR"
  local candidate
  for candidate in "$@"; do
    [[ -e "$candidate" ]] || continue

    if [[ -L "$candidate" ]]; then
      log "Skipping upload-migration source (it's a symlink, not a real directory): $candidate"
      continue
    fi

    if [[ ! -d "$candidate" ]]; then
      continue
    fi

    if paths_equal "$candidate" "$SHARED_PUBLIC_UPLOADS_DIR"; then
      continue
    fi

    if [[ -z "$(find "$candidate" -mindepth 1 -print -quit 2>/dev/null)" ]]; then
      continue
    fi

    log "Migrating existing public uploads: $candidate -> $SHARED_PUBLIC_UPLOADS_DIR"
    # -a without -L/--copy-links: symlinks *found inside* the source are
    # preserved as symlinks, never dereferenced or copied through.
    # --ignore-existing: never overwrites a file already present at the
    # shared destination. No --delete: migration only ever adds files
    # here, it never removes anything already in the shared directory.
    rsync -a --ignore-existing "$candidate"/ "$SHARED_PUBLIC_UPLOADS_DIR"/
  done
}

# Fails the deployment if the shared public-uploads directory contains
# the exact self-referential entries seen in the production incident, or
# any symlink that loops back into itself/$RELEASES_DIR/$CURRENT_LINK.
# Never modifies anything — detection only, so a real corruption is
# always left in place for a human to inspect rather than being deleted
# automatically.
assert_no_public_uploads_loop() {
  [[ -d "$SHARED_PUBLIC_UPLOADS_DIR" ]] || return 0

  local bad
  for bad in "public-uploads" "uploads"; do
    if [[ -e "$SHARED_PUBLIC_UPLOADS_DIR/$bad" || -L "$SHARED_PUBLIC_UPLOADS_DIR/$bad" ]]; then
      fail "Loop guard tripped: '$SHARED_PUBLIC_UPLOADS_DIR/$bad' exists. This is the exact self-referential corruption that previously broke production (public-uploads/public-uploads/...). Refusing to deploy — inspect and remove it manually (after confirming no real files were lost inside it), then re-run."
    fi
  done

  local releases_real current_real shared_real
  releases_real="$(readlink -f "$RELEASES_DIR" 2>/dev/null || echo "$RELEASES_DIR")"
  current_real="$(readlink -f "$CURRENT_LINK" 2>/dev/null || echo "$CURRENT_LINK")"
  shared_real="$(readlink -f "$SHARED_PUBLIC_UPLOADS_DIR")"

  local link target
  while IFS= read -r -d '' link; do
    target="$(readlink -f "$link" 2>/dev/null || true)"
    [[ -n "$target" ]] || continue
    if [[ "$target" == "$shared_real" || "$target" == "$releases_real"/* || "$target" == "$releases_real" || "$target" == "$current_real" ]]; then
      fail "Loop guard tripped: symlink '$link' inside $SHARED_PUBLIC_UPLOADS_DIR resolves to '$target', which loops back into shared/releases/current. Refusing to deploy — remove '$link' manually, then re-run."
    fi
  done < <(find "$SHARED_PUBLIC_UPLOADS_DIR" -type l -print0 2>/dev/null)
}

# assert_release_uploads_symlink <release>
#
# Fails unless <release>/public/uploads resolves exactly to
# $SHARED_PUBLIC_UPLOADS_DIR. Called right before a release is activated
# (before the `current` symlink is flipped) so a broken persistence
# layout is caught before it ever reaches production traffic.
assert_release_uploads_symlink() {
  local release="$1"
  local resolved expected
  resolved="$(readlink -f "$release/public/uploads" 2>/dev/null || true)"
  expected="$(readlink -f "$SHARED_PUBLIC_UPLOADS_DIR")"
  if [[ "$resolved" != "$expected" ]]; then
    fail "Loop guard tripped: $release/public/uploads resolves to '${resolved:-<missing>}', expected '$expected'. Refusing to activate this release."
  fi
}

# ensure_release_uploads_symlink <release>
#
# For rollback only: creates the release-local symlink ONLY if it's
# missing entirely. Never touches anything inside the shared directory,
# and never overwrites an existing-but-wrong entry (that fails loudly via
# assert_release_uploads_symlink below instead, since silently replacing
# it could paper over a real problem).
ensure_release_uploads_symlink() {
  local release="$1"
  if [[ ! -e "$release/public/uploads" && ! -L "$release/public/uploads" ]]; then
    log "Recreating missing public/uploads symlink for $release"
    mkdir -p "$release/public"
    ln -sfn "$SHARED_PUBLIC_UPLOADS_DIR" "$release/public/uploads"
  fi
  assert_release_uploads_symlink "$release"
}
