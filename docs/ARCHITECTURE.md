# Service Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                          Load Balancer                           │
│                        (AWS ALB/Ingress)                         │
└───────────────────────────┬─────────────────────────────────────┘
                            │
            ┌───────────────┴────────────────┐
            │                                │
    ┌───────▼────────┐              ┌───────▼────────┐
    │   Frontend     │              │  API Gateway   │
    │    (React)     │              │   (Node.js)    │
    │   Port: 80     │              │   Port: 3000   │
    └────────────────┘              └───────┬────────┘
                                            │
                    ┌───────────────────────┼────────────────────┐
                    │                       │                    │
          ┌─────────▼─────────┐  ┌─────────▼─────────┐  ┌──────▼──────┐
          │   User Service    │  │ Product Service   │  │   Order     │
          │    (Node.js)      │  │    (Python)       │  │  Service    │
          │   Port: 3001      │  │   Port: 5001      │  │  (Node.js)  │
          └─────────┬─────────┘  └─────────┬─────────┘  └──────┬──────┘
                    │                      │                    │
                    │                      │              ┌─────┴──────┐
          ┌─────────▼─────────┐  ┌─────────▼─────────┐  │            │
          │   PostgreSQL      │  │   PostgreSQL      │  │  Payment   │
          │     (userdb)      │  │   (productdb)     │  │  Service   │
          └───────────────────┘  └─────────┬─────────┘  │ (Node.js)  │
                                           │            │ Port: 3003 │
                                 ┌─────────▼─────────┐  └────────────┘
                                 │      Redis        │
                                 │     (Cache)       │
                                 └───────────────────┘

          ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
          │   Inventory     │  │  Notification   │  │     Review      │
          │    Service      │  │    Service      │  │    Service      │
          │   (Python)      │  │   (Node.js)     │  │   (Node.js)     │
          │   Port: 5002    │  │   Port: 3004    │  │   Port: 3005    │
          └────────┬────────┘  └─────────────────┘  └────────┬────────┘
                   │                                          │
          ┌────────▼────────┐                        ┌────────▼────────┐
          │   PostgreSQL    │                        │    MongoDB      │
          │  (inventorydb)  │                        │   (reviewdb)    │
          └─────────────────┘                        └─────────────────┘

          ┌─────────────────┐
          │   Analytics     │
          │    Service      │
          │   (Python)      │
          │   Port: 5003    │
          └────────┬────────┘
                   │
          ┌────────▼────────┐
          │    MongoDB      │
          │  (analyticsdb)  │
          └─────────────────┘
```

## Service Communication Flow

### 1. User Authentication Flow
```
Frontend → API Gateway → User Service → PostgreSQL
                                ↓
                          JWT Token
                                ↓
                         Store in Redis
```

### 2. Product Browsing Flow
```
Frontend → API Gateway → Product Service → Check Redis Cache
                                ↓
                         If cache miss → PostgreSQL
                                ↓
                         Update Redis Cache
                                ↓
                         Return Products
```

### 3. Order Creation Flow
```
Frontend → API Gateway → Order Service
                            ↓
                    ┌───────┼───────┐
                    │       │       │
           Inventory    Payment   Notification
            Service     Service     Service
                ↓          ↓           ↓
          Check Stock  Process   Send Email
                ↓      Payment      ↓
           Update DB      ↓      Confirm
                ↓         ↓
           PostgreSQL  Complete
                         ↓
                    Order Saved
```

### 4. Review Submission Flow
```
Frontend → API Gateway → Review Service → MongoDB
                            ↓
                     Analytics Service
                            ↓
                     Track Event
                            ↓
                        MongoDB
