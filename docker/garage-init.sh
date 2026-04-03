#!/usr/bin/env bash
set -euo pipefail

# Initialize garage bucket

if [ "$STORAGE_BACKEND" = "s3" ]; then
  echo "Initializing garage bucket..."
  aws --endpoint-url="$S3_ENDPOINT" s3api create-bucket --bucket "$S3_BUCKET" --region "$S3_REGION"
fi
