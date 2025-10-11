#!/bin/bash
# Generate test results comment from template
# Usage: ./generate-test-results-comment.sh <overall_status> <e2e_status> [pr_url]

set -e

OVERALL_STATUS="$1"
E2E_STATUS="$2"
PR_URL="$3"

if [ -z "$OVERALL_STATUS" ] || [ -z "$E2E_STATUS" ]; then
    echo "Error: Missing required parameters"
    echo "Usage: $0 <overall_status> <e2e_status> [pr_url]"
    exit 1
fi

# Format E2E status
case "$E2E_STATUS" in
    "success") FORMATTED_E2E_STATUS="✅ Passed" ;;
    "failure") FORMATTED_E2E_STATUS="❌ Failed" ;;
    "skipped") FORMATTED_E2E_STATUS="⏭️ Skipped" ;;
    "cancelled") FORMATTED_E2E_STATUS="🚫 Cancelled" ;;
    *) FORMATTED_E2E_STATUS="❓ Unknown" ;;
esac

# Read the template
TEMPLATE_FILE="$(dirname "$0")/test-results-template.md"

if [ ! -f "$TEMPLATE_FILE" ]; then
    echo "Error: Template file not found at $TEMPLATE_FILE"
    exit 1
fi

TEMPLATE_CONTENT=$(cat "$TEMPLATE_FILE")

# Replace basic variables
TEMPLATE_CONTENT=${TEMPLATE_CONTENT//\{\{OVERALL_STATUS\}\}/$OVERALL_STATUS}
TEMPLATE_CONTENT=${TEMPLATE_CONTENT//\{\{E2E_STATUS\}\}/$FORMATTED_E2E_STATUS}

# Handle PR URL conditional section
if [ -n "$PR_URL" ] && [ "$PR_URL" != "" ]; then
    # Show PR URL section
    TEMPLATE_CONTENT=${TEMPLATE_CONTENT//\{\{#PR_URL\}\}/}
    TEMPLATE_CONTENT=${TEMPLATE_CONTENT//\{\{\/PR_URL\}\}/}
    TEMPLATE_CONTENT=${TEMPLATE_CONTENT//\{\{PR_URL\}\}/$PR_URL}
else
    # Remove PR URL section
    TEMPLATE_CONTENT=$(echo "$TEMPLATE_CONTENT" | sed '/{{#PR_URL}}/,/{{\/PR_URL}}/d')
fi

# Output the processed template
echo "$TEMPLATE_CONTENT"
