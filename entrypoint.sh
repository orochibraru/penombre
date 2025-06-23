#!/usr/bin/env bash
set -euo pipefail

bun /app/scripts/db/migrate.ts

exec "$@"
