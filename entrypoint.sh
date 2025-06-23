#!/usr/bin/env bash
set -euo pipefail

tsx /app/scripts/db/migrate.ts

exec "$@"
