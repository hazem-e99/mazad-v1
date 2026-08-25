#!/usr/bin/env bash
# Provisions Let's Encrypt certificates for lwh7.com + www.lwh7.com and
# switches Nginx to the full HTTPS config (HTTP -> HTTPS redirect,
# www -> non-www redirect, security headers, websocket support).
#
# Safe to run standalone once DNS has propagated, or automatically from
# deploy.sh if DNS already pointed here during the initial deploy.
#
# Usage: sudo deployment/setup-ssl.sh [email]
set -Eeuo pipefail
DEPLOY_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$DEPLOY_DIR/config.sh"
source "$DEPLOY_DIR/lib/common.sh"

require_root

EMAIL="${1:-$CERTBOT_EMAIL}"

log "Checking DNS: $DOMAIN and $WWW_DOMAIN must resolve to $SERVER_IP"
if ! dns_points_to "$DOMAIN" "$SERVER_IP"; then
  fail "$DOMAIN does not resolve to $SERVER_IP yet. Set an A record ($DOMAIN -> $SERVER_IP) and wait for propagation, then re-run."
fi
if ! dns_points_to "$WWW_DOMAIN" "$SERVER_IP"; then
  warn "$WWW_DOMAIN does not resolve to $SERVER_IP yet. Continuing with $DOMAIN only; re-run once www DNS is ready to add it to the certificate."
  WWW_ARG=()
else
  WWW_ARG=(-d "$WWW_DOMAIN")
fi

[[ -f "/etc/nginx/sites-available/$APP_NAME" ]] || fail "Nginx site '$APP_NAME' not found — run deploy-production.sh first."

mkdir -p /var/www/certbot
log "Requesting certificate via HTTP-01 (webroot)..."
certbot certonly --webroot -w /var/www/certbot \
  -d "$DOMAIN" "${WWW_ARG[@]}" \
  --email "$EMAIL" --agree-tos --no-eff-email --non-interactive --keep-until-expiring

[[ -d "/etc/letsencrypt/live/$DOMAIN" ]] || fail "Certificate issuance did not produce /etc/letsencrypt/live/$DOMAIN"
ok "Certificate obtained for $DOMAIN."

log "Switching Nginx to the HTTPS config..."
sed \
  -e "s#__DOMAIN__#$DOMAIN#g" \
  -e "s#__WWW_DOMAIN__#$WWW_DOMAIN#g" \
  -e "s#__APP_PORT__#$APP_PORT#g" \
  "$DEPLOY_DIR/nginx/lwh7-ssl.conf.template" > "/etc/nginx/sites-available/$APP_NAME"

if nginx -t; then
  systemctl reload nginx
  ok "Nginx reloaded with HTTPS enabled."
else
  fail "nginx -t failed on the new HTTPS config — reverted nothing on disk. Inspect /etc/nginx/sites-available/$APP_NAME."
fi

log "Installing Nginx reload hook for certificate renewal..."
mkdir -p /etc/letsencrypt/renewal-hooks/deploy
cat > /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh <<'EOF'
#!/usr/bin/env bash
systemctl reload nginx
EOF
chmod +x /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh

if systemctl is-enabled --quiet certbot.timer 2>/dev/null; then
  ok "certbot.timer already enabled for automatic renewal."
else
  systemctl enable --now certbot.timer || warn "Could not enable certbot.timer — verify automatic renewal manually (certbot renew --dry-run)."
fi

log "Dry-running renewal to confirm the setup..."
certbot renew --dry-run || warn "Renewal dry-run failed — investigate before relying on auto-renewal."

echo
ok "HTTPS is live: https://$DOMAIN/"
echo "  Verify: curl -I https://$DOMAIN/"
echo "  Verify redirect: curl -I http://$DOMAIN/ ; curl -I https://$WWW_DOMAIN/"
