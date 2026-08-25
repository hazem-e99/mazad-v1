#!/usr/bin/env bash
# Master deployment script for Mazad (lwh7.com) on Ubuntu 24.04.
#
# Run once from inside a git checkout of this repository, as root:
#   cd /path/to/mazad-v1
#   sudo ./deploy-production.sh
# (deploy-production.sh at the repo root just execs this file.)
#
# Idempotent: safe to re-run. Provisions the server (packages, Node 22,
# Nginx, Certbot, UFW, swap), builds the first release, installs the
# systemd service, and (if DNS already points here) provisions SSL.
set -Eeuo pipefail

DEPLOY_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd "$DEPLOY_DIR/.." && pwd)"
# shellcheck source=./config.sh
source "$DEPLOY_DIR/config.sh"
# shellcheck source=./lib/common.sh
source "$DEPLOY_DIR/lib/common.sh"

trap 'fail "Deployment aborted (line $LINENO). No running release was touched unless explicitly noted above."' ERR

require_root

log "Repository source: $REPO_DIR"
[[ -f "$REPO_DIR/package.json" ]] || fail "package.json not found at $REPO_DIR — run this from inside the repo checkout."

# ---------------------------------------------------------------------
# 1. OS check
# ---------------------------------------------------------------------
if [[ -f /etc/os-release ]]; then
  . /etc/os-release
  log "Detected OS: ${PRETTY_NAME:-unknown}"
  if [[ "${ID:-}" != "ubuntu" ]]; then
    warn "This script targets Ubuntu 24.04; detected ID=${ID:-unknown}. Continuing anyway."
  elif [[ "${VERSION_ID:-}" != "24.04" ]]; then
    warn "This script targets Ubuntu 24.04; detected ${VERSION_ID:-unknown}. Continuing anyway."
  fi
else
  warn "/etc/os-release not found; cannot verify OS version."
fi

# ---------------------------------------------------------------------
# 2. System packages
# ---------------------------------------------------------------------
log "Installing system packages (apt)..."
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y --no-install-recommends \
  curl ca-certificates gnupg git build-essential \
  nginx certbot python3-certbot-nginx \
  ufw rsync dnsutils jq
ok "System packages installed."

# ---------------------------------------------------------------------
# 3. Node.js 22 (NodeSource)
# ---------------------------------------------------------------------
CURRENT_NODE_MAJOR="$(node -v 2>/dev/null | sed -E 's/^v([0-9]+).*/\1/' || echo 0)"
if [[ "$CURRENT_NODE_MAJOR" != "$NODE_MAJOR" ]]; then
  log "Installing Node.js ${NODE_MAJOR}.x via NodeSource..."
  curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR}.x" | bash -
  apt-get install -y nodejs
else
  log "Node.js ${NODE_MAJOR}.x already installed ($(node -v))."
fi
node -v && npm -v
ok "Node.js ready: $(node -v)"

# Do NOT install MongoDB. This app uses MongoDB Atlas exclusively
# (the VPS lacks AVX, which MongoDB 5+ requires) — see AGENTS.md.

# ---------------------------------------------------------------------
# 4. Swap safety net for low-RAM VPS builds (next build can be memory
#    hungry). Only adds a swapfile if none exists and RAM is small.
# ---------------------------------------------------------------------
TOTAL_MEM_MB="$(awk '/MemTotal/ {print int($2/1024)}' /proc/meminfo)"
SWAP_ACTIVE_KB="$(awk '/SwapTotal/ {print $2}' /proc/meminfo)"
if [[ "$TOTAL_MEM_MB" -lt 2048 && "$SWAP_ACTIVE_KB" -eq 0 ]]; then
  log "Low RAM (${TOTAL_MEM_MB}MB) and no swap detected — creating a 2G swapfile..."
  fallocate -l 2G /swapfile || dd if=/dev/zero of=/swapfile bs=1M count=2048
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  if ! grep -q '^/swapfile ' /etc/fstab; then
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
  fi
  ok "Swapfile created and enabled."
