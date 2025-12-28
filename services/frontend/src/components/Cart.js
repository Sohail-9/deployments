import React from 'react';
import axios from 'axios';
import './Cart.css';

const API_GATEWAY = process.env.REACT_APP_API_GATEWAY || 'http://localhost:3000';

function Cart({ cart, setCart, user }) {
  const total = cart.reduce((sum, item) => sum + item.price, 0);

  const handleCheckout = async () => {
    if (!user) {
      alert('Please login to checkout');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_GATEWAY}/api/orders`,
        {
          items: cart.map(item => ({ productId: item.id, quantity: 1 })),
          total
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      alert('Order placed successfully!');
      setCart([]);
    } catch (error) {
      alert('Failed to place order: ' + error.message);
    }
  };

  const removeItem = (index) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  if (cart.length === 0) {
    return (
      <div className="cart-empty">
        <h2>Your cart is empty</h2>
        <p>Add some products to get started!</p>
      </div>
    );
  }

  return (
    <div className="cart">
      <h2>Shopping Cart</h2>
      <div className="cart-items">
        {cart.map((item, index) => (
          <div key={index} className="cart-item">
            <div className="item-info">
              <h3>{item.name}</h3>
              <p className="item-price">${item.price}</p>
            </div>
            <button 
              className="remove-btn"
              onClick={() => removeItem(index)}
            >
              Remove
            </button>
          </div>
        ))}
      </div>
      <div className="cart-summary">
        <div className="total">
          <span>Total:</span>
          <span className="total-amount">${total.toFixed(2)}</span>
        </div>
        <button className="checkout-btn" onClick={handleCheckout}>
          Proceed to Checkout
        </button>
      </div>
    </div>
  );
}

export default Cart;
