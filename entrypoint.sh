#!/usr/bin/env bash
set -euo pipefail

node /app/migrate.js

exec "$@"
