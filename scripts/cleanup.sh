#!/bin/bash

# Delete the EKS cluster
# Usage: ./cleanup.sh [CLUSTER_NAME] [REGION]

set -e

CLUSTER_NAME=${1:-"ecommerce-cluster"}
REGION=${2:-"us-west-2"}

echo "🗑️  Cleaning up EKS cluster..."
echo "Cluster Name: $CLUSTER_NAME"
echo "Region: $REGION"
echo ""

read -p "Are you sure you want to delete the cluster? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Cleanup cancelled."
    exit 0
fi

# Delete Kubernetes resources
echo "🧹 Deleting Kubernetes resources..."
kubectl delete -f k8s/ingress/ --ignore-not-found=true
kubectl delete -f k8s/services/ --ignore-not-found=true
kubectl delete -f k8s/databases/ --ignore-not-found=true
kubectl delete -f k8s/namespaces/ --ignore-not-found=true

echo ""

# Delete EKS cluster
echo "🗑️  Deleting EKS cluster..."
eksctl delete cluster --name $CLUSTER_NAME --region $REGION

echo ""
echo "✅ Cleanup complete!"
