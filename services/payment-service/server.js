const express = require('express');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3003;

app.use(express.json());

// In-memory payment storage (for demo purposes)
const payments = new Map();
let paymentIdCounter = 1;

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'payment-service' });
});

// Process payment
app.post('/', async (req, res) => {
  try {
    const { orderId, amount, userId } = req.body;

    // Simulate payment processing
    const success = Math.random() > 0.1; // 90% success rate

    const payment = {
      id: paymentIdCounter++,
      orderId,
      amount,
      userId,
      status: success ? 'completed' : 'failed',
      transactionId: `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString()
    };

    payments.set(payment.id, payment);

    if (success) {
      res.json(payment);
    } else {
      res.status(400).json({ message: 'Payment failed', payment });
    }
  } catch (error) {
    console.error('Payment processing error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get payment by ID
app.get('/:id', (req, res) => {
  const payment = payments.get(parseInt(req.params.id));
  
  if (!payment) {
    return res.status(404).json({ message: 'Payment not found' });
  }

  res.json(payment);
});

// Get payments by order ID
app.get('/order/:orderId', (req, res) => {
  const orderPayments = Array.from(payments.values())
    .filter(p => p.orderId == req.params.orderId);
  
  res.json(orderPayments);
});

app.listen(PORT, () => {
  console.log(`Payment service running on port ${PORT}`);
});
