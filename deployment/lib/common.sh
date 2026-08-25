#!/usr/bin/env bash
# Shared helpers for deployment/*.sh. Source this after config.sh:
#   source "$(dirname "${BASH_SOURCE[0]}")/config.sh"
#   source "$(dirname "${BASH_SOURCE[0]}")/lib/common.sh"

C_RESET="\033[0m"; C_RED="\033[31m"; C_GREEN="\033[32m"; C_YELLOW="\033[33m"; C_BLUE="\033[34m"

log()   { printf "${C_BLUE}[%s]${C_RESET} %s\n" "$(date +'%H:%M:%S')" "$*"; }
ok()    { printf "${C_GREEN}[ok]${C_RESET} %s\n" "$*"; }
warn()  { printf "${C_YELLOW}[warn]${C_RESET} %s\n" "$*" >&2; }
fail()  { printf "${C_RED}[error]${C_RESET} %s\n" "$*" >&2; exit 1; }

require_root() {
  if [[ "${EUID:-$(id -u)}" -ne 0 ]]; then
    fail "This script must be run as root (use: sudo $0)."
  fi
}

# Resolves the directory containing the currently-executing script's
# deployment/ folder, regardless of the caller's cwd or symlinks.
script_root() {
  local src="${BASH_SOURCE[1]:-$0}"
  local dir
  dir="$(cd "$(dirname "$src")" && pwd)"
  echo "$dir"
}

command_exists() { command -v "$1" >/dev/null 2>&1; }

# Reads a KEY from a .env-style file without exporting/leaking it to the
# process environment or to stdout logs. Returns empty string if absent.
env_get() {
  local file="$1" key="$2"
  [[ -f "$file" ]] || { echo ""; return; }
  grep -E "^${key}=" "$file" | tail -n1 | cut -d'=' -f2- | sed -e 's/^"//' -e 's/"$//'
}

# True if $1 resolves (A record) to $2.
dns_points_to() {
  local host="$1" expected_ip="$2" resolved
  resolved="$(getent hosts "$host" 2>/dev/null | awk '{print $1}' | head -n1)"
  if [[ -z "$resolved" ]] && command_exists dig; then
    resolved="$(dig +short A "$host" | tail -n1)"
  fi
  [[ -n "$resolved" && "$resolved" == "$expected_ip" ]]
}

wait_for_http_ok() {
  local url="$1" tries="${2:-15}" delay="${3:-2}" i
  for ((i = 1; i <= tries; i++)); do
    if curl -fsS -m 5 -o /dev/null "$url"; then
      return 0
    fi
    sleep "$delay"
  done
  return 1
}
