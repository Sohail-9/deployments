#!/bin/bash

# Test microservices connectivity
# Usage: ./test-services.sh

set -e

NAMESPACE="ecommerce"

echo "🧪 Testing E-Commerce Microservices"
echo "===================================="
echo ""

# Get API Gateway service
API_GATEWAY=$(kubectl get svc api-gateway -n $NAMESPACE -o jsonpath='{.spec.clusterIP}')
echo "API Gateway: $API_GATEWAY"
echo ""

# Port forward API Gateway
echo "Setting up port forwarding..."
kubectl port-forward -n $NAMESPACE svc/api-gateway 8080:3000 &
PORT_FORWARD_PID=$!

# Wait for port forward to be ready
sleep 5

# Test endpoints
echo ""
echo "Testing endpoints..."
echo ""

# Health check
echo "1. Testing API Gateway health..."
curl -s http://localhost:8080/health | jq . || echo "Failed"
echo ""

# Product list
echo "2. Testing Product Service..."
curl -s http://localhost:8080/api/products | jq '.[0:2]' || echo "Failed"
echo ""

# Test signup
echo "3. Testing User Service (Signup)..."
curl -s -X POST http://localhost:8080/api/users/signup \
    -H "Content-Type: application/json" \
    -d '{"name":"Test User","email":"test@example.com","password":"password123"}' | jq . || echo "Failed"
echo ""

# Cleanup
kill $PORT_FORWARD_PID
echo ""
echo "✅ Tests complete!"
