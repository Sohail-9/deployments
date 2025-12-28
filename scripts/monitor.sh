#!/bin/bash

# Monitor microservices deployment
# Usage: ./monitor.sh

set -e

NAMESPACE="ecommerce"

echo "📊 Monitoring E-Commerce Microservices"
echo "======================================"
echo ""

# Function to get pod status
show_pods() {
    echo "🔍 Pod Status:"
    kubectl get pods -n $NAMESPACE -o wide
    echo ""
}

# Function to get service status
show_services() {
    echo "🌐 Service Status:"
    kubectl get services -n $NAMESPACE
    echo ""
}

# Function to show resource usage
show_resources() {
    echo "💻 Resource Usage:"
    kubectl top pods -n $NAMESPACE 2>/dev/null || echo "Metrics not available. Install metrics-server."
    echo ""
}

# Function to show ingress
show_ingress() {
    echo "🔗 Ingress:"
    kubectl get ingress -n $NAMESPACE
    echo ""
}

# Main monitoring loop
while true; do
    clear
    echo "📊 Monitoring E-Commerce Microservices - $(date)"
    echo "======================================"
    echo ""
    
    show_pods
    show_services
    show_ingress
    show_resources
    
    echo "Press Ctrl+C to exit"
    sleep 10
done
