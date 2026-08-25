#!/usr/bin/env bash
# Convenience wrapper around journalctl for the app service, and Nginx logs.
#
# Usage:
#   deployment/logs.sh              # follow app logs (like tail -f)
#   deployment/logs.sh app          # same as above
#   deployment/logs.sh app 200      # last 200 lines, no follow
#   deployment/logs.sh nginx        # follow Nginx error log
#   deployment/logs.sh nginx-access # follow Nginx access log
set -Eeuo pipefail
DEPLOY_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$DEPLOY_DIR/config.sh"

TARGET="${1:-app}"
LINES="${2:-}"

case "$TARGET" in
  app)
    if [[ -n "$LINES" ]]; then
      journalctl -u "$SERVICE_NAME" -n "$LINES" --no-pager
    else
      journalctl -u "$SERVICE_NAME" -f -n 100
    fi
    ;;
  nginx)
    tail -n "${LINES:-100}" -f /var/log/nginx/error.log
    ;;
  nginx-access)
    tail -n "${LINES:-100}" -f /var/log/nginx/access.log
    ;;
  *)
    echo "Usage: $0 [app|nginx|nginx-access] [lines]" >&2
    exit 1
    ;;
esac
