const express = require('express');
const { Pool } = require('pg');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3002;

const pool = new Pool({
  host: process.env.DB_HOST || 'postgres',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'orderdb',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres'
});

app.use(express.json());

const INVENTORY_SERVICE = process.env.INVENTORY_SERVICE_URL || 'http://inventory-service:5002';
const PAYMENT_SERVICE = process.env.PAYMENT_SERVICE_URL || 'http://payment-service:3003';
const NOTIFICATION_SERVICE = process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:3004';

const initDB = async () => {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        total DECIMAL(10, 2) NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
        product_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        price DECIMAL(10, 2) NOT NULL
      )
    `);
    
    console.log('Order database initialized');
  } catch (error) {
    console.error('Database initialization error:', error);
  } finally {
    client.release();
  }
};

initDB();

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'order-service' });
});

// Get all orders for a user
app.get('/', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(400).json({ message: 'User ID required' });
    }

    const result = await pool.query(
      'SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get order by ID
app.get('/:id', async (req, res) => {
  try {
    const orderResult = await pool.query(
      'SELECT * FROM orders WHERE id = $1',
      [req.params.id]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const itemsResult = await pool.query(
      'SELECT * FROM order_items WHERE order_id = $1',
      [req.params.id]
    );

    const order = orderResult.rows[0];
    order.items = itemsResult.rows;

    res.json(order);
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create order
app.post('/', async (req, res) => {
  const client = await pool.connect();
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(400).json({ message: 'User ID required' });
    }

    const { items, total } = req.body;

    await client.query('BEGIN');

    // Check inventory
    try {
      await axios.post(`${INVENTORY_SERVICE}/check`, { items });
    } catch (error) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Insufficient inventory' });
    }

    // Create order
    const orderResult = await client.query(
      'INSERT INTO orders (user_id, total, status) VALUES ($1, $2, $3) RETURNING *',
      [userId, total, 'pending']
    );

    const order = orderResult.rows[0];

    // Create order items
    for (const item of items) {
      await client.query(
        'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)',
        [order.id, item.productId, item.quantity, item.price || 0]
      );

      // Update inventory
      await axios.put(`${INVENTORY_SERVICE}/${item.productId}`, {
        quantity: -item.quantity
      });
    }

    // Process payment
    try {
      await axios.post(`${PAYMENT_SERVICE}`, {
        orderId: order.id,
        amount: total,
        userId
      });
      
      await client.query(
        'UPDATE orders SET status = $1 WHERE id = $2',
        ['completed', order.id]
      );
      order.status = 'completed';
    } catch (error) {
      await client.query(
        'UPDATE orders SET status = $1 WHERE id = $2',
        ['payment_failed', order.id]
      );
      order.status = 'payment_failed';
    }

    await client.query('COMMIT');

    // Send notification
    try {
      await axios.post(`${NOTIFICATION_SERVICE}`, {
        userId,
        type: 'order_confirmation',
        orderId: order.id
      });
    } catch (error) {
      console.error('Notification error:', error);
    }

    res.status(201).json(order);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create order error:', error);
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    client.release();
  }
});

// Update order status
app.put('/:id', async (req, res) => {
  try {
    const { status } = req.body;

    const result = await pool.query(
      'UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [status, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update order error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`Order service running on port ${PORT}`);
});
