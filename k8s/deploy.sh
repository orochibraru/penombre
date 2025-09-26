#!/bin/bash

# OpenDrive Kubernetes Deployment Script
# This script deploys OpenDrive to your K3s cluster

set -e

echo "🚀 Deploying OpenDrive to Kubernetes..."

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

# Apply manifests in order
echo "📋 Creating namespace..."
kubectl apply -f k8s/namespace.yaml

# Check if registry secret exists
if ! kubectl -n opendrive get secret registry-secret &> /dev/null; then
    if [ -f registry-secret.yaml ]; then
        echo "🔐 Applying existing registry-secret.yaml..."
        kubectl apply -f registry-secret.yaml
    else
        echo "⚠️  Registry secret not found!"
        echo "   Please create it first by running: ./create-registry-secret.sh"
        echo "   Or apply an existing registry-secret.yaml file"
        read -p "   Continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
else
    echo "✅ Registry secret found"
fi

echo "🔧 Creating ConfigMaps and Secrets..."
kubectl apply -f k8s/config.yaml

echo "🗄️ Deploying PostgreSQL..."
kubectl apply -f k8s/postgres.yaml

echo "💾 Deploying MinIO Storage..."
kubectl apply -f k8s/storage.yaml

echo "🚀 Deploying OpenDrive Application..."
kubectl apply -f k8s/app.yaml

echo "🌐 Creating Ingress..."
kubectl apply -f k8s/ingress.yaml

echo "⏳ Waiting for deployments to be ready..."
kubectl -n opendrive rollout status statefulset/postgres --timeout=300s
kubectl -n opendrive rollout status statefulset/storage --timeout=300s
kubectl -n opendrive rollout status deployment/opendrive-app --timeout=300s

echo "✅ OpenDrive deployed successfully!"
echo ""
echo "📊 Deployment status:"
kubectl -n opendrive get pods,svc,pvc

echo ""
echo "🔍 To check logs:"
echo "  kubectl -n opendrive logs -f deployment/opendrive-app"
echo ""
echo "🌐 To access the application, make sure your domain points to your K3s cluster"
echo "    and update the host in k8s/ingress.yaml"
echo ""
echo "🗑️  To undeploy everything, run: ./undeploy.sh"
