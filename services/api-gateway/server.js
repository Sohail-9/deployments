const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const axios = require('axios');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Service URLs
const SERVICES = {
  user: process.env.USER_SERVICE_URL || 'http://user-service:3001',
  product: process.env.PRODUCT_SERVICE_URL || 'http://product-service:5001',
  order: process.env.ORDER_SERVICE_URL || 'http://order-service:3002',
  payment: process.env.PAYMENT_SERVICE_URL || 'http://payment-service:3003',
  inventory: process.env.INVENTORY_SERVICE_URL || 'http://inventory-service:5002',
  notification: process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:3004',
  review: process.env.REVIEW_SERVICE_URL || 'http://review-service:3005',
  analytics: process.env.ANALYTICS_SERVICE_URL || 'http://analytics-service:5003'
};

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('combined'));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'api-gateway' });
});

// Proxy helper function
const proxyRequest = async (req, res, serviceUrl) => {
  try {
    const config = {
      method: req.method,
      url: serviceUrl + req.path,
      data: req.body,
      headers: {
        ...req.headers,
        host: new URL(serviceUrl).host
      },
      params: req.query
    };

    const response = await axios(config);
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error(`Proxy error for ${serviceUrl}:`, error.message);
    res.status(error.response?.status || 500).json({
      message: error.response?.data?.message || 'Service unavailable'
    });
  }
};

// User Service routes
app.post('/api/users/signup', (req, res) => proxyRequest(req, res, SERVICES.user));
app.post('/api/users/login', (req, res) => proxyRequest(req, res, SERVICES.user));
app.get('/api/users/me', authenticateToken, (req, res) => proxyRequest(req, res, SERVICES.user));
app.get('/api/users/:id', authenticateToken, (req, res) => proxyRequest(req, res, SERVICES.user));

// Product Service routes
app.get('/api/products', (req, res) => proxyRequest(req, res, SERVICES.product));
app.get('/api/products/:id', (req, res) => proxyRequest(req, res, SERVICES.product));
app.post('/api/products', authenticateToken, (req, res) => proxyRequest(req, res, SERVICES.product));
app.put('/api/products/:id', authenticateToken, (req, res) => proxyRequest(req, res, SERVICES.product));
app.delete('/api/products/:id', authenticateToken, (req, res) => proxyRequest(req, res, SERVICES.product));

// Order Service routes
app.get('/api/orders', authenticateToken, (req, res) => proxyRequest(req, res, SERVICES.order));
app.get('/api/orders/:id', authenticateToken, (req, res) => proxyRequest(req, res, SERVICES.order));
app.post('/api/orders', authenticateToken, (req, res) => proxyRequest(req, res, SERVICES.order));
app.put('/api/orders/:id', authenticateToken, (req, res) => proxyRequest(req, res, SERVICES.order));

// Payment Service routes
app.post('/api/payments', authenticateToken, (req, res) => proxyRequest(req, res, SERVICES.payment));
app.get('/api/payments/:id', authenticateToken, (req, res) => proxyRequest(req, res, SERVICES.payment));

// Inventory Service routes
app.get('/api/inventory/:productId', (req, res) => proxyRequest(req, res, SERVICES.inventory));
app.post('/api/inventory/check', (req, res) => proxyRequest(req, res, SERVICES.inventory));
app.put('/api/inventory/:productId', authenticateToken, (req, res) => proxyRequest(req, res, SERVICES.inventory));

// Notification Service routes
app.post('/api/notifications', authenticateToken, (req, res) => proxyRequest(req, res, SERVICES.notification));

// Review Service routes
app.get('/api/reviews/product/:productId', (req, res) => proxyRequest(req, res, SERVICES.review));
app.post('/api/reviews', authenticateToken, (req, res) => proxyRequest(req, res, SERVICES.review));
app.put('/api/reviews/:id', authenticateToken, (req, res) => proxyRequest(req, res, SERVICES.review));
app.delete('/api/reviews/:id', authenticateToken, (req, res) => proxyRequest(req, res, SERVICES.review));

// Analytics Service routes
app.get('/api/analytics/dashboard', authenticateToken, (req, res) => proxyRequest(req, res, SERVICES.analytics));
app.post('/api/analytics/event', (req, res) => proxyRequest(req, res, SERVICES.analytics));

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
  console.log('Service endpoints:', SERVICES);
});
