#!/bin/bash

# Deploy all services to EKS
# Usage: ./deploy-to-eks.sh

set -e

echo "🚀 Deploying E-Commerce microservices to EKS..."
echo ""

# Check kubectl connection
echo "🔍 Checking kubectl connection..."
kubectl cluster-info
echo ""

# Create namespace
echo "📦 Creating namespace..."
kubectl apply -f k8s/namespaces/
echo ""

# Deploy databases
echo "💾 Deploying databases..."
kubectl apply -f k8s/databases/
echo "⏳ Waiting for databases to be ready..."
kubectl wait --for=condition=ready pod -l app=postgres -n ecommerce --timeout=300s
kubectl wait --for=condition=ready pod -l app=mongodb -n ecommerce --timeout=300s
kubectl wait --for=condition=ready pod -l app=redis -n ecommerce --timeout=180s
echo ""

# Deploy services
echo "🔧 Deploying microservices..."
kubectl apply -f k8s/services/
echo "⏳ Waiting for services to be ready..."
sleep 30
echo ""

# Deploy ingress
echo "🌐 Deploying ingress..."
kubectl apply -f k8s/ingress/
echo ""

# Show deployment status
echo "📊 Deployment Status:"
echo ""
kubectl get pods -n ecommerce
echo ""
kubectl get services -n ecommerce
echo ""
kubectl get ingress -n ecommerce
echo ""

echo "✅ Deployment complete!"
echo ""
echo "To check the status:"
echo "  kubectl get all -n ecommerce"
echo ""
echo "To get the frontend URL:"
echo "  kubectl get ingress -n ecommerce"
echo ""
echo "To view logs:"
echo "  kubectl logs -f deployment/<service-name> -n ecommerce"
