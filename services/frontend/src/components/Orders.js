import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Orders.css';

const API_GATEWAY = process.env.REACT_APP_API_GATEWAY || 'http://localhost:3000';

function Orders({ user }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_GATEWAY}/api/orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrders(response.data);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <div className="orders-message">Please login to view orders</div>;
  }

  if (loading) {
    return <div className="orders-message">Loading orders...</div>;
  }

  if (orders.length === 0) {
    return <div className="orders-message">No orders yet</div>;
  }

  return (
    <div className="orders">
      <h2>My Orders</h2>
      <div className="orders-list">
        {orders.map(order => (
          <div key={order.id} className="order-card">
            <div className="order-header">
              <span className="order-id">Order #{order.id}</span>
              <span className={`order-status ${order.status}`}>{order.status}</span>
            </div>
            <div className="order-details">
              <p>Date: {new Date(order.createdAt).toLocaleDateString()}</p>
              <p className="order-total">Total: ${order.total}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Orders;
