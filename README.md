# E-Commerce Microservices on EKS

A complete microservices architecture for learning EKS deployments with 10 interlinked services.

## Architecture Overview

### Services
1. **Frontend Service** (React) - Customer-facing web application
2. **API Gateway** (Node.js) - Routes and authenticates requests
3. **User Service** (Node.js) - User management and authentication
4. **Product Service** (Python/Flask) - Product catalog management
5. **Order Service** (Node.js) - Order processing and management
6. **Payment Service** (Node.js) - Payment processing integration
7. **Inventory Service** (Python/Flask) - Stock and inventory management
8. **Notification Service** (Node.js) - Email/SMS notifications
9. **Review Service** (Node.js) - Product reviews and ratings
10. **Analytics Service** (Python/Flask) - User behavior analytics

### Databases
- **PostgreSQL** - User, Product, Order data
- **MongoDB** - Reviews and Analytics data
- **Redis** - Caching and session management

## Service Communication Flow

```
Frontend → API Gateway → {
    User Service → PostgreSQL
    Product Service → PostgreSQL + Redis
    Order Service → PostgreSQL + Inventory Service + Payment Service
    Payment Service → External API
    Inventory Service → PostgreSQL
    Notification Service → Message Queue
    Review Service → MongoDB
    Analytics Service → MongoDB + Redis
}
```

## Prerequisites

- AWS CLI configured
- eksctl installed
- kubectl installed
- Docker installed
- AWS account with appropriate permissions

## Quick Start

### 1. Create EKS Cluster
```bash
eksctl create cluster \
  --name ecommerce-cluster \
  --region us-west-2 \
  --nodegroup-name standard-workers \
  --node-type t3.medium \
  --nodes 3 \
  --nodes-min 1 \
  --nodes-max 4 \
  --managed
```

### 2. Build Docker Images
```bash
./scripts/build-all.sh
```

### 3. Push to ECR
```bash
./scripts/push-to-ecr.sh
```

### 4. Deploy to EKS
```bash
kubectl apply -f k8s/namespaces/
kubectl apply -f k8s/databases/
kubectl apply -f k8s/services/
kubectl apply -f k8s/ingress/
```

## Project Structure

```
├── services/           # Microservices source code
├── k8s/               # Kubernetes manifests
├── scripts/           # Deployment scripts
└── docs/              # Additional documentation
```

## Monitoring

Access monitoring dashboard:
```bash
kubectl port-forward -n monitoring svc/grafana 3000:3000
```

## Cleanup

```bash
kubectl delete -f k8s/
eksctl delete cluster --name ecommerce-cluster
```
