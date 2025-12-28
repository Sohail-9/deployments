#!/bin/bash

# Push all Docker images to AWS ECR
# Usage: ./push-to-ecr.sh [ECR_REGISTRY] [AWS_REGION]

set -e

ECR_REGISTRY=${1:-"YOUR_ECR_REGISTRY"}
AWS_REGION=${2:-"us-west-2"}
VERSION=${3:-"latest"}

echo "🚀 Pushing images to AWS ECR..."
echo "Registry: $ECR_REGISTRY"
echo "Region: $AWS_REGION"
echo "Version: $VERSION"
echo ""

# Login to ECR
echo "🔑 Logging in to AWS ECR..."
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_REGISTRY

# Array of services
declare -a services=(
    "frontend"
    "api-gateway"
    "user-service"
    "product-service"
    "order-service"
    "payment-service"
    "inventory-service"
    "notification-service"
    "review-service"
    "analytics-service"
)

# Create ECR repositories if they don't exist
echo "📋 Creating ECR repositories..."
for service in "${services[@]}"
do
    aws ecr describe-repositories --repository-names "ecommerce-$service" --region $AWS_REGION 2>/dev/null || \
    aws ecr create-repository --repository-name "ecommerce-$service" --region $AWS_REGION
done

echo ""

# Push each service
for service in "${services[@]}"
do
    echo "⬆️  Pushing ecommerce-$service..."
    docker push "$ECR_REGISTRY/ecommerce-$service:$VERSION"
    echo "✅ ecommerce-$service pushed successfully"
    echo ""
done

echo "🎉 All images pushed successfully!"
echo ""
echo "Next steps:"
echo "1. Update k8s manifests: ./scripts/update-k8s-images.sh $ECR_REGISTRY"
echo "2. Deploy to EKS: ./scripts/deploy-to-eks.sh"
