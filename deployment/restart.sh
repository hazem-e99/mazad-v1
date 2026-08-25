#!/usr/bin/env bash
# Restarts the application service and confirms it comes back healthy.
set -Eeuo pipefail
DEPLOY_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$DEPLOY_DIR/config.sh"
source "$DEPLOY_DIR/lib/common.sh"

require_root

log "Restarting $SERVICE_NAME..."
systemctl restart "$SERVICE_NAME"
sleep 3

if systemctl is-active --quiet "$SERVICE_NAME" && wait_for_http_ok "http://127.0.0.1:${APP_PORT}/api/health" 15 2; then
  ok "$SERVICE_NAME restarted and healthy."
  curl -fsS "http://127.0.0.1:${APP_PORT}/api/health" || true
  echo
else
  journalctl -u "$SERVICE_NAME" -n 50 --no-pager || true
  fail "$SERVICE_NAME did not come back healthy — see logs above."
fi
