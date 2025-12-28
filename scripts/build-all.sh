#!/bin/bash

# Build all Docker images for the E-Commerce microservices
# Usage: ./build-all.sh [ECR_REGISTRY]

set -e

ECR_REGISTRY=${1:-"YOUR_ECR_REGISTRY"}
VERSION=${2:-"latest"}

echo "🏗️  Building all microservices Docker images..."
echo "Registry: $ECR_REGISTRY"
echo "Version: $VERSION"
echo ""

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

# Build each service
for service in "${services[@]}"
do
    echo "📦 Building $service..."
    cd "$service"
    
    docker build -t "ecommerce-$service:$VERSION" .
    docker tag "ecommerce-$service:$VERSION" "$ECR_REGISTRY/ecommerce-$service:$VERSION"
    
    echo "✅ $service built successfully"
    cd ..
    echo ""
done

echo "🎉 All services built successfully!"
echo ""
echo "Next steps:"
echo "1. Push images to ECR: ./scripts/push-to-ecr.sh $ECR_REGISTRY"
echo "2. Update k8s manifests with your ECR registry"
echo "3. Deploy to EKS: kubectl apply -f k8s/"
