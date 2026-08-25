#!/usr/bin/env bash
# Manually roll back to the previous release (or a specific one).
#
# Usage:
#   sudo deployment/rollback.sh              # roll back to the release before current
#   sudo deployment/rollback.sh 20260825120000  # roll back to a specific release dir name
set -Eeuo pipefail
DEPLOY_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$DEPLOY_DIR/config.sh"
source "$DEPLOY_DIR/lib/common.sh"
source "$DEPLOY_DIR/lib/uploads.sh"

require_root

CURRENT="$(readlink -f "$CURRENT_LINK" 2>/dev/null || echo '')"
[[ -n "$CURRENT" ]] || fail "No current release found at $CURRENT_LINK."

if [[ -n "${1:-}" ]]; then
  TARGET="$RELEASES_DIR/$1"
else
  TARGET="$(find "$RELEASES_DIR" -maxdepth 1 -mindepth 1 -type d ! -path "$CURRENT" -printf '%T@ %p\n' \
    | sort -rn | head -n1 | awk '{print $2}')"
fi

[[ -n "$TARGET" && -d "$TARGET" ]] || fail "No target release found to roll back to. Available: $(ls "$RELEASES_DIR")"
[[ "$TARGET" != "$CURRENT" ]] || fail "Target release is already the current release."

# Public uploads are never copied or mutated by rollback — only the
# release-local symlink is checked and, if entirely missing, recreated;
# nothing inside $SHARED_PUBLIC_UPLOADS_DIR is ever touched here. Fails
# loudly (aborts before switching `current`) if the shared directory
# itself is corrupted or the target's symlink exists but points
# somewhere unexpected, rather than silently rolling back onto a broken
# persistence layout.
assert_no_public_uploads_loop
ensure_release_uploads_symlink "$TARGET"

log "Rolling back: $CURRENT -> $TARGET"
ln -sfn "$TARGET" "$CURRENT_LINK"
systemctl restart "$SERVICE_NAME"
sleep 3

if systemctl is-active --quiet "$SERVICE_NAME" && wait_for_http_ok "http://127.0.0.1:${APP_PORT}/api/health" 15 2; then
  ok "Rolled back successfully. Live release: $TARGET"
else
  journalctl -u "$SERVICE_NAME" -n 50 --no-pager || true
  fail "Rollback target failed its health check too — manual intervention required."
fi
