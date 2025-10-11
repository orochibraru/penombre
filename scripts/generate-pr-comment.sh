#!/bin/bash
# Generate PR comment from template
# Usage: ./generate-pr-comment.sh <url> <namespace> <health_status> <pods> <pr_tag> [failed_deployments]

set -e

URL="$1"
NAMESPACE="$2"
HEALTH_STATUS="$3"
PODS="$4"
PR_TAG="$5"
FAILED_DEPLOYMENTS="$6"

if [ -z "$URL" ] || [ -z "$NAMESPACE" ] || [ -z "$HEALTH_STATUS" ] || [ -z "$PODS" ] || [ -z "$PR_TAG" ]; then
    echo "Error: Missing required parameters"
    echo "Usage: $0 <url> <namespace> <health_status> <pods> <pr_tag> [failed_deployments]"
    exit 1
fi

# Read the template
TEMPLATE_FILE="$(dirname "$0")/pr-comment-template.md"

if [ ! -f "$TEMPLATE_FILE" ]; then
    echo "Error: Template file not found at $TEMPLATE_FILE"
    exit 1
fi

TEMPLATE_CONTENT=$(cat "$TEMPLATE_FILE")

# Replace basic variables
TEMPLATE_CONTENT=${TEMPLATE_CONTENT//\{\{URL\}\}/$URL}
TEMPLATE_CONTENT=${TEMPLATE_CONTENT//\{\{NAMESPACE\}\}/$NAMESPACE}
TEMPLATE_CONTENT=${TEMPLATE_CONTENT//\{\{HEALTH_STATUS\}\}/$HEALTH_STATUS}
TEMPLATE_CONTENT=${TEMPLATE_CONTENT//\{\{PODS\}\}/$PODS}
TEMPLATE_CONTENT=${TEMPLATE_CONTENT//\{\{PR_TAG\}\}/$PR_TAG}

# Handle conditional sections
if [ -n "$FAILED_DEPLOYMENTS" ] && [ "$FAILED_DEPLOYMENTS" != "" ]; then
    # Show failed deployments section
    TEMPLATE_CONTENT=${TEMPLATE_CONTENT//\{\{#FAILED_DEPLOYMENTS\}\}/}
    TEMPLATE_CONTENT=${TEMPLATE_CONTENT//\{\{\/FAILED_DEPLOYMENTS\}\}/}
    TEMPLATE_CONTENT=${TEMPLATE_CONTENT//\{\{FAILED_DEPLOYMENTS\}\}/$FAILED_DEPLOYMENTS}
else
    # Remove failed deployments section
    TEMPLATE_CONTENT=$(echo "$TEMPLATE_CONTENT" | sed '/{{#FAILED_DEPLOYMENTS}}/,/{{\/FAILED_DEPLOYMENTS}}/d')
fi

# Handle health issues section
if [[ "$HEALTH_STATUS" == *"⚠️"* ]] && [[ -z "$FAILED_DEPLOYMENTS" || "$FAILED_DEPLOYMENTS" == "" ]]; then
    # Show health issues section
    TEMPLATE_CONTENT=${TEMPLATE_CONTENT//\{\{#HEALTH_ISSUES\}\}/}
    TEMPLATE_CONTENT=${TEMPLATE_CONTENT//\{\{\/HEALTH_ISSUES\}\}/}
else
    # Remove health issues section
    TEMPLATE_CONTENT=$(echo "$TEMPLATE_CONTENT" | sed '/{{#HEALTH_ISSUES}}/,/{{\/HEALTH_ISSUES}}/d')
fi

# Output the processed template
echo "$TEMPLATE_CONTENT"