else
  log "Memory ${TOTAL_MEM_MB}MB / swap ${SWAP_ACTIVE_KB}KB — no swapfile action needed."
fi

# ---------------------------------------------------------------------
# 5. Application user + directory layout
# ---------------------------------------------------------------------
if ! id "$APP_USER" >/dev/null 2>&1; then
  log "Creating system user '$APP_USER'..."
  useradd --system --create-home --home-dir "/home/$APP_USER" --shell /usr/sbin/nologin "$APP_USER"
else
  log "System user '$APP_USER' already exists."
fi

mkdir -p "$RELEASES_DIR" "$SHARED_ENV_DIR" "$SHARED_UPLOADS_DIR"
chown -R "$APP_USER:$APP_GROUP" "$APP_DIR"
chmod 750 "$SHARED_ENV_DIR"
ok "Directory layout ready under $APP_DIR"

# ---------------------------------------------------------------------
# 6. Environment file (preserve existing values; never fabricate secrets)
# ---------------------------------------------------------------------
if [[ ! -f "$SHARED_ENV_FILE" ]]; then
  if [[ -f "$REPO_DIR/.env" ]]; then
    log "No production .env yet — seeding from the repo's local .env (source of truth)."
    cp "$REPO_DIR/.env" "$SHARED_ENV_FILE"
  else
    log "No production .env yet — seeding from .env.example (fill in real values before continuing)."
    cp "$REPO_DIR/.env.example" "$SHARED_ENV_FILE"
  fi
  chown "$APP_USER:$APP_GROUP" "$SHARED_ENV_FILE"
  chmod 600 "$SHARED_ENV_FILE"
fi

# Only add/update deployment-driven values; never touch MONGODB_URI,
# AUTH_SECRET, or any other existing secret.
set_env_var() {
  local key="$1" value="$2"
  if grep -qE "^${key}=" "$SHARED_ENV_FILE"; then
    sed -i "s#^${key}=.*#${key}=${value}#" "$SHARED_ENV_FILE"
  else
    printf '%s=%s\n' "$key" "$value" >> "$SHARED_ENV_FILE"
  fi
}

set_env_var "NODE_ENV" "production"
set_env_var "HOST" "127.0.0.1"
set_env_var "PORT" "$APP_PORT"
# Moving from Render to lwh7.com: this is the one URL that must change.
set_env_var "NEXT_PUBLIC_SITE_URL" "https://${DOMAIN}"
chmod 600 "$SHARED_ENV_FILE"
chown "$APP_USER:$APP_GROUP" "$SHARED_ENV_FILE"

MONGODB_URI_VAL="$(env_get "$SHARED_ENV_FILE" MONGODB_URI)"
AUTH_SECRET_VAL="$(env_get "$SHARED_ENV_FILE" AUTH_SECRET)"
if [[ -z "$MONGODB_URI_VAL" || -z "$AUTH_SECRET_VAL" ]]; then
  fail "MONGODB_URI and/or AUTH_SECRET are empty in $SHARED_ENV_FILE. Edit that file with the real Atlas connection string and auth secret, then re-run this script. (Never fabricate these values.)"
fi
ok "Production environment file present at $SHARED_ENV_FILE (permissions 600)."

# ---------------------------------------------------------------------
# 7. Build a release from the current repo checkout
# ---------------------------------------------------------------------
source "$DEPLOY_DIR/lib/release.sh"
build_release "$REPO_DIR"
ok "Release $NEW_RELEASE built and activated at $CURRENT_LINK"

# ---------------------------------------------------------------------
# 8. systemd service
# ---------------------------------------------------------------------
log "Installing systemd service..."
sed \
  -e "s#__APP_DIR__#$APP_DIR#g" \
  -e "s#__CURRENT_LINK__#$CURRENT_LINK#g" \
  -e "s#__APP_USER__#$APP_USER#g" \
  -e "s#__APP_GROUP__#$APP_GROUP#g" \
  -e "s#__ENV_FILE__#$SHARED_ENV_FILE#g" \
  "$DEPLOY_DIR/systemd/lwh7-app.service.template" > "/etc/systemd/system/$SERVICE_NAME"

