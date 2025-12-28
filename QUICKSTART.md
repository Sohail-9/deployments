# 🚀 Quick Start Guide

## What You Have

A complete **E-Commerce Microservices Platform** with:

✅ **10 Microservices:**
1. Frontend (React)
2. API Gateway (Node.js)
3. User Service (Node.js + PostgreSQL)
4. Product Service (Python + PostgreSQL + Redis)
5. Order Service (Node.js + PostgreSQL)
6. Payment Service (Node.js)
7. Inventory Service (Python + PostgreSQL)
8. Notification Service (Node.js)
9. Review Service (Node.js + MongoDB)
10. Analytics Service (Python + MongoDB + Redis)

✅ **3 Databases:**
- PostgreSQL (User, Product, Order, Inventory data)
- MongoDB (Reviews, Analytics)
- Redis (Caching)

✅ **Complete Kubernetes Deployment:**
- Production-ready manifests
- Automated deployment scripts
- Database configurations
- Ingress setup

## Two Ways to Run

### Option 1: Local Development (Easiest)

Perfect for learning and testing without AWS costs.

```bash
cd /Users/sohail/deployments

# Start everything
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f

# Access application
open http://localhost
```

**Services will be available at:**
- Frontend: http://localhost
- API: http://localhost:3000/api/products

📖 **Full guide:** [docs/LOCAL_DEVELOPMENT.md](docs/LOCAL_DEVELOPMENT.md)

### Option 2: Deploy to AWS EKS (Production)

Deploy to real Kubernetes cluster on AWS.

```bash
cd /Users/sohail/deployments

# 1. Create EKS cluster (15-20 minutes)
./scripts/create-eks-cluster.sh

# 2. Get your ECR registry
export ECR_REGISTRY="YOUR_ACCOUNT_ID.dkr.ecr.us-west-2.amazonaws.com"

# 3. Build Docker images
./scripts/build-all.sh $ECR_REGISTRY

# 4. Push to ECR
./scripts/push-to-ecr.sh $ECR_REGISTRY us-west-2

# 5. Update manifests
./scripts/update-k8s-images.sh $ECR_REGISTRY

# 6. Deploy to EKS
./scripts/deploy-to-eks.sh

# 7. Get your application URL
kubectl get ingress -n ecommerce
```

📖 **Full guide:** [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)

## What to Learn

### Week 1: Basics
- Run locally with docker-compose
- Explore the services
- Make API calls
- View databases

### Week 2: Kubernetes
- Deploy to local Kubernetes (minikube)
- Learn pods, services, deployments
- Practice scaling
- Monitor logs

### Week 3: AWS EKS
- Create EKS cluster
- Deploy services
- Configure ingress
- Monitor performance

### Week 4: Advanced
- Add new features
- Implement CI/CD
- Add monitoring
- Security hardening

📖 **Learning path:** [docs/LEARNING_EXERCISES.md](docs/LEARNING_EXERCISES.md)

## Architecture Overview

```
Frontend (React)
     ↓
API Gateway (Node.js)
     ↓
├── User Service → PostgreSQL
├── Product Service → PostgreSQL + Redis
├── Order Service → PostgreSQL + Payment + Inventory + Notification
├── Payment Service
├── Inventory Service → PostgreSQL
├── Notification Service
├── Review Service → MongoDB
└── Analytics Service → MongoDB + Redis
```

📖 **Detailed architecture:** [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)

## Key Commands

### Local Development
```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f [service-name]

# Rebuild service
docker-compose build [service-name]

# Clean everything
docker-compose down -v
```

### Kubernetes (EKS)
```bash
# View all pods
kubectl get pods -n ecommerce

# View logs
kubectl logs -f deployment/api-gateway -n ecommerce

# Scale service
kubectl scale deployment product-service -n ecommerce --replicas=3

# Update image
kubectl set image deployment/product-service product-service=newimage:tag -n ecommerce

# Monitor
./scripts/monitor.sh
```

### Cleanup
```bash
# Local
docker-compose down -v

# EKS
./scripts/cleanup.sh
```

## Testing the Application

### Create User
```bash
curl -X POST http://localhost:3000/api/users/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com","password":"password123"}'
```

### Get Products
```bash
curl http://localhost:3000/api/products
```

### Place Order (requires login token)
```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"items":[{"productId":1,"quantity":2}],"total":1999.98}'
```

## Project Structure

```
deployments/
├── services/          # 10 microservices source code
├── k8s/              # Kubernetes manifests
├── scripts/          # Deployment automation
├── docs/             # Documentation
├── docker-compose.yml # Local development
└── README.md         # Main documentation
```

## Next Steps

1. **Start Local:** Run `docker-compose up -d`
2. **Explore:** Visit http://localhost and test the app
3. **Read Docs:** Check out the documentation in `docs/`
4. **Learn:** Follow exercises in `LEARNING_EXERCISES.md`
5. **Deploy:** When ready, deploy to EKS

## Resources

- 📚 [Architecture Details](docs/ARCHITECTURE.md)
- 🚀 [Deployment Guide](docs/DEPLOYMENT.md)
- 💻 [Local Development](docs/LOCAL_DEVELOPMENT.md)
- 📝 [Learning Exercises](docs/LEARNING_EXERCISES.md)

## Getting Help

- Check logs: `docker-compose logs [service]`
- View pod status: `kubectl describe pod [pod-name] -n ecommerce`
- Test endpoints: `./scripts/test-services.sh`
- Monitor: `./scripts/monitor.sh`

## Cost Considerations

### Local (Free)
- Uses only your computer resources
- No cloud costs

### AWS EKS ($$$)
- EKS cluster: ~$0.10/hour
- EC2 nodes: ~$0.30/hour (3 t3.medium)
- Load balancer: ~$0.03/hour
- **Total: ~$10/day or ~$300/month**

💡 **Tip:** Delete cluster when not in use: `./scripts/cleanup.sh`

## Support

If you encounter issues:
1. Check the logs
2. Review documentation
3. Test with docker-compose first
4. Verify AWS credentials and permissions

Happy Learning! 🎉

---

**Built for EKS Learning** | Contains 10 interlinked microservices with databases
