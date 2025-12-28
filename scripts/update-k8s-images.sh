#!/bin/bash

# Update Kubernetes manifests with ECR registry URL
# Usage: ./update-k8s-images.sh ECR_REGISTRY

set -e

ECR_REGISTRY=${1}

if [ -z "$ECR_REGISTRY" ]; then
    echo "❌ Error: ECR registry URL required"
    echo "Usage: ./update-k8s-images.sh <ECR_REGISTRY>"
    echo "Example: ./update-k8s-images.sh 123456789012.dkr.ecr.us-west-2.amazonaws.com"
    exit 1
fi

echo "🔧 Updating Kubernetes manifests with ECR registry: $ECR_REGISTRY"
echo ""

# Update all service manifests
find k8s/services -name "*.yaml" -type f -exec sed -i.bak "s|<YOUR_ECR_REGISTRY>|$ECR_REGISTRY|g" {} \;

# Remove backup files
find k8s/services -name "*.bak" -type f -delete

echo "✅ Kubernetes manifests updated successfully!"
echo ""
echo "Updated files in k8s/services/"
ls -la k8s/services/*.yaml
echo ""
echo "Next step: ./scripts/deploy-to-eks.sh"
