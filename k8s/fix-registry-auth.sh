#!/bin/bash

# Manual registry secret creation with better error handling
echo "🔐 Creating Docker Registry Secret for git.ombrage.space"
echo ""

# Prompt for credentials
echo "Please enter your git.ombrage.space credentials:"
read -p "Username: " USERNAME
read -s -p "Password/Token: " PASSWORD
echo ""

# Test the credentials first
echo "🧪 Testing credentials..."
if docker login git.ombrage.space -u "$USERNAME" -p "$PASSWORD" >/dev/null 2>&1; then
    echo "✅ Credentials verified successfully"
    docker logout git.ombrage.space >/dev/null 2>&1
else
    echo "❌ Failed to authenticate with git.ombrage.space"
    echo "Please check your username and password/token"
    exit 1
fi

# Remove existing secret if it exists
kubectl delete secret registry-secret -n opendrive --ignore-not-found=true

# Create the secret
echo "📝 Creating registry secret..."
kubectl create secret docker-registry registry-secret \
    --docker-server=git.ombrage.space \
    --docker-username="$USERNAME" \
    --docker-password="$PASSWORD" \
    --namespace=opendrive

if [ $? -eq 0 ]; then
    echo "✅ Registry secret created successfully"
    
    # Restart deployments to pick up the new secret
    echo "🔄 Restarting deployments to use new credentials..."
    kubectl -n opendrive rollout restart deployment/opendrive-app
    kubectl -n opendrive rollout restart statefulset/storage
    
    echo "⏳ Waiting for pods to restart..."
    sleep 10
    
    echo "📊 Pod status:"
    kubectl -n opendrive get pods
else
    echo "❌ Failed to create registry secret"
    exit 1
fi
