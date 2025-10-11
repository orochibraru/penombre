#!/bin/bash
# Simple template processor for cleanup comments
# Usage: ./process-template.sh <template_file> <namespace>

set -e

TEMPLATE_FILE="$1"
NAMESPACE="$2"

if [ -z "$TEMPLATE_FILE" ] || [ -z "$NAMESPACE" ]; then
    echo "Error: Missing required parameters"
    echo "Usage: $0 <template_file> <namespace>"
    exit 1
fi

if [ ! -f "$TEMPLATE_FILE" ]; then
    echo "Error: Template file not found at $TEMPLATE_FILE"
    exit 1
fi

# Read and process template
TEMPLATE_CONTENT=$(cat "$TEMPLATE_FILE")
TEMPLATE_CONTENT=${TEMPLATE_CONTENT//\{\{NAMESPACE\}\}/$NAMESPACE}

echo "$TEMPLATE_CONTENT"
