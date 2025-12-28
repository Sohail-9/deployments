import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './App.css';
import ProductList from './components/ProductList';
import Cart from './components/Cart';
import Login from './components/Login';
import Orders from './components/Orders';

const API_GATEWAY = process.env.REACT_APP_API_GATEWAY || 'http://localhost:3000';

function App() {
  const [user, setUser] = useState(null);
  const [cart, setCart] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchUser(token);
    }
  }, []);

  const fetchUser = async (token) => {
    try {
      const response = await fetch(`${API_GATEWAY}/api/users/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setCart([]);
  };

  const addToCart = (product) => {
    setCart([...cart, product]);
  };

  return (
    <Router>
      <div className="App">
        <nav className="navbar">
          <div className="nav-content">
            <Link to="/" className="logo">E-Commerce</Link>
            <div className="nav-links">
              <Link to="/">Products</Link>
              <Link to="/cart">Cart ({cart.length})</Link>
              {user ? (
                <>
                  <Link to="/orders">Orders</Link>
                  <span className="user-info">Hello, {user.name}</span>
                  <button onClick={handleLogout}>Logout</button>
                </>
              ) : (
                <Link to="/login">Login</Link>
              )}
            </div>
          </div>
        </nav>

        <main className="main-content">
          <Routes>
            <Route path="/" element={<ProductList addToCart={addToCart} user={user} />} />
            <Route path="/cart" element={<Cart cart={cart} setCart={setCart} user={user} />} />
            <Route path="/login" element={<Login setUser={setUser} />} />
            <Route path="/orders" element={<Orders user={user} />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
