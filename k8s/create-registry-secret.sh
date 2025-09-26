#!/bin/bash

# Script to create registry secret for pulling images from git.ombrage.space
# This script helps you create the proper Docker registry secret

echo "🔐 Creating Docker Registry Secret for git.ombrage.space"
echo ""

# Check if kubectl is available
if ! command -v kubectl &> /dev/null; then
    echo "❌ kubectl could not be found. Please install kubectl first."
    exit 1
fi

# Prompt for credentials
echo "Please enter your registry credentials:"
read -p "Username: " USERNAME
read -s -p "Password/Token: " PASSWORD
echo ""

echo "🧪 Testing credentials..."
if docker login git.ombrage.space -u "$USERNAME" -p "$PASSWORD" >/dev/null 2>&1; then
    echo "✅ Credentials verified successfully"
    docker logout git.ombrage.space >/dev/null 2>&1
else
    echo "❌ Failed to authenticate with git.ombrage.space"
    echo "Please check your username and password/token"
    exit 1
fi

# Create the secret
echo "Creating registry secret..."
kubectl create secret docker-registry registry-secret \
    --docker-server=git.ombrage.space \
    --docker-username="$USERNAME" \
    --docker-password="$PASSWORD" \
    --namespace=opendrive \
    --dry-run=client -o yaml > registry-secret.yaml

echo "✅ Registry secret created and saved to registry-secret.yaml"
echo ""
echo "🔧 To apply the secret to your cluster, run:"
echo "   kubectl apply -f registry-secret.yaml"
echo ""
echo "🚀 Then redeploy your applications."
