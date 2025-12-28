import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Login.css';

const API_GATEWAY = process.env.REACT_APP_API_GATEWAY || 'http://localhost:3000';

function Login({ setUser }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignup, setIsSignup] = useState(false);
  const [name, setName] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const endpoint = isSignup ? '/api/users/signup' : '/api/users/login';
      const data = isSignup ? { name, email, password } : { email, password };
      
      const response = await axios.post(`${API_GATEWAY}${endpoint}`, data);
      
      localStorage.setItem('token', response.data.token);
      setUser(response.data.user);
      navigate('/');
    } catch (error) {
      alert(error.response?.data?.message || 'Authentication failed');
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>{isSignup ? 'Sign Up' : 'Login'}</h2>
        <form onSubmit={handleSubmit}>
          {isSignup && (
            <div className="form-group">
              <label>Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          )}
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="submit-btn">
            {isSignup ? 'Sign Up' : 'Login'}
          </button>
        </form>
        <p className="toggle-text">
          {isSignup ? 'Already have an account?' : "Don't have an account?"}
          <button onClick={() => setIsSignup(!isSignup)} className="toggle-btn">
            {isSignup ? 'Login' : 'Sign Up'}
          </button>
        </p>
      </div>
    </div>
  );
}

export default Login;