systemctl daemon-reload
systemctl enable "$SERVICE_NAME"
systemctl restart "$SERVICE_NAME"
ok "systemd service '$SERVICE_NAME' enabled and started."

sleep 3
if ! systemctl is-active --quiet "$SERVICE_NAME"; then
  journalctl -u "$SERVICE_NAME" -n 50 --no-pager || true
  fail "$SERVICE_NAME failed to start — see logs above."
fi

if ! wait_for_http_ok "http://127.0.0.1:${APP_PORT}/api/health" 20 2; then
  journalctl -u "$SERVICE_NAME" -n 50 --no-pager || true
  fail "Application did not respond on 127.0.0.1:${APP_PORT}/api/health after startup."
fi
ok "Application is healthy on 127.0.0.1:${APP_PORT}"

# ---------------------------------------------------------------------
# 9. Nginx (HTTP first — SSL is provisioned separately once DNS is ready)
# ---------------------------------------------------------------------
log "Configuring Nginx (HTTP)..."
mkdir -p /var/www/certbot
sed \
  -e "s#__DOMAIN__#$DOMAIN#g" \
  -e "s#__WWW_DOMAIN__#$WWW_DOMAIN#g" \
  -e "s#__APP_PORT__#$APP_PORT#g" \
  "$DEPLOY_DIR/nginx/lwh7-http.conf.template" > "/etc/nginx/sites-available/$APP_NAME"
ln -sf "/etc/nginx/sites-available/$APP_NAME" "/etc/nginx/sites-enabled/$APP_NAME"
rm -f /etc/nginx/sites-enabled/default

if nginx -t; then
  systemctl reload nginx
  systemctl enable nginx >/dev/null 2>&1 || true
  ok "Nginx configured and reloaded (HTTP)."
else
  fail "nginx -t failed — not reloading Nginx. Fix /etc/nginx/sites-available/$APP_NAME and re-run."
fi

# ---------------------------------------------------------------------
# 10. Firewall
# ---------------------------------------------------------------------
log "Configuring UFW..."
ufw allow OpenSSH >/dev/null
ufw allow 'Nginx Full' >/dev/null
ufw --force enable >/dev/null
ok "UFW enabled (OpenSSH, HTTP, HTTPS allowed; app/DB ports stay internal)."
ufw status verbose || true

# ---------------------------------------------------------------------
# 11. DNS check + SSL
# ---------------------------------------------------------------------
log "Checking DNS for $DOMAIN and $WWW_DOMAIN -> $SERVER_IP ..."
if dns_points_to "$DOMAIN" "$SERVER_IP" && dns_points_to "$WWW_DOMAIN" "$SERVER_IP"; then
  ok "DNS already points to this server — provisioning SSL now."
  "$DEPLOY_DIR/setup-ssl.sh" || warn "SSL provisioning failed — the app is still reachable over HTTP. Re-run: sudo deployment/setup-ssl.sh"
else
  warn "DNS for $DOMAIN / $WWW_DOMAIN does not yet point to $SERVER_IP."
  warn "The application is deployed and reachable over HTTP at http://$SERVER_IP/ and http://$DOMAIN/ once DNS propagates."
  warn "Once DNS is updated, run:  sudo deployment/setup-ssl.sh"
fi

echo
ok "Deployment complete."
echo "  App dir:      $APP_DIR (current -> $(readlink -f "$CURRENT_LINK" 2>/dev/null || echo '?'))"
echo "  Service:      systemctl status $SERVICE_NAME"
echo "  Local health: curl -s http://127.0.0.1:${APP_PORT}/api/health"
echo "  Public HTTP:  http://$DOMAIN/"
echo "  Helpers:      deployment/status.sh · deployment/logs.sh · deployment/restart.sh · deployment/update.sh"
