#!/usr/bin/env bash
set -euo pipefail

PORT=3000

cleanup() {
  echo ""
  echo "Shutting down..."
  lsof -ti tcp:"$PORT" | xargs kill -9 2>/dev/null || true
  echo "Port $PORT released."
}

trap cleanup INT TERM EXIT

export NVM_DIR="$HOME/.nvm"
# shellcheck source=/dev/null
. "$NVM_DIR/nvm.sh"
nvm use 20

npm run dev
