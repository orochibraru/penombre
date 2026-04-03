#!/bin/sh
set -e

if [ -z "$GARAGE_RPC_SECRET" ]; then
  echo "[garage] Error: GARAGE_RPC_SECRET is not set" >&2
  exit 1
fi
if [ -z "$S3_BUCKET" ] || [ -z "$S3_ACCESS_KEY_ID" ] || [ -z "$S3_SECRET_ACCESS_KEY" ]; then
  echo "[garage] Error: S3_BUCKET, S3_ACCESS_KEY_ID, and S3_SECRET_ACCESS_KEY must be set" >&2
  exit 1
fi

envsubst '$GARAGE_RPC_SECRET' < /etc/garage.toml.template > /etc/garage.toml

/garage server &
SERVER_PID=$!

# Wait until the node is reachable
echo "[garage] Waiting for server to start..."
ATTEMPTS=0
until /garage status >/dev/null 2>&1; do
  ATTEMPTS=$((ATTEMPTS + 1))
  if [ "$ATTEMPTS" -ge 30 ]; then
    echo "[garage] Timed out waiting for server" >&2
    exit 1
  fi
  sleep 1
done
echo "[garage] Server is up"

# Assign single-node layout (idempotent via version check)
if ! /garage layout show 2>/dev/null | grep -q 'dc1'; then
  NODE_ID=$(/garage node id | awk 'NR==1{print $1}')
  /garage layout assign -z dc1 -c 1G "$NODE_ID"
  /garage layout apply --version 1
  echo "[garage] Layout assigned"
else
  echo "[garage] Layout already configured"
fi

# Import key (idempotent)
/garage key import \
  --key-id "$S3_ACCESS_KEY_ID" \
  --secret-key "$S3_SECRET_ACCESS_KEY" \
  penombre-key 2>/dev/null && echo "[garage] Key imported" || echo "[garage] Key already exists"

# Create bucket (idempotent)
/garage bucket create "$S3_BUCKET" 2>/dev/null && echo "[garage] Bucket created" || echo "[garage] Bucket already exists"

# Grant key read/write/owner on bucket (idempotent)
/garage bucket allow --read --write --owner "$S3_BUCKET" --key "$S3_ACCESS_KEY_ID" 2>/dev/null || true
echo "[garage] Key allowed on bucket '$S3_BUCKET'"

wait $SERVER_PID