```

## Service Dependencies

### Frontend
- **Dependencies:** API Gateway
- **Purpose:** User interface
- **Technology:** React

### API Gateway
- **Dependencies:** All backend services
- **Purpose:** Request routing, authentication
- **Technology:** Node.js + Express

### User Service
- **Dependencies:** PostgreSQL, JWT
- **Purpose:** User management, authentication
- **Technology:** Node.js + Express
- **Database:** PostgreSQL (userdb)

### Product Service
- **Dependencies:** PostgreSQL, Redis
- **Purpose:** Product catalog management
- **Technology:** Python + Flask
- **Database:** PostgreSQL (productdb)
- **Cache:** Redis

### Order Service
- **Dependencies:** PostgreSQL, Inventory, Payment, Notification services
- **Purpose:** Order processing
- **Technology:** Node.js + Express
- **Database:** PostgreSQL (orderdb)

### Payment Service
- **Dependencies:** None (simulated)
- **Purpose:** Payment processing
- **Technology:** Node.js + Express
- **Storage:** In-memory (demo)

### Inventory Service
- **Dependencies:** PostgreSQL
- **Purpose:** Stock management
- **Technology:** Python + Flask
- **Database:** PostgreSQL (inventorydb)

### Notification Service
- **Dependencies:** None
- **Purpose:** Send notifications
- **Technology:** Node.js + Express
- **Storage:** In-memory (demo)

### Review Service
- **Dependencies:** MongoDB
- **Purpose:** Product reviews
- **Technology:** Node.js + Express
- **Database:** MongoDB (reviewdb)

### Analytics Service
- **Dependencies:** MongoDB, Redis
- **Purpose:** User behavior tracking
- **Technology:** Python + Flask
- **Database:** MongoDB (analyticsdb)
- **Cache:** Redis

## Database Schema

### PostgreSQL - userdb
```sql
users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(255) UNIQUE,
    password_hash VARCHAR(255),
    created_at TIMESTAMP,
    updated_at TIMESTAMP
)
```

### PostgreSQL - productdb
```sql
products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    description TEXT,
    price DECIMAL(10, 2),
    stock INTEGER,
    image VARCHAR(500),
    category VARCHAR(100),
    created_at TIMESTAMP,
    updated_at TIMESTAMP
)
```

### PostgreSQL - orderdb
```sql
orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    total DECIMAL(10, 2),
    status VARCHAR(50),
    created_at TIMESTAMP,
    updated_at TIMESTAMP
)

order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id),
    product_id INTEGER,
    quantity INTEGER,
    price DECIMAL(10, 2)
)
```

### PostgreSQL - inventorydb
```sql
inventory (
    id SERIAL PRIMARY KEY,
    product_id INTEGER UNIQUE,
    quantity INTEGER,
    reserved INTEGER,
    updated_at TIMESTAMP
)
```

### MongoDB - reviewdb
```javascript
reviews {
    _id: ObjectId,
    productId: Number,
    userId: Number,
    rating: Number (1-5),
    comment: String,
    createdAt: Date,
    updatedAt: Date
}
```

### MongoDB - analyticsdb
```javascript
events {
    _id: ObjectId,
    userId: Number,
    eventType: String,
    metadata: Object,
    timestamp: Date
}
```

## API Endpoints

### User Service
- `POST /signup` - Create account
- `POST /login` - User login
- `GET /me` - Get current user
- `GET /:id` - Get user by ID

### Product Service
- `GET /` - List all products
- `GET /:id` - Get product details
- `POST /` - Create product (admin)
- `PUT /:id` - Update product (admin)
- `DELETE /:id` - Delete product (admin)

### Order Service
- `GET /` - List user orders
- `GET /:id` - Get order details
- `POST /` - Create order
- `PUT /:id` - Update order status

### Payment Service
- `POST /` - Process payment
- `GET /:id` - Get payment details
- `GET /order/:orderId` - Get order payments

### Inventory Service
- `GET /:productId` - Get inventory
- `POST /check` - Check availability
- `PUT /:productId` - Update inventory

### Notification Service
- `POST /` - Send notification
- `GET /user/:userId` - Get user notifications

### Review Service
- `GET /product/:productId` - Get product reviews
- `POST /` - Create review
- `PUT /:id` - Update review
- `DELETE /:id` - Delete review

### Analytics Service
- `POST /event` - Track event
- `GET /dashboard` - Get analytics dashboard
- `GET /user/:userId` - Get user analytics

## Scaling Considerations

### Horizontal Scaling
- All services support multiple replicas
- Stateless design (except databases)
- Load balancing through Kubernetes services

### Vertical Scaling
- Adjust resource requests/limits in deployments
- Monitor with Kubernetes metrics

### Database Scaling
- PostgreSQL: Consider read replicas
- MongoDB: Use sharding for large collections
- Redis: Use clustering for high throughput

## Security

- JWT-based authentication
- Secrets managed through Kubernetes Secrets
- Network policies for inter-service communication
- HTTPS termination at load balancer
- Database credentials stored securely

## Monitoring & Logging

- Health checks for all services
- Liveness and readiness probes
- Centralized logging (recommended: ELK stack)
- Metrics collection (recommended: Prometheus + Grafana)
