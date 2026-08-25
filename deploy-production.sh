#!/usr/bin/env bash
# One-command production deployment entrypoint.
#
#   chmod +x deploy-production.sh
#   sudo ./deploy-production.sh
#
# See deployment/README.md for the full deployment guide.
set -Eeuo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")"
exec ./deployment/deploy.sh "$@"
