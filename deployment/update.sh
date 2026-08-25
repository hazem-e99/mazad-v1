#!/usr/bin/env bash
# Redeploy the application: pull the latest commit on the production
# branch, build a new release, and swap it in — restarting the service
# only after a successful build, and rolling back automatically if the
# new release fails its health check.
#
# Usage: cd /path/to/mazad-v1 && sudo ./deployment/update.sh
set -Eeuo pipefail

DEPLOY_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd "$DEPLOY_DIR/.." && pwd)"
source "$DEPLOY_DIR/config.sh"
source "$DEPLOY_DIR/lib/common.sh"
source "$DEPLOY_DIR/lib/release.sh"

require_root

[[ -d "$CURRENT_LINK" || -L "$CURRENT_LINK" ]] || fail "No existing deployment found at $CURRENT_LINK. Run deploy-production.sh first."
[[ -f "$SHARED_ENV_FILE" ]] || fail "Production env file missing at $SHARED_ENV_FILE."

PREVIOUS_RELEASE="$(readlink -f "$CURRENT_LINK")"
log "Current release: $PREVIOUS_RELEASE"

if [[ -d "$REPO_DIR/.git" ]]; then
  if [[ -n "$(cd "$REPO_DIR" && git status --porcelain)" ]]; then
    fail "Uncommitted changes in $REPO_DIR — commit, stash, or discard them before updating (this checkout must mirror git cleanly for a safe deploy)."
  fi
  log "Pulling latest '$DEPLOY_BRANCH' from origin..."
  (cd "$REPO_DIR" && git fetch origin "$DEPLOY_BRANCH")
  (cd "$REPO_DIR" && git checkout "$DEPLOY_BRANCH")
  (cd "$REPO_DIR" && git merge --ff-only "origin/$DEPLOY_BRANCH")
  ok "Repository updated to $(cd "$REPO_DIR" && git rev-parse --short HEAD)"
else
  warn "$REPO_DIR is not a git checkout — deploying its current on-disk contents as-is (no pull performed)."
fi

build_release "$REPO_DIR"

log "Restarting $SERVICE_NAME..."
systemctl restart "$SERVICE_NAME"

sleep 3
if ! systemctl is-active --quiet "$SERVICE_NAME" || ! wait_for_http_ok "http://127.0.0.1:${APP_PORT}/api/health" 20 2; then
  warn "New release failed health check — rolling back to $PREVIOUS_RELEASE"
  journalctl -u "$SERVICE_NAME" -n 50 --no-pager || true
  ln -sfn "$PREVIOUS_RELEASE" "$CURRENT_LINK"
  systemctl restart "$SERVICE_NAME"
  sleep 3
  if wait_for_http_ok "http://127.0.0.1:${APP_PORT}/api/health" 10 2; then
    fail "Rolled back to previous release successfully. New release ($NEW_RELEASE) was NOT activated — inspect it and retry."
  else
    fail "Rollback also failed to pass health check. Manual intervention required: systemctl status $SERVICE_NAME; journalctl -u $SERVICE_NAME -n 100"
  fi
fi

ok "Update complete. Live release: $(readlink -f "$CURRENT_LINK")"
echo "  Health: $(curl -fsS "http://127.0.0.1:${APP_PORT}/api/health" || true)"
