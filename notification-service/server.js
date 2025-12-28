const express = require('express');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3004;

app.use(express.json());

// In-memory notification storage
const notifications = [];

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'notification-service' });
});

// Send notification
app.post('/', async (req, res) => {
  try {
    const { userId, type, orderId, message } = req.body;

    const notification = {
      id: notifications.length + 1,
      userId,
      type,
      orderId,
      message: message || getDefaultMessage(type, orderId),
      sentAt: new Date().toISOString(),
      status: 'sent'
    };

    notifications.push(notification);

    // Simulate sending email/SMS
    console.log(`Notification sent to user ${userId}: ${notification.message}`);

    res.json(notification);
  } catch (error) {
    console.error('Notification error:', error);
    res.status(500).json({ message: 'Failed to send notification' });
  }
});

// Get notifications for user
app.get('/user/:userId', (req, res) => {
  const userNotifications = notifications.filter(
    n => n.userId == req.params.userId
  );
  res.json(userNotifications);
});

function getDefaultMessage(type, orderId) {
  switch (type) {
    case 'order_confirmation':
      return `Your order #${orderId} has been confirmed!`;
    case 'order_shipped':
      return `Your order #${orderId} has been shipped!`;
    case 'order_delivered':
      return `Your order #${orderId} has been delivered!`;
    default:
      return 'You have a new notification';
  }
}

app.listen(PORT, () => {
  console.log(`Notification service running on port ${PORT}`);
});
