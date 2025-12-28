#!/bin/bash

# Create an EKS cluster using eksctl
# Usage: ./create-eks-cluster.sh [CLUSTER_NAME] [REGION]

set -e

CLUSTER_NAME=${1:-"ecommerce-cluster"}
REGION=${2:-"us-west-2"}

echo "🏗️  Creating EKS cluster..."
echo "Cluster Name: $CLUSTER_NAME"
echo "Region: $REGION"
echo ""

# Check if eksctl is installed
if ! command -v eksctl &> /dev/null; then
    echo "❌ eksctl is not installed. Please install it first:"
    echo "   brew install eksctl"
    exit 1
fi

# Create cluster
eksctl create cluster \
    --name $CLUSTER_NAME \
    --region $REGION \
    --nodegroup-name standard-workers \
    --node-type t3.medium \
    --nodes 3 \
    --nodes-min 2 \
    --nodes-max 5 \
    --managed \
    --with-oidc \
    --ssh-access \
    --ssh-public-key ~/.ssh/id_rsa.pub \
    --full-ecr-access

echo ""
echo "✅ EKS cluster created successfully!"
echo ""

# Install AWS Load Balancer Controller
echo "🔧 Installing AWS Load Balancer Controller..."
kubectl apply -k "github.com/aws/eks-charts/stable/aws-load-balancer-controller//crds?ref=master"

helm repo add eks https://aws.github.io/eks-charts
helm repo update

helm install aws-load-balancer-controller eks/aws-load-balancer-controller \
    -n kube-system \
    --set clusterName=$CLUSTER_NAME \
    --set serviceAccount.create=false \
    --set serviceAccount.name=aws-load-balancer-controller

echo ""
echo "✅ Cluster setup complete!"
echo ""
echo "Next steps:"
echo "1. Build and push images: ./scripts/build-all.sh && ./scripts/push-to-ecr.sh"
echo "2. Update manifests: ./scripts/update-k8s-images.sh <YOUR_ECR_REGISTRY>"
echo "3. Deploy services: ./scripts/deploy-to-eks.sh"
