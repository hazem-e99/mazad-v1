#!/usr/bin/env bash
# Central configuration for the Mazad (lwh7.com) deployment scripts.
# Sourced by every script in deployment/ — edit these values if the target
# domain, IP, or on-disk layout ever changes.

# --- Domain / network -------------------------------------------------
DOMAIN="lwh7.com"
WWW_DOMAIN="www.lwh7.com"
SERVER_IP="162.0.223.132"

# --- Application identity ----------------------------------------------
APP_NAME="lwh7"
APP_USER="lwh7"
APP_GROUP="lwh7"

# --- On-disk layout (release-based deploys) -----------------------------
APP_DIR="/opt/lwh7"
RELEASES_DIR="$APP_DIR/releases"
SHARED_DIR="$APP_DIR/shared"
SHARED_ENV_DIR="$SHARED_DIR/env"
SHARED_ENV_FILE="$SHARED_ENV_DIR/.env"
SHARED_UPLOADS_DIR="$SHARED_DIR/private-uploads"
CURRENT_LINK="$APP_DIR/current"
KEEP_RELEASES=5

# --- Runtime ------------------------------------------------------------
# Must match PORT in the shared .env (deploy.sh/update.sh keep them in
# sync); Nginx proxies to 127.0.0.1:$APP_PORT.
APP_PORT="3000"
NODE_MAJOR="22"

# --- systemd --------------------------------------------------------
SERVICE_NAME="lwh7-app.service"

# --- Git -------------------------------------------------------------
# Production branch. Override with DEPLOY_BRANCH=... env var if needed.
DEPLOY_BRANCH="${DEPLOY_BRANCH:-main}"

# --- SSL -------------------------------------------------------------
# Override with CERTBOT_EMAIL=... env var. Used only for Let's Encrypt
# expiry notifications — never printed alongside secrets.
CERTBOT_EMAIL="${CERTBOT_EMAIL:-admin@lwh7.com}"
