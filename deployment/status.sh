#!/usr/bin/env bash
# Prints a full health snapshot: systemd service, Nginx, local app port,
# public domain (if DNS is ready), HTTPS (if a cert exists), and Mongo
# Atlas connectivity via the app's own /api/health endpoint.
set -Eeuo pipefail
DEPLOY_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$DEPLOY_DIR/config.sh"
source "$DEPLOY_DIR/lib/common.sh"

section() { printf "\n\033[1m== %s ==\033[0m\n" "$1"; }

section "Service ($SERVICE_NAME)"
systemctl --no-pager status "$SERVICE_NAME" 2>/dev/null | head -n 10 || echo "not installed"

section "Release"
if [[ -L "$CURRENT_LINK" ]]; then
  echo "current -> $(readlink -f "$CURRENT_LINK")"
else
  echo "no active release ($CURRENT_LINK missing)"
fi

section "Nginx"
systemctl --no-pager status nginx 2>/dev/null | head -n 5 || echo "not installed"
nginx -t 2>&1 || true

section "Local app (127.0.0.1:$APP_PORT)"
if curl -fsS -m 5 "http://127.0.0.1:${APP_PORT}/api/health"; then
  echo
else
  echo "UNREACHABLE"
fi

section "Public HTTP ($DOMAIN)"
if dns_points_to "$DOMAIN" "$SERVER_IP"; then
  code="$(curl -s -o /dev/null -w '%{http_code}' -m 8 "http://$DOMAIN/api/health" || echo '000')"
  echo "DNS OK -> HTTP status: $code"
else
  echo "DNS does not yet point $DOMAIN -> $SERVER_IP (run this again once it does)"
fi

section "HTTPS"
if [[ -d "/etc/letsencrypt/live/$DOMAIN" ]]; then
  echo "Certificate present:"
  certbot certificates -d "$DOMAIN" 2>/dev/null | grep -E "Certificate Name|Expiry Date" || true
  code="$(curl -s -o /dev/null -w '%{http_code}' -m 8 "https://$DOMAIN/api/health" || echo '000')"
  echo "HTTPS status: $code"
else
  echo "No certificate yet — run: sudo deployment/setup-ssl.sh"
fi

section "Certbot renewal timer"
systemctl is-enabled certbot.timer 2>/dev/null || echo "certbot.timer not enabled"
systemctl is-active certbot.timer 2>/dev/null || true

section "UFW"
ufw status | head -n 10 || true

section "MongoDB Atlas (via app health)"
curl -fsS -m 5 "http://127.0.0.1:${APP_PORT}/api/health" 2>/dev/null | jq -r '"database: " + .database' 2>/dev/null || echo "could not read database status"
