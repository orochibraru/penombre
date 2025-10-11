#!/bin/bash
# Perform health check with debugging capabilities
# Usage: ./health-check.sh <url> [sleep_seconds]

set -e

URL="$1"
SLEEP_TIME="${2:-30}"

if [ -z "$URL" ]; then
    echo "Error: URL is required"
    echo "Usage: $0 <url> [sleep_seconds]"
    exit 1
fi

echo "🏥 Performing health check for: $URL"
echo "Waiting $SLEEP_TIME seconds for services to stabilize..."
sleep "$SLEEP_TIME"

# Try health check (may fail initially due to cert provisioning)
if curl -f --max-time 30 --insecure "$URL/api/v1/healthz"; then
    echo "✅ Health check passed!"
    echo "HEALTH_STATUS=✅ Healthy" >> "$GITHUB_ENV"
    exit 0
else
    echo "⚠️ Health check failed (may be due to certificate provisioning)"
    echo "HEALTH_STATUS=⚠️ Deploying (certificates may be provisioning)" >> "$GITHUB_ENV"
    exit 1
fi
