#!/usr/bin/env bash
set -euo pipefail

pnpm exec changelogen --bump

pnpm run format
