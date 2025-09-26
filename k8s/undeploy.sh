#!/bin/bash

# OpenDrive Kubernetes Undeployment Script
# This script removes OpenDrive from your Kubernetes cluster

set -e

echo "🗑️  Undeploying OpenDrive from Kubernetes..."

# Check if kubectl is available
if ! command -v kubectl &> /dev/null; then
    echo "❌ kubectl could not be found. Please install kubectl first."
    exit 1
fi

# Check if we can connect to the cluster
if ! kubectl cluster-info &> /dev/null; then
    echo "❌ Cannot connect to Kubernetes cluster. Please check your kubeconfig."
    exit 1
fi

echo "✅ Connected to Kubernetes cluster"

# Check if namespace exists
if ! kubectl get namespace opendrive &> /dev/null; then
    echo "ℹ️  OpenDrive namespace not found - nothing to undeploy"
    exit 0
fi

# Confirm deletion
echo "⚠️  This will remove all OpenDrive resources including:"
echo "   - Application deployments"
echo "   - Database and storage (including data!)"
echo "   - Configuration and secrets"
echo "   - Persistent volumes and data"
echo ""
read -p "Are you sure you want to continue? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Undeployment cancelled"
    exit 1
fi

echo "🔄 Removing OpenDrive resources..."

# Remove ingress first to stop external traffic
echo "🌐 Removing Ingress..."
kubectl delete -f k8s/ingress.yaml --ignore-not-found=true

# Remove application deployment
echo "🚀 Removing Application..."
kubectl delete -f k8s/app.yaml --ignore-not-found=true

# Remove storage and database (order matters for graceful shutdown)
echo "💾 Removing Storage..."
kubectl delete -f k8s/storage.yaml --ignore-not-found=true

echo "🗄️ Removing Database..."
kubectl delete -f k8s/postgres.yaml --ignore-not-found=true

# Remove configuration and secrets
echo "🔧 Removing ConfigMaps and Secrets..."
kubectl delete -f k8s/config.yaml --ignore-not-found=true

# Remove registry secret if it exists
echo "🔐 Removing Registry Secret..."
kubectl -n opendrive delete secret registry-secret --ignore-not-found=true

# Option to keep or remove persistent volumes
echo ""
echo "📦 Persistent Volume Claims (your data):"
kubectl -n opendrive get pvc 2>/dev/null || echo "   No PVCs found"

echo ""
read -p "Do you want to delete persistent volumes (THIS WILL DELETE ALL DATA)? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "💥 Deleting persistent volumes and data..."
    kubectl -n opendrive delete pvc --all
    echo "⚠️  All data has been permanently deleted!"
else
    echo "💾 Persistent volumes preserved - data is safe"
fi

# Remove namespace
echo "📋 Removing namespace..."
kubectl delete namespace opendrive --ignore-not-found=true

echo ""
echo "✅ OpenDrive successfully undeployed!"
echo ""
echo "🔍 Remaining resources (should be empty):"
kubectl get all -n opendrive 2>/dev/null || echo "   Namespace not found (expected)"

echo ""
echo "📝 To redeploy OpenDrive, run: ./deploy.sh"
